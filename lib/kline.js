/**
 * 美国收盘报 · K 线数据层。
 *
 * 首选富途 quote-api 的 get-kline（日/周/月/季/年）。富途对无登录的
 * quote-api 有较强的风控，Node fetch 很容易被 302 到 /403；这里用系统
 * curl 的 TLS 栈尝试一次，失败后回退到东方财富的美股 K 线接口。
 * 5 分钟线富途网页本身不提供，直接使用东方财富。
 *
 * 所有返回值都带 source，前端会明确标注数据来源。
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  futuCookieHeader,
  quoteToken,
  serializeQuery,
  KLINE_TYPE,
} from './futu.js'

const execFileAsync = promisify(execFile)

const EASTMONEY = 'https://push2his.eastmoney.com/api/qt/stock/kline/get'
const EASTMONEY_REFERER = 'https://quote.eastmoney.com/'

const PERIODS = {
  '5m': { kind: 'minute', limit: 600, eastmoneyKlt: 5, label: '5分钟' },
  day: { kind: 'kline', limit: 360, eastmoneyKlt: 101, futuType: KLINE_TYPE.day, label: '日K' },
  week: { kind: 'kline', limit: 260, eastmoneyKlt: 102, futuType: KLINE_TYPE.week, label: '周K' },
  month: { kind: 'kline', limit: 180, eastmoneyKlt: 103, futuType: KLINE_TYPE.month, label: '月K' },
  quarter: { kind: 'kline', limit: 100, eastmoneyKlt: 103, futuType: KLINE_TYPE.quarter, label: '季K' },
  year: { kind: 'kline', limit: 60, eastmoneyKlt: 103, futuType: KLINE_TYPE.year, label: '年K' },
}

const INDEX_SECID = {
  '.DJI': '100.DJIA',
  '.SPX': '100.SPX',
  '.IXIC': '100.NDX',
}

const INDEX_NOTE = {
  '.IXIC': '纳斯达克综合指数暂无直接K线，以纳斯达克100（NDX）代替',
}

const secidCache = new Map()
const klineCache = new Map()

let futuKlineFailures = 0
let futuKlineBlockedUntil = 0

function cacheGet(key) {
  const hit = klineCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > 5 * 60_000) {
    klineCache.delete(key)
    return null
  }
  return hit.data
}

function cacheSet(key, data) {
  klineCache.set(key, { at: Date.now(), data })
  if (klineCache.size > 120) {
    const oldest = [...klineCache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
    if (oldest) klineCache.delete(oldest[0])
  }
}

function toNum(value) {
  const n = Number(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function eastmoneyDate(text) {
  const value = String(text).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, t: Date.parse(`${value}T00:00:00+08:00`) }
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (m) {
    return {
      date: `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`,
      t: Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+08:00`),
    }
  }
  return { date: value, t: Date.parse(value) || Date.now() }
}

function parseEastmoneyBars(klines) {
  const bars = []
  for (const line of klines ?? []) {
    const parts = String(line).split(',')
    if (parts.length < 7) continue
    const time = eastmoneyDate(parts[0])
    const bar = {
      date: time.date,
      t: time.t,
      o: toNum(parts[1]),
      c: toNum(parts[2]),
      h: toNum(parts[3]),
      l: toNum(parts[4]),
      v: toNum(parts[5]) ?? 0,
      turnover: toNum(parts[6]) ?? null,
      amplitude: toNum(parts[7]),
      changePct: toNum(parts[8]),
    }
    if (bar.o === null || bar.c === null || bar.h === null || bar.l === null) continue
    bars.push(bar)
  }
  return bars
}

async function eastmoneyRequest(secid, klt, limit) {
  const params = new URLSearchParams({
    secid,
    klt: String(klt),
    fqt: '1',
    lmt: String(limit),
    end: '20500101',
    iscca: '1',
    fields1: 'f1,f2,f3,f4,f5,f6,f7,f8',
    fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
  })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch(`${EASTMONEY}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: EASTMONEY_REFERER,
        Accept: 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`东方财富 K 线接口 HTTP ${res.status}`)
    const json = await res.json()
    if (!json?.data) throw new Error('东方财富未返回 K 线数据')
    return json.data
  } finally {
    clearTimeout(timer)
  }
}

async function resolveSecid(code, meta) {
  const upper = String(code).toUpperCase()
  if (secidCache.has(upper)) return secidCache.get(upper)
  if (INDEX_SECID[upper]) {
    secidCache.set(upper, INDEX_SECID[upper])
    return INDEX_SECID[upper]
  }
  const preferred = Number(meta?.marketCode)
  const prefixes =
    preferred === 11
      ? [105, 106, 107]
      : preferred === 12
        ? [106, 107, 105]
        : preferred === 13
          ? [107, 106, 105]
          : [105, 106, 107]
  for (const prefix of prefixes) {
    const secid = `${prefix}.${upper}`
    try {
      const data = await eastmoneyRequest(secid, 101, 2)
      if (data?.klines?.length) {
        secidCache.set(upper, secid)
        return secid
      }
    } catch {
      /* 换下一个市场前缀 */
    }
  }
  return null
}

function aggregateBars(bars, groupOf) {
  const groups = new Map()
  for (const bar of bars) {
    const key = groupOf(bar)
    if (key === null) continue
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, { ...bar, key })
    } else {
      existing.c = bar.c
      existing.h = Math.max(existing.h, bar.h)
      existing.l = Math.min(existing.l, bar.l)
      existing.v += bar.v
      if (bar.turnover != null) existing.turnover = (existing.turnover ?? 0) + bar.turnover
      existing.changePct = existing.o ? ((existing.c - existing.o) / existing.o) * 100 : null
      existing.date = bar.date
      existing.t = bar.t
    }
  }
  return [...groups.values()].map(({ key, ...bar }) => bar)
}

function parseFutuBars(list) {
  return (list ?? [])
    .map((item) => {
      const t = Number(item.k) * 1000
      const close = toNum(item.c)
      const open = toNum(item.o)
      const high = toNum(item.h)
      const low = toNum(item.l)
      const lastClose = toNum(item.lc)
      if ([open, close, high, low].some((v) => v === null)) return null
      const date = new Date(t).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      return {
        date,
        t,
        o: open,
        c: close,
        h: high,
        l: low,
        v: toNum(item.v) ?? 0,
        turnover: null,
        changePct: lastClose ? ((close - lastClose) / lastClose) * 100 : open ? ((close - open) / open) * 100 : null,
      }
    })
    .filter(Boolean)
}

/** 用系统 curl 调富途 get-kline；成功返回 bars，失败抛错。 */
async function futuKline(meta, period, detail) {
  if (Date.now() < futuKlineBlockedUntil) throw new Error('富途 K 线接口暂不可用')
  const config = PERIODS[period]
  if (!config?.futuType) throw new Error('富途不提供该周期')
  const params = {
    stockId: meta.stockId,
    marketType: meta.marketType,
    type: config.futuType,
    marketCode: meta.marketCode,
    instrumentType: meta.instrumentType,
    subInstrumentType: meta.subInstrumentType,
  }
  const signature = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) signature[key] = String(value)
  }
  const url = `https://www.futunn.com/quote-api/quote-v2/get-kline?${serializeQuery(params)}`
  const args = [
    '-sS',
    '--compressed',
    '-H',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '-H',
    'Accept: application/json, text/plain, */*',
    '-H',
    'Accept-Language: zh-CN,zh;q=0.9',
    '-H',
    `Referer: https://www.futunn.com/quote/stock?m=us&code=${encodeURIComponent(detail?.code ?? '')}`,
    '-H',
    'Origin: https://www.futunn.com',
    '-H',
    `quote-token: ${quoteToken(JSON.stringify(signature))}`,
    '-H',
    `Cookie: ${futuCookieHeader()}`,
    url,
  ]
  const binary = process.platform === 'win32' ? 'curl.exe' : 'curl'
  let stdout
  try {
    const result = await execFileAsync(binary, args, {
      timeout: 8_000,
      maxBuffer: 12 * 1024 * 1024,
      encoding: 'utf8',
    })
    stdout = result.stdout
  } catch (error) {
    futuKlineFailures += 1
    if (futuKlineFailures >= 2) futuKlineBlockedUntil = Date.now() + 30 * 60_000
    throw new Error(`富途 K 线请求失败：${error.message}`)
  }
  let json = null
  try {
    json = JSON.parse(stdout)
  } catch {
    futuKlineFailures += 1
    if (futuKlineFailures >= 2) futuKlineBlockedUntil = Date.now() + 30 * 60_000
    throw new Error('富途 K 线接口返回了非 JSON 内容（可能被风控）')
  }
  if (json.code !== 0 || !json.data?.list?.length) {
    futuKlineFailures += 1
    if (futuKlineFailures >= 2) futuKlineBlockedUntil = Date.now() + 30 * 60_000
    throw new Error(`富途 K 线接口返回 ${json.code}: ${json.message ?? ''}`)
  }
  futuKlineFailures = 0
  return parseFutuBars(json.data.list)
}

async function eastmoneyKline(code, meta, period) {
  const config = PERIODS[period]
  if (!config) throw new Error('不支持的周期')
  if (String(code).toUpperCase().startsWith('BK')) {
    throw new Error('板块指数暂无 K 线数据')
  }
  const secid = await resolveSecid(code, meta)
  if (!secid) throw new Error('未找到该标的的 K 线数据')
  const klt = config.eastmoneyKlt
  const limit = period === 'quarter' || period === 'year' ? 800 : Math.max(config.limit + 40, 120)
  const data = await eastmoneyRequest(secid, klt, limit)
  let bars = parseEastmoneyBars(data.klines)
  if (period === 'quarter') {
    bars = aggregateBars(bars, (bar) => {
      const [year, month] = String(bar.date).split('-').map(Number)
      if (!year || !month) return null
      return `${year}Q${Math.floor((month - 1) / 3) + 1}`
    })
  } else if (period === 'year') {
    bars = aggregateBars(bars, (bar) => {
      const year = Number(String(bar.date).slice(0, 4))
      return Number.isFinite(year) ? String(year) : null
    })
  }
  if (bars.length > config.limit) bars = bars.slice(-config.limit)
  return {
    bars,
    preClose: toNum(data.preKPrice),
    source: 'eastmoney',
    sourceLabel: '东方财富',
    note: INDEX_NOTE[String(code).toUpperCase()] ?? '',
  }
}

/**
 * 读取一个标的、一个周期的 K 线。
 * @param {string} code 股票 / ETF / 指数代码
 * @param {string} period 5m | day | week | month | quarter | year
 * @param {object} meta fetchDetail 返回的 meta
 * @param {object} detail 详情（用于 code/name 与 preClose）
 */
export async function fetchKline(code, period, meta, detail) {
  const upper = String(code).toUpperCase()
  const config = PERIODS[period]
  if (!config) throw new Error('不支持的周期')
  const key = `${upper}:${period}`
  const cached = cacheGet(key)
  if (cached) return cached

  let result = null
  let futuError = null
  if (period !== '5m' && config.futuType) {
    try {
      const bars = await futuKline(meta, period, detail)
      result = {
        bars: bars.slice(-config.limit),
        preClose: detail?.quote?.prevClose ?? null,
        source: 'futu',
        sourceLabel: '富途牛牛',
        note: '',
      }
    } catch (error) {
      futuError = error
    }
  }
  if (!result) {
    try {
      result = await eastmoneyKline(code, meta, period)
    } catch (error) {
      throw new Error(
        `${error.message}${futuError ? `（富途：${futuError.message}）` : ''}`,
      )
    }
  }

  const payload = {
    ok: true,
    code: upper,
    name: detail?.name ?? upper,
    period,
    label: config.label,
    source: result.source,
    sourceLabel: result.sourceLabel,
    note: result.note ?? '',
    preClose: result.preClose ?? null,
    bars: (result.bars ?? []).slice().sort((a, b) => a.t - b.t),
    fetchedAt: Date.now(),
  }
  cacheSet(key, payload)
  return payload
}

export { PERIODS }

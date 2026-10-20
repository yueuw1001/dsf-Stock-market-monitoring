/**
 * 美国收盘报（Host half）
 *
 * 数据源：富途牛牛（futunn.com）美股行情页面。
 * 对外提供：
 *   GET /dsh-usclose/api.json     看板快照（指数 / 板块 / 个股 / ETF）
 *   GET /dsh-usclose/detail.json  单标的详情（个股 / ETF / 板块 / 指数）
 *   GET /dsh-usclose/company.json 公司全部资料（detail 的个股别名）
 *   Tool `us_close_report`        给 Agent 读取同一份行情与详情
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import {
  fetchMarket,
  fetchSectors,
  fetchEtfs,
  fetchDetail,
  usMarketPhase,
} from './lib/futu.js'

export const name = 'dsh-us-close-report'
export const inject = ['webServer', 'tools']

const VERSION = '1.0.0'
const API_PATH = '/dsh-usclose/api.json'
const DETAIL_PATH = '/dsh-usclose/detail.json'
const COMPANY_PATH = '/dsh-usclose/company.json'

const DEFAULTS = {
  autoUpdate: true,
  pulseSeconds: 30,
  listRefreshMinutes: 5,
  detailTtlSeconds: 45,
  maxStocks: 50,
  maxSectors: 30,
  maxEtfs: 50,
  dataDir: '',
}

const sortByChange = (a, b) => (b.changePct ?? -1e9) - (a.changePct ?? -1e9)

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

function iso(ms) {
  return ms ? new Date(ms).toISOString() : null
}

export function apply(ctx, config) {
  const cfg = { ...DEFAULTS }
  for (const key of Object.keys(DEFAULTS)) {
    const value = config?.[key]
    if (value !== undefined && value !== null) cfg[key] = value
  }
  cfg.pulseSeconds = Math.max(10, Math.min(300, Number(cfg.pulseSeconds) || 30))
  cfg.listRefreshMinutes = Math.max(1, Math.min(60, Number(cfg.listRefreshMinutes) || 5))
  cfg.detailTtlSeconds = Math.max(15, Math.min(600, Number(cfg.detailTtlSeconds) || 45))
  cfg.maxStocks = Math.max(10, Math.min(100, Number(cfg.maxStocks) || 50))
  cfg.maxSectors = Math.max(10, Math.min(100, Number(cfg.maxSectors) || 30))
  cfg.maxEtfs = Math.max(10, Math.min(100, Number(cfg.maxEtfs) || 50))
  const dataDir = String(cfg.dataDir || '').trim() || join(homedir(), '.dsh-us-close-report')
  const snapshotFile = join(dataDir, 'snapshot.json')

  const state = {
    indices: [],
    stocks: [],
    sectors: [],
    sectorTotal: 0,
    etfs: [],
    etfTotal: 0,
    marketServerTime: 0,
    marketAt: 0,
    sectorsAt: 0,
    etfsAt: 0,
    lastError: null,
    errors: {},
    inflight: null,
    lastAttempt: 0,
    failureCount: 0,
    backoffUntil: 0,
  }

  const detailCache = new Map()
  const detailInflight = new Map()
  const plateCache = new Map()

  /* ---------------------------------------------------------------- */
  /* 快照                                                              */
  /* ---------------------------------------------------------------- */

  function buildSnapshot() {
    const phase = usMarketPhase()
    const now = Date.now()
    const errors = Object.entries(state.errors)
      .filter(([, message]) => message)
      .map(([scope, message]) => ({ scope, message }))
    const ages = {
      market: state.marketAt ? Math.round((now - state.marketAt) / 1000) : null,
      sectors: state.sectorsAt ? Math.round((now - state.sectorsAt) / 1000) : null,
      etfs: state.etfsAt ? Math.round((now - state.etfsAt) / 1000) : null,
    }
    return {
      ok: Boolean(state.indices.length),
      plugin: name,
      version: VERSION,
      source: '富途牛牛（futunn.com）',
      generatedAt: new Date().toISOString(),
      marketServerTime: iso(state.marketServerTime),
      phase,
      live: phase.open,
      stale: errors.length > 0,
      errors,
      ages,
      indices: state.indices,
      sectors: state.sectors.slice(0, cfg.maxSectors),
      sectorTotal: state.sectorTotal,
      stocks: state.stocks.slice(0, cfg.maxStocks),
      etfs: state.etfs.slice(0, cfg.maxEtfs),
      etfTotal: state.etfTotal,
      breadth: buildSectorBreadth(),
    }
  }

  function buildSectorBreadth() {
    let up = 0
    let down = 0
    let flat = 0
    for (const sector of state.sectors) {
      const change = sector.changePct
      if (change === null) continue
      if (change > 0.0001) up++
      else if (change < -0.0001) down++
      else flat++
    }
    return { up, down, flat, total: state.sectors.length }
  }

  async function persist() {
    try {
      await mkdir(dataDir, { recursive: true })
      const payload = {
        savedAt: Date.now(),
        indices: state.indices,
        stocks: state.stocks,
        sectors: state.sectors,
        sectorTotal: state.sectorTotal,
        etfs: state.etfs,
        etfTotal: state.etfTotal,
        marketServerTime: state.marketServerTime,
        marketAt: state.marketAt,
        sectorsAt: state.sectorsAt,
        etfsAt: state.etfsAt,
      }
      await writeFile(snapshotFile, JSON.stringify(payload), 'utf8')
    } catch (error) {
      ctx.logger?.warn?.(`[us-close-report] 快照保存失败：${errorText(error)}`)
    }
  }

  async function loadPersisted() {
    try {
      const raw = await readFile(snapshotFile, 'utf8')
      const saved = JSON.parse(raw)
      if (Array.isArray(saved.indices)) state.indices = saved.indices
      if (Array.isArray(saved.stocks)) state.stocks = saved.stocks
      if (Array.isArray(saved.sectors)) state.sectors = saved.sectors
      if (Array.isArray(saved.etfs)) state.etfs = saved.etfs
      state.sectorTotal = Number(saved.sectorTotal) || state.sectors.length
      state.etfTotal = Number(saved.etfTotal) || state.etfs.length
      state.marketServerTime = Number(saved.marketServerTime) || 0
      state.marketAt = Number(saved.marketAt) || 0
      state.sectorsAt = Number(saved.sectorsAt) || 0
      state.etfsAt = Number(saved.etfsAt) || 0
      if (state.indices.length) {
        ctx.logger?.info?.(`[us-close-report] 已载入 ${state.indices.length} 个指数、${state.stocks.length} 只个股、${state.sectors.length} 个板块`)
      }
    } catch {
      /* 首次运行没有快照 */
    }
  }

  /* ---------------------------------------------------------------- */
  /* 刷新                                                              */
  /* ---------------------------------------------------------------- */

  async function refresh(force = false) {
    if (state.inflight) return state.inflight
    const now = Date.now()
    if (!force && now < state.backoffUntil) return buildSnapshot()

    const phase = usMarketPhase()
    const marketTtl = (phase.open ? cfg.pulseSeconds : 10 * 60) * 1000
    const listTtl = (phase.open ? cfg.listRefreshMinutes : 30) * 60 * 1000
    const needMarket = force || state.marketAt === 0 || now - state.marketAt > marketTtl
    const needSectors = force || state.sectorsAt === 0 || now - state.sectorsAt > listTtl
    const needEtfs = force || state.etfsAt === 0 || now - state.etfsAt > listTtl
    if (!needMarket && !needSectors && !needEtfs) return buildSnapshot()
    if (!force && now - state.lastAttempt < 5000) return buildSnapshot()
    state.lastAttempt = now

    state.inflight = (async () => {
      const errors = {}
      const jobs = []

      if (needMarket) {
        jobs.push(
          fetchMarket()
            .then((data) => {
              state.indices = data.indices
              state.stocks = data.stocks.sort(sortByChange)
              state.marketServerTime = data.serverTime
              state.marketAt = Date.now()
            })
            .catch((error) => {
              errors.market = errorText(error)
            }),
        )
      }
      if (needSectors) {
        jobs.push(
          fetchSectors()
            .then((data) => {
              state.sectors = data.sectors.sort(sortByChange)
              state.sectorTotal = data.total
              state.sectorsAt = Date.now()
            })
            .catch((error) => {
              errors.sectors = errorText(error)
            }),
        )
      }
      if (needEtfs) {
        jobs.push(
          fetchEtfs()
            .then((data) => {
              state.etfs = data.etfs.sort(sortByChange)
              state.etfTotal = data.total
              state.etfsAt = Date.now()
            })
            .catch((error) => {
              errors.etfs = errorText(error)
            }),
        )
      }

      try {
        await Promise.all(jobs)
      } finally {
        state.inflight = null
      }

      state.errors = errors
      const messages = Object.values(errors)
      state.lastError = messages.length ? messages.join('；') : null
      if (messages.length) {
        state.failureCount += 1
        ctx.logger?.warn?.(`[us-close-report] 行情抓取失败：${state.lastError}`)
        state.backoffUntil = Date.now() + Math.min(5, state.failureCount) * 30_000
      } else {
        state.failureCount = 0
        state.backoffUntil = 0
        await persist()
      }
      return buildSnapshot()
    })()

    return state.inflight
  }

  /* ---------------------------------------------------------------- */
  /* 详情                                                              */
  /* ---------------------------------------------------------------- */

  async function plateConstituents(plateCode) {
    const cached = plateCache.get(plateCode)
    if (cached && Date.now() - cached.at < 5 * 60_000) return cached.data
    const detail = await fetchDetail(plateCode, { withRelated: false })
    const data = {
      code: plateCode,
      name: detail.name,
      total: detail.breadth?.total ?? detail.companyTotal ?? detail.companies.length,
      companies: detail.companies,
    }
    plateCache.set(plateCode, { at: Date.now(), data })
    return data
  }

  async function loadDetail(code) {
    const clean = String(code ?? '').trim()
    if (!clean) throw new Error('缺少代码参数')
    if (!/^[.A-Za-z0-9_-]{1,24}$/.test(clean)) throw new Error('代码格式不合法')
    const key = clean.toUpperCase()
    const cached = detailCache.get(key)
    if (cached && Date.now() - cached.at < cfg.detailTtlSeconds * 1000) {
      return { ...cached.data, cached: true }
    }
    if (detailInflight.has(key)) return detailInflight.get(key)
    const task = (async () => {
      const data = await fetchDetail(clean, { withRelated: false })
      if (data.kind === 'stock' && data.plates.length) {
        try {
          const plate = await plateConstituents(data.plates[0].code)
          data.companies = plate.companies.filter((company) => company.code !== data.code).slice(0, 12)
          data.industry = { code: plate.code, name: plate.name, total: plate.total }
        } catch {
          /* 关联公司失败不影响详情 */
        }
      }
      if (data.trust?.aum) {
        const aum = Number(data.trust.aum)
        data.trust.aum = Number.isFinite(aum) ? aum / 1000 : null
      }
      data.cached = false
      detailCache.set(key, { at: Date.now(), data })
      if (detailCache.size > 200) {
        const oldest = [...detailCache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (oldest) detailCache.delete(oldest[0])
      }
      return data
    })()
    detailInflight.set(key, task)
    try {
      return await task
    } finally {
      detailInflight.delete(key)
    }
  }

  /* ---------------------------------------------------------------- */
  /* HTTP 接口                                                         */
  /* ---------------------------------------------------------------- */

  function sendJson(res, status, payload) {
    const body = JSON.stringify(payload)
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': String(Buffer.byteLength(body)),
    })
    res.end(body)
  }

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: API_PATH,
      handler: async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          sendJson(res, 405, { ok: false, error: '仅支持 GET' })
          return
        }
        try {
          const url = new URL(req.url ?? API_PATH, 'http://127.0.0.1')
          const force = url.searchParams.get('refresh') === '1'
          const snapshot = await refresh(force)
          sendJson(res, 200, snapshot)
        } catch (error) {
          sendJson(res, 200, {
            ok: false,
            error: errorText(error),
            snapshot: buildSnapshot(),
          })
        }
      },
    }),
  )

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: DETAIL_PATH,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { ok: false, error: '仅支持 GET' })
          return
        }
        try {
          const url = new URL(req.url ?? DETAIL_PATH, 'http://127.0.0.1')
          const code = url.searchParams.get('code') ?? ''
          sendJson(res, 200, await loadDetail(code))
        } catch (error) {
          sendJson(res, 200, { ok: false, error: errorText(error) })
        }
      },
    }),
  )

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: COMPANY_PATH,
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { ok: false, error: '仅支持 GET' })
          return
        }
        try {
          const url = new URL(req.url ?? COMPANY_PATH, 'http://127.0.0.1')
          const code = url.searchParams.get('code') ?? ''
          sendJson(res, 200, await loadDetail(code))
        } catch (error) {
          sendJson(res, 200, { ok: false, error: errorText(error) })
        }
      },
    }),
  )

  /* ---------------------------------------------------------------- */
  /* Agent 工具                                                        */
  /* ---------------------------------------------------------------- */

  function fmt(value, digits = 2) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--'
    return Number(value).toFixed(digits)
  }

  function signed(value, digits = 2) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--'
    return `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(digits)}`
  }

  function pct(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--'
    return `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(2)}%`
  }

  function plainPct(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--'
    return `${Number(value).toFixed(2)}%`
  }

  function bigAmount(value) {
    if (value === null || value === undefined) return '--'
    const n = Number(value)
    if (!Number.isFinite(n)) return '--'
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}万亿`
    if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(2)}亿`
    if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(2)}万`
    return n.toFixed(2)
  }

  function formatSnapshot(snapshot, limit = 10) {
    const rows = Math.max(1, Math.min(50, Number(limit) || 10))
    const lines = []
    lines.push('## 美国收盘报 · 富途牛牛实时行情')
    lines.push(
      `市场状态：${snapshot.phase.label} · 数据时间：${snapshot.marketServerTime ? new Date(snapshot.marketServerTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '--'}`,
    )
    lines.push('')
    lines.push('### 指数')
    for (const index of snapshot.indices) {
      lines.push(`- ${index.name}（${index.code}）：${fmt(index.price)} ${signed(index.change)}（${pct(index.changePct)}）`)
    }
    lines.push('')
    lines.push(`### 板块（共 ${snapshot.sectorTotal} 个，展示涨幅居前 ${snapshot.sectors.length} 个）`)
    for (const sector of snapshot.sectors.slice(0, rows)) {
      lines.push(
        `- ${sector.name}（${sector.code}）：${pct(sector.changePct)} · 涨 ${sector.rise} / 跌 ${sector.fall} · 领涨 ${sector.leader?.name ?? '--'} ${pct(sector.leader?.changePct)}`,
      )
    }
    lines.push('')
    lines.push('### 个股涨幅榜')
    for (const stock of snapshot.stocks.slice(0, rows)) {
      lines.push(
        `- ${stock.name}（${stock.code}）：${fmt(stock.price, 3)} ${pct(stock.changePct)} · 成交额 ${bigAmount(stock.turnover)}`,
      )
    }
    lines.push('')
    lines.push('### ETF')
    for (const etf of snapshot.etfs.slice(0, rows)) {
      lines.push(`- ${etf.name}（${etf.code}）：${fmt(etf.price, 3)} ${pct(etf.changePct)} · 规模 ${bigAmount(etf.aum)}`)
    }
    lines.push('')
    lines.push(`数据来源：${snapshot.source}；仅供参考，不构成投资建议。`)
    return lines.join('\n')
  }

  function formatDetail(detail) {
    const q = detail.quote ?? {}
    const kindLabel = { stock: '个股', etf: 'ETF', sector: '板块', index: '指数' }[detail.kind] ?? '标的'
    const lines = []
    lines.push(`## ${detail.name}（${detail.code}）· ${kindLabel}`)
    lines.push(
      `${fmt(q.price, 3)} ${signed(q.change, 3)}（${pct(q.changePct)}） · 状态 ${q.statusText || '--'}`,
    )
    lines.push('')
    lines.push('### 关键数据')
    lines.push(
      `今开 ${fmt(q.open, 3)} · 最高 ${fmt(q.high, 3)} · 最低 ${fmt(q.low, 3)} · 昨收 ${fmt(q.prevClose, 3)} · 振幅 ${plainPct(q.amplitude)}`,
    )
    lines.push(
      `成交量 ${bigAmount(q.volume)} · 成交额 ${bigAmount(q.turnover)} · 换手率 ${plainPct(q.turnoverRate)} · 量比 ${fmt(q.volumeRatio)}`,
    )
    if (q.marketCap) lines.push(`总市值 ${bigAmount(q.marketCap)} · 流通市值 ${bigAmount(q.floatMarketCap)}`)
    const valuation = []
    if (q.peTtm) valuation.push(`市盈率 TTM ${fmt(q.peTtm)}`)
    if (q.pb) valuation.push(`市净率 ${fmt(q.pb)}`)
    if (q.epsTtm) valuation.push(`EPS TTM ${fmt(q.epsTtm, 3)}`)
    if (valuation.length) lines.push(valuation.join(' · '))
    if (q.high52) lines.push(`52 周区间 ${fmt(q.low52, 3)} — ${fmt(q.high52, 3)}`)
    if (detail.breadth) {
      lines.push(
        `成分股：涨 ${detail.breadth.rise} / 跌 ${detail.breadth.fall} / 平 ${detail.breadth.flat}，共 ${detail.breadth.total}`,
      )
    }
    if (detail.plates?.length) {
      lines.push('')
      lines.push('### 行业关联板块')
      for (const plate of detail.plates) lines.push(`- ${plate.name}（${plate.code}）${pct(plate.changePct)}`)
    }
    if (detail.companies?.length) {
      lines.push('')
      lines.push(
        detail.kind === 'sector'
          ? `### 成分股（共 ${detail.breadth?.total ?? detail.companies.length} 家）`
          : `### 行业关联公司${detail.industry ? `（${detail.industry.name}，共 ${detail.industry.total} 家）` : ''}`,
      )
      for (const company of detail.companies.slice(0, 15)) {
        lines.push(`- ${company.name}（${company.code}）：${fmt(company.price, 3)} ${pct(company.changePct)}`)
      }
    }
    if (detail.news?.length) {
      lines.push('')
      lines.push('### 相关资讯')
      for (const news of detail.news.slice(0, 8)) {
        lines.push(`- ${news.title}（${news.source || '富途'}）`)
      }
    }
    lines.push('')
    lines.push('数据来源：富途牛牛（futunn.com）；仅供参考，不构成投资建议。')
    return lines.join('\n')
  }

  ctx.effect(() =>
    ctx.tools.register({
      name: 'us_close_report',
      description:
        '读取富途牛牛美股实时行情看板：三大指数、行业板块、个股涨幅榜、ETF，以及单个标的（个股 / ETF / 板块 / 指数）的详情、行业关联公司与资讯。',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          section: {
            type: 'string',
            enum: ['summary', 'indices', 'sectors', 'stocks', 'etfs', 'detail'],
            description: '要读取的部分，默认 summary 概览。',
          },
          code: {
            type: 'string',
            description: 'section=detail 时必填：股票代码（如 NVDA）、板块代码（如 BK2492）或指数代码（如 .DJI）。',
          },
          limit: { type: 'number', description: '每个榜单返回的行数，1-50，默认 10。' },
          refresh: { type: 'boolean', description: '是否强制抓取最新数据，默认 false。' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: { text: { type: 'string' } },
          required: ['text'],
        },
        render(_args, value) {
          return [{ type: 'text', text: value.text }]
        },
      },
      async execute(args) {
        const section = typeof args?.section === 'string' ? args.section : 'summary'
        if (section === 'detail') {
          const code = String(args?.code ?? '').trim()
          if (!code) throw new Error('section=detail 时需要提供 code')
          const detail = await loadDetail(code)
          return { text: formatDetail(detail) }
        }
        const snapshot = await refresh(args?.refresh === true)
        if (!snapshot.ok) throw new Error(snapshot.errors?.[0]?.message ?? '美股行情尚未就绪')
        const limit = Math.max(1, Math.min(50, Number(args?.limit) || 10))
        if (section === 'indices') {
          return { text: snapshot.indices.map((i) => `${i.name} ${fmt(i.price)} ${pct(i.changePct)}`).join('\n') }
        }
        if (section === 'sectors') {
          return {
            text: snapshot.sectors
              .slice(0, limit)
              .map((s) => `${s.name}（${s.code}） ${pct(s.changePct)} 涨${s.rise}/跌${s.fall}`)
              .join('\n'),
          }
        }
        if (section === 'stocks') {
          return {
            text: snapshot.stocks
              .slice(0, limit)
              .map((s) => `${s.name}（${s.code}） ${fmt(s.price, 3)} ${pct(s.changePct)}`)
              .join('\n'),
          }
        }
        if (section === 'etfs') {
          return {
            text: snapshot.etfs
              .slice(0, limit)
              .map((e) => `${e.name}（${e.code}） ${fmt(e.price, 3)} ${pct(e.changePct)} 规模${bigAmount(e.aum)}`)
              .join('\n'),
          }
        }
        return { text: formatSnapshot(snapshot, limit) }
      },
    }),
  )

  /* ---------------------------------------------------------------- */
  /* 定时刷新                                                          */
  /* ---------------------------------------------------------------- */

  loadPersisted().then(() => {
    if (cfg.autoUpdate) refresh(false).catch((error) => ctx.logger?.warn?.(`[us-close-report] 首次刷新失败：${errorText(error)}`))
  })

  if (cfg.autoUpdate) {
    ctx.effect(() => {
      const timer = setInterval(() => {
        refresh(false).catch(() => {})
      }, 10_000)
      return () => clearInterval(timer)
    })
  }

  ctx.logger?.info?.(
    `[us-close-report] 已启动 v${VERSION}：每 ${cfg.pulseSeconds}s 刷新指数与个股，板块/ETF 每 ${cfg.listRefreshMinutes} 分钟刷新`,
  )
}

/**
 * 富途牛牛（futunn.com）行情抓取层。
 *
 * 富途网页把首屏行情直接序列化在 `window.__INITIAL_STATE__` 里，
 * 因此这里按页面解析，不依赖需要签名的 quote-api：
 *   /quote/us/market          指数、涨幅榜、市场状态
 *   /quote/us/sector-industry 美股行业板块（约 145 个）
 *   /quote/etf-us             美股 ETF 列表
 *   /quote/stock?m=us&code=X  个股 / ETF / 板块 / 指数详情（含成分股、分时、新闻）
 *
 * 站点会对部分请求下发 WAF 挑战页；挑战脚本只做一件事：算出 wafToken
 * cookie 后刷新。这里在受限的 node:vm 沙箱里执行同一段脚本，取出
 * token 后带上重试，避免请求被打回 403。
 */

import vm from 'node:vm'
import crypto from 'node:crypto'

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const ORIGIN = 'https://www.futunn.com'

const cookieJar = new Map()
let wafTokenAt = 0

function absorbCookies(res) {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  for (const raw of list) {
    const pair = String(raw).split(';')[0]
    const idx = pair.indexOf('=')
    if (idx > 0) cookieJar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

/** 仅供本进程内的调试/诊断使用，不对外暴露到接口。 */
export function futuCookieHeader() {
  return cookieHeader()
}

/** 在沙箱里执行 WAF 挑战脚本，返回 wafToken；失败返回空串。 */
export function solveWaf(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const source = scripts.find((s) => s.includes('wafToken') && s.length > 2000)
  if (!source) return ''
  let captured = ''
  const store = new Map()
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
    document: { currentScript: null, scripts: [] },
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    navigator: { userAgent: UA },
  }
  sandbox.window = sandbox
  sandbox.globalThis = sandbox
  sandbox.self = sandbox
  sandbox.location = { href: `${ORIGIN}/`, reload() {}, replace() {} }
  sandbox.document.location = sandbox.location
  Object.defineProperty(sandbox.document, 'cookie', {
    get() {
      return captured
    },
    set(value) {
      captured = String(value)
    },
    configurable: true,
  })
  const patched = source.replace(
    /catch\(e\)\{\s*document\.cookie\s*=\s*'wafToken=scriptError';\s*window\.location\.reload\(\);\s*\}/,
    'catch(e){}',
  )
  try {
    vm.runInContext(patched, vm.createContext(sandbox), { timeout: 5000 })
  } catch {
    /* 挑战脚本最后会调用 reload，沙箱里直接忽略 */
  }
  const match = captured.match(/wafToken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * GET 一个富途页面，自动完成 WAF 挑战并重试一次。
 * @returns {Promise<{status:number, text:string, contentType:string, url:string}>}
 */
export async function futuFetch(url, options = {}) {
  const timeout = options.timeout ?? 25_000
  const referer = options.referer ?? `${ORIGIN}/quote/us/market`
  let last = { status: 0, text: '', contentType: '', url }
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.6',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          Referer: referer,
          Cookie: cookieHeader(),
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      })
      absorbCookies(res)
      const text = await res.text()
      last = {
        status: res.status,
        text,
        contentType: res.headers.get('content-type') ?? '',
        url: res.url || url,
      }
      if (res.status === 200 && text.length < 30_000 && text.includes('wafToken')) {
        const token = solveWaf(text)
        if (token) {
          cookieJar.set('wafToken', token)
          wafTokenAt = Date.now()
          continue
        }
      }
      return last
    } finally {
      clearTimeout(timer)
    }
  }
  return last
}

/** 从 HTML 中解析 `window.__INITIAL_STATE__`。 */
export function extractState(html) {
  const key = 'window.__INITIAL_STATE__='
  const start = html.indexOf(key)
  if (start < 0) return null
  let i = start + key.length
  while (i < html.length && html[i] !== '{') i++
  let depth = 0
  let inString = false
  let escaped = false
  for (let j = i; j < html.length; j++) {
    const ch = html[j]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** 抓取页面并返回解析后的首屏状态。 */
export async function futuState(url, options) {
  const res = await futuFetch(url, options)
  const state = extractState(res.text)
  return { ...res, state }
}

/* ------------------------------------------------------------------ */
/* 数值解析                                                            */
/* ------------------------------------------------------------------ */

export function toNumber(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = String(value).replace(/[,\s%]/g, '')
  if (!text || text === '--' || text === '-' || text === 'N/A') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

const UNITS = [
  ['万亿', 1e12],
  ['亿', 1e8],
  ['万', 1e4],
  ['千', 1e3],
]

export function toAmount(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  let text = String(value).replace(/[,\s]/g, '')
  if (!text || text === '--' || text === '-') return null
  let multiplier = 1
  for (const [suffix, factor] of UNITS) {
    if (text.endsWith(suffix)) {
      multiplier = factor
      text = text.slice(0, -suffix.length)
      break
    }
  }
  const n = Number(text)
  return Number.isFinite(n) ? n * multiplier : null
}

export function pctValue(value) {
  return toNumber(String(value ?? '').replace('%', ''))
}

/* ------------------------------------------------------------------ */
/* 市场状态                                                            */
/* ------------------------------------------------------------------ */

/** 纽约时间下的美股时段。 */
export function usMarketPhase(now = Date.now()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date(now)).map((p) => [p.type, p.value]))
  const weekday = parts.weekday
  const minutes = Number(parts.hour) * 60 + Number(parts.minute)
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { phase: 'weekend', label: '周末休市', open: false, minutes }
  }
  if (minutes < 4 * 60) return { phase: 'closed', label: '已收盘', open: false, minutes }
  if (minutes < 9 * 60 + 30) return { phase: 'pre', label: '盘前', open: false, minutes }
  if (minutes < 16 * 60) return { phase: 'open', label: '盘中', open: true, minutes }
  if (minutes < 20 * 60) return { phase: 'after', label: '盘后', open: false, minutes }
  return { phase: 'closed', label: '已收盘', open: false, minutes }
}

/* ------------------------------------------------------------------ */
/* 页面解析                                                            */
/* ------------------------------------------------------------------ */

const INDEX_META = {
  '.DJI': { name: '道琼斯工业指数', short: '道指' },
  '.IXIC': { name: '纳斯达克综合指数', short: '纳指' },
  '.SPX': { name: '标普 500 指数', short: '标普500' },
}

function normalizeIndex(quote) {
  const meta = INDEX_META[quote.stockCode] ?? {}
  return {
    kind: 'index',
    code: quote.stockCode,
    name: meta.name ?? quote.stockCode,
    short: meta.short ?? quote.stockCode,
    price: toNumber(quote.priceNominal),
    change: toNumber(quote.change),
    changePct: pctValue(quote.changeRatio),
    prevClose: toNumber(quote.priceLastClose),
    open: toNumber(quote.priceOpen),
    high: toNumber(quote.priceHighest),
    low: toNumber(quote.priceLowest),
    avg: toNumber(quote.priceAverage),
    volume: toAmount(quote.volume),
    amplitude: pctValue(quote.amplitudePrice),
    time: Number(quote.time) || null,
  }
}

function normalizeStockRow(row) {
  return {
    kind: 'stock',
    code: row.stockCode,
    name: row.name,
    price: toNumber(row.priceNominal),
    change: toNumber(row.change),
    changePct: pctValue(row.changeRatio),
    volume: toAmount(row.tradeVolumn),
    turnover: toAmount(row.tradeTrunover),
    marketCap: toAmount(row.marketVal),
    circulationMarketCap: toAmount(row.circulationMarketValue),
    pe: toNumber(row.pe),
    peTtm: toNumber(row.peTtm),
    change5d: pctValue(row.c_5Days),
    change20d: pctValue(row.c_20Days),
    change60d: pctValue(row.c_60Days),
    changeYear: pctValue(row.c_YearDays),
    instrumentType: row.instrumentType,
    priceDirect: row.priceDirect,
  }
}

function normalizeEtfRow(row) {
  return {
    kind: 'etf',
    code: row.stockCode,
    name: row.name,
    price: toNumber(row.priceNominal),
    change: toNumber(row.change),
    changePct: pctValue(row.changeRatio),
    volume: toAmount(row.tradeVolumn),
    turnover: toAmount(row.tradeTrunover),
    marketCap: toAmount(row.marketVal),
    aum: toAmount(row.trustAum),
    leverage: toNumber(row.leverage),
    volumeRatio: toNumber(row.volumnRatio),
    change5d: pctValue(row.c_5Days),
    change20d: pctValue(row.c_20Days),
    change60d: pctValue(row.c_60Days),
    changeYear: pctValue(row.c_YearDays),
    instrumentType: row.instrumentType,
    priceDirect: row.priceDirect,
  }
}

function normalizeSectorRow(row) {
  return {
    kind: 'sector',
    code: row.plateCode,
    name: row.plateName,
    enName: row.plateEnName ?? '',
    plateId: row.plateId ?? null,
    changePct: pctValue(row.changeRatio),
    rise: Number(row.priceRiseCount) || 0,
    fall: Number(row.priceFallCount) || 0,
    flat: Number(row.priceSameCount) || 0,
    leader: row.stockCode
      ? {
          code: row.stockCode,
          name: row.stockName ?? row.stockCode,
          changePct: pctValue(row.stockChangeRatio),
        }
      : null,
    turnover: toAmount(row.tradeTurnover),
    volume: toAmount(row.tradeVolumn),
    priceDirect: row.priceDirect,
  }
}

/** 市场首屏：指数 + 涨幅榜 + 市场状态。 */
export async function fetchMarket() {
  const res = await futuState(`${ORIGIN}/quote/us/market`)
  if (!res.state) throw new Error(`富途市场页解析失败（HTTP ${res.status}）`)
  const state = res.state
  const indices = (state.index_quote?.indexQuotes ?? []).map(normalizeIndex)
  const stocks = (state.stock_list?.list ?? [])
    .filter((row) => row.instrumentType === 3)
    .map(normalizeStockRow)
  const serverTime = Number(state.common_data?.serverTime) || Date.now()
  return {
    indices,
    stocks,
    serverTime,
    fetchedAt: Date.now(),
    phase: usMarketPhase(),
  }
}

/** 美股行业板块。 */
export async function fetchSectors() {
  const res = await futuState(`${ORIGIN}/quote/us/sector-industry`)
  if (!res.state) throw new Error(`富途板块页解析失败（HTTP ${res.status}）`)
  const list = (res.state.plate_list?.list ?? []).map(normalizeSectorRow)
  return { sectors: list, total: res.state.plate_list?.pagination?.total ?? list.length, fetchedAt: Date.now() }
}

/** 美股 ETF 列表。 */
export async function fetchEtfs() {
  const res = await futuState(`${ORIGIN}/quote/etf-us`)
  if (!res.state) throw new Error(`富途 ETF 页解析失败（HTTP ${res.status}）`)
  const list = (res.state.etf_list?.list ?? []).map(normalizeEtfRow)
  return {
    etfs: list,
    total: res.state.etf_list?.pagination?.total ?? list.length,
    fetchedAt: Date.now(),
  }
}

function normalizeQuote(info) {
  return {
    price: toNumber(info.priceNominal),
    change: toNumber(info.change),
    changePct: pctValue(info.changeRatio),
    prevClose: toNumber(info.priceLastClose),
    open: toNumber(info.priceOpen),
    high: toNumber(info.priceHighest),
    low: toNumber(info.priceLowest),
    avg: toNumber(info.priceAverage),
    volume: toAmount(info.volume),
    turnover: toAmount(info.turnover),
    amplitude: pctValue(info.amplitudePrice),
    volumeRatio: toNumber(info.ratioVolume),
    turnoverRate: pctValue(info.ratioTurnover),
    bid: toNumber(info.priceBid),
    ask: toNumber(info.priceAsk),
    bidVolume: toNumber(info.volumeBid),
    askVolume: toNumber(info.volumeAsk),
    high52: toNumber(info.priceHighest_52week),
    low52: toNumber(info.priceLowest_52week),
    highHistory: toNumber(info.priceHighestHistory),
    lowHistory: toNumber(info.priceLowestHistory),
    marketCap: toAmount(info.totalMarketCap),
    shares: toAmount(info.totalShares),
    floatMarketCap: toAmount(info.outstandingMarketCap),
    floatShares: toAmount(info.outstandingShares),
    peTtm: toNumber(info.peTtm),
    peLyr: toNumber(info.peLyr),
    pb: toNumber(info.pbRatio),
    epsTtm: toNumber(info.epsTtm),
    epsLyr: toNumber(info.epsLyr),
    psTtm: toNumber(info.psTtm),
    psLyr: toNumber(info.psLyr),
    dividend: toNumber(info.dividend),
    dividendYield: pctValue(info.dividendRatio),
    time: Number(info.time) || null,
    statusText: info.market_status_text ?? '',
    status: info.market_status ?? null,
  }
}

function normalizeChart(chartsData) {
  const raw = chartsData?.minuteChartsData
  const list = raw?.list ?? []
  return list.map((p) => ({
    t: Number(p.time) * 1000,
    price: toNumber(p.cc_price) ?? (toNumber(p.price) !== null ? toNumber(p.price) / 1000 : null),
    volume: Number(p.volume) || 0,
  }))
}

function normalizeNews(news) {
  const list = news?.list ?? []
  const overview = news?.overviewList ?? []
  const seen = new Set()
  const out = []
  for (const item of [...overview, ...list]) {
    if (!item?.title || seen.has(item.id)) continue
    seen.add(item.id)
    out.push({
      id: item.id,
      title: item.title,
      source: item.source ?? '',
      time: Number(item.time) * 1000 || null,
      url: item.url ?? '',
      abstract: item.abstract ?? '',
      important: Number(item.impt_lvl) > 0,
    })
  }
  return out.slice(0, 12)
}

function normalizeCompanies(rows, excludeCode) {
  const out = []
  for (const row of rows ?? []) {
    if (excludeCode && row.stockCode === excludeCode) continue
    out.push({
      kind: row.instrumentType === 4 ? 'etf' : 'stock',
      code: row.stockCode,
      name: row.name ?? row.stockCode,
      price: toNumber(row.price),
      change: toNumber(row.change),
      changePct: pctValue(row.changeRatio),
      volume: toAmount(row.tradeVolumn),
      turnover: toAmount(row.tradeTrunover),
      marketCap: toAmount(row.marketVal),
      change5d: pctValue(row.c_5Days),
      change20d: pctValue(row.c_20Days),
      change60d: pctValue(row.c_60Days),
      pe: toNumber(row.pe),
    })
  }
  return out
}

/** 板块成分股（单独抓板块页，5 分钟缓存由调用方负责）。 */
export async function fetchPlateConstituents(plateCode) {
  const detail = await fetchDetail(plateCode, { withRelated: false })
  return {
    code: plateCode,
    name: detail.name,
    companies: detail.companies,
    total: detail.breadth?.total ?? null,
  }
}

/**
 * 个股 / ETF / 板块 / 指数详情。
 * kind 由页面数据自动判断。
 */
export async function fetchDetail(code, options = {}) {
  const clean = String(code ?? '').trim()
  if (!clean) throw new Error('缺少代码')
  const res = await futuState(`${ORIGIN}/quote/stock?m=us&code=${encodeURIComponent(clean)}`)
  if (!res.state) throw new Error(`富途详情页解析失败（HTTP ${res.status}）`)
  const state = res.state
  const info = state.stock_info
  if (!info) throw new Error('详情页缺少行情数据')
  const isPlate = Boolean(info.isPlate)
  const kind = isPlate
    ? 'sector'
    : info.instrumentType === 4
      ? 'etf'
      : info.instrumentType === 6
        ? 'index'
        : 'stock'

  const chart = normalizeChart(state.stock_charts_data)
  const plates = (state.stock_sparks?.list ?? state.over_view?.sparkList ?? []).map((p) => ({
    code: p.plateCode,
    name: p.plateName,
    enName: p.plateEnName ?? '',
    changePct: pctValue(p.changeRatio),
    desc: p.plateDesc ?? '',
  }))

  let companies = []
  if (isPlate) companies = normalizeCompanies(state.plate_stock?.list, clean)
  const breadth = isPlate
    ? {
        rise: info.plate?.raiseCount ?? 0,
        fall: info.plate?.fallCount ?? 0,
        flat: info.plate?.equalCount ?? 0,
        total: info.plate?.allCount ?? 0,
      }
    : info.index
      ? {
          rise: info.index.raiseCount ?? 0,
          fall: info.index.fallCount ?? 0,
          flat: info.index.equalCount ?? 0,
          total: info.index.allCount ?? 0,
        }
      : null

  const result = {
    ok: true,
    kind,
    code: info.stockCode ?? clean,
    name: info.name ?? clean,
    enName: info.enName ?? '',
    isPlate,
    meta: {
      stockId: Number(info.stockId) || null,
      marketType: info.marketType ?? 2,
      marketCode: info.marketCode ?? null,
      instrumentType: info.instrumentType ?? null,
      subInstrumentType: info.subInstrumentType ?? null,
    },
    quote: normalizeQuote(info),
    breadth,
    companies,
    companyTotal: state.plate_stock?.pagination?.total ?? companies.length,
    plates,
    news: normalizeNews(state.stock_news),
    chart,
    finance: state.financial?.businessDataChartList ?? [],
    related: [],
    trust: info.trust ?? null,
    fetchedAt: Date.now(),
  }

  if (options.withRelated !== false && !isPlate && plates.length) {
    try {
      const plate = await fetchPlateConstituents(plates[0].code)
      result.companies = plate.companies.slice(0, 12)
      result.industry = { code: plates[0].code, name: plates[0].name, total: plate.total }
    } catch {
      /* 关联公司抓取失败不影响主详情 */
    }
  }

  return result
}

/* ------------------------------------------------------------------ */
/* 签名行情接口（K 线等）                                              */
/* ------------------------------------------------------------------ */

/** 富途 quote-api 的请求签名：HMAC-SHA512(参数串, quote_web) 取前 10 位，再 SHA256 取前 10 位。 */
export function quoteToken(message) {
  const hmac = crypto.createHmac('sha512', 'quote_web').update(message).digest('hex').slice(0, 10)
  return crypto.createHash('sha256').update(hmac).digest('hex').slice(0, 10)
}

export function serializeQuery(params) {  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue
    sp.append(key, String(value))
  }
  return sp.toString()
}

/**
 * 调用富途签名行情接口。必须先在同一个 cookie jar 里建立页面会话
 * （`futuFetch` 会自动处理 WAF），否则接口会直接返回 403。
 */
export async function futuQuoteApi(path, params, options = {}) {
  const query = serializeQuery(params)
  const signatureParams = {}
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue
    signatureParams[key] = String(value)
  }
  const url = `${ORIGIN}/quote-api/quote-v2${path}${query ? `?${query}` : ''}`
  const res = await futuFetch(url, {
    referer: options.referer ?? `${ORIGIN}/quote/stock?m=us&code=NVDA`,
    timeout: options.timeout ?? 25_000,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'quote-token': quoteToken(JSON.stringify(signatureParams)),
      'futu-x-csrf-token': cookieJar.get('csrfToken') ?? '',
    },
  })
  let json = null
  try {
    json = JSON.parse(res.text)
  } catch {
    /* 非 JSON（WAF/403 页面） */
  }
  return { ...res, json, url }
}

/** 网页图表使用的 K 线类型（富途 get-kline 的 type 参数）。 */
export const KLINE_TYPE = {
  fiveMin: 6,
  day: 2,
  week: 3,
  month: 4,
  quarter: 11,
  year: 5,
}

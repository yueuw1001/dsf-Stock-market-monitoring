/**
 * 美国收盘报（Client half）
 *
 * 在 Web 界面注册「美国收盘报」主面板与侧边栏入口：
 * 三大指数、行业板块、个股涨幅榜、ETF 的实时数值与涨跌，
 * 点击任意卡片/行打开详情抽屉，详情里可继续点击行业关联公司、
 * 关联板块与关联 ETF，逐层查看行情、估值、分时与资讯。
 *
 * 数据来自 Host 的 /dsh-usclose/api.json 与 /dsh-usclose/detail.json，
 * 页面不直接访问行情源；样式使用主题 token，跟随明暗主题。
 */
window.__ModuleLoader__.load({
  id: 'dsh-us-close-report',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'us-close-report'
    const API = 'dsh-usclose/api.json'
    const DETAIL = 'dsh-usclose/detail.json'
    const KLINE = 'dsh-usclose/kline.json'
    const REFRESH_MS = 15_000

    const DICT = {
      zh: {
        panel: '美国收盘报',
        title: '美国收盘报',
        subtitle: '富途牛牛 · 美股指数 / 板块 / 个股 / ETF 实时行情',
        source: '数据来源：富途牛牛 futunn.com',
        disclaimer: '行情仅供参考，不构成投资建议',
        live: '实时',
        refresh: '刷新行情',
        refreshing: '刷新中…',
        updated: '更新于',
        autoRefresh: '每 15 秒自动刷新',
        'tab.sectors': '板块',
        'tab.stocks': '个股',
        'tab.etfs': 'ETF',
        searchPlaceholder: '输入代码或名称，如 NVDA',
        search: '查看',
        'kind.index': '指数',
        'kind.sector': '板块',
        'kind.stock': '个股',
        'kind.etf': 'ETF',
        'phase.open': '盘中',
        'phase.pre': '盘前',
        'phase.after': '盘后',
        'phase.closed': '已收盘',
        'phase.weekend': '周末休市',
        loading: '正在加载美股行情…',
        loadFailed: '行情加载失败',
        retry: '重试',
        empty: '暂无数据',
        brief: '收盘速览',
        sectorsUpDown: '板块涨跌',
        etfsUpDown: 'ETF 涨跌',
        leaderSector: '领涨板块',
        leaderStock: '领涨个股',
        sectorHint: '按涨跌幅排序 · 点击查看成分股',
        stockHint: '美股涨幅榜 · 点击查看公司资料',
        etfHint: '按涨跌幅排序 · 点击查看 ETF 资料',
        rank: '#',
        name: '名称',
        price: '最新价',
        change: '涨跌幅',
        turnover: '成交额',
        marketCap: '总市值',
        aum: '基金规模',
        fiveDay: '5 日',
        twentyDay: '20 日',
        rise: '涨',
        fall: '跌',
        flat: '平',
        leader: '领涨',
        detail: '标的详情',
        close: '关闭',
        back: '返回',
        refreshingDetail: '正在加载详情…',
        detailFailed: '详情加载失败',
        quote: '行情',
        stats: '关键数据',
        open: '今开',
        high: '最高',
        low: '最低',
        prevClose: '昨收',
        amplitude: '振幅',
        volume: '成交量',
        volumeRatio: '量比',
        turnoverRate: '换手率',
        bidAsk: '买一 / 卖一',
        high52: '52 周最高',
        low52: '52 周最低',
        range52: '52 周区间',
        peTtm: '市盈率 TTM',
        peLyr: '市盈率 LYR',
        pb: '市净率',
        eps: '每股收益 TTM',
        dividend: '股息率',
        shares: '总股本',
        floatCap: '流通市值',
        breadth: '成分股涨跌',
        constituents: '成分股',
        relatedPlates: '行业关联板块',
        relatedCompanies: '行业关联公司',
        relatedEtfs: '关联 ETF',
        relatedIndices: '关联指数',
        companiesTotal: '共 {n} 家',
        news: '相关资讯',
        noNews: '暂无相关资讯',
        finance: '业务与财务',
        chart: '分时走势',
        chartTitle: '走势图',
        noChart: '暂无分时数据',
        close: '收盘',
        date: '日期',
        period: '周期',
        'period.intraday': '分时',
        'period.5m': '5分',
        'period.day': '日K',
        'period.week': '周K',
        'period.month': '月K',
        'period.quarter': '季K',
        'period.year': '年K',
        klineLoading: 'K线加载中…',
        klineFailed: 'K线加载失败',
        klineNoData: '暂无K线数据',
        chartHint: '拖动平移 · 滚轮缩放 · 点击蜡烛查看明细',
        klineSource: 'K线来源',
        genuiChart: 'GenUI 分时',
        genuiFallback: 'GenUI 不可用，已切换为内置分时图',
        resetZoom: '重置缩放',
        zoomIn: '放大',
        zoomOut: '缩小',
        changePct: '涨跌幅',
        status: '状态',
        loadDetail: '打开详情',
        etfTrust: '基金资料',
        leverage: '杠杆倍数',
        units: '流通份额',
        marketPhase: '市场状态',
        lastData: '数据时间',
        stale: '上游暂时不可用，以下为最近一次快照',
        dataAge: '数据延迟 {s} 秒',
        searchNotFound: '未找到该标的，请检查代码',
        indexConstituents: '指数成分股',
        plateIndex: '板块指数',
        closeReport: 'US CLOSE REPORT',
        noSector: '暂无板块数据',
      },
      en: {
        panel: 'US Close Report',
        title: 'US Close Report',
        subtitle: 'Futu · real-time US indices, sectors, stocks and ETFs',
        source: 'Source: futunn.com',
        disclaimer: 'For reference only, not investment advice',
        live: 'Live',
        refresh: 'Refresh',
        refreshing: 'Refreshing…',
        updated: 'Updated',
        autoRefresh: 'Auto refresh every 15s',
        'tab.sectors': 'Sectors',
        'tab.stocks': 'Stocks',
        'tab.etfs': 'ETFs',
        searchPlaceholder: 'Ticker or name, e.g. NVDA',
        search: 'Open',
        'kind.index': 'Index',
        'kind.sector': 'Sector',
        'kind.stock': 'Stock',
        'kind.etf': 'ETF',
        'phase.open': 'Open',
        'phase.pre': 'Pre-market',
        'phase.after': 'After-hours',
        'phase.closed': 'Closed',
        'phase.weekend': 'Weekend',
        loading: 'Loading US market data…',
        loadFailed: 'Failed to load market data',
        retry: 'Retry',
        empty: 'No data',
        brief: 'Snapshot',
        sectorsUpDown: 'Sectors',
        etfsUpDown: 'ETFs',
        leaderSector: 'Top sector',
        leaderStock: 'Top stock',
        sectorHint: 'Sorted by change · click for constituents',
        stockHint: 'Top gainers · click for company profile',
        etfHint: 'Sorted by change · click for ETF data',
        rank: '#',
        name: 'Name',
        price: 'Last',
        change: 'Change',
        turnover: 'Turnover',
        marketCap: 'Market cap',
        aum: 'AUM',
        fiveDay: '5D',
        twentyDay: '20D',
        rise: 'Up',
        fall: 'Down',
        flat: 'Flat',
        leader: 'Leader',
        detail: 'Details',
        close: 'Close',
        back: 'Back',
        refreshingDetail: 'Loading details…',
        detailFailed: 'Failed to load details',
        quote: 'Quote',
        stats: 'Key data',
        open: 'Open',
        high: 'High',
        low: 'Low',
        prevClose: 'Prev close',
        amplitude: 'Amplitude',
        volume: 'Volume',
        volumeRatio: 'Volume ratio',
        turnoverRate: 'Turnover rate',
        bidAsk: 'Bid / Ask',
        high52: '52W high',
        low52: '52W low',
        range52: '52W range',
        peTtm: 'PE TTM',
        peLyr: 'PE LYR',
        pb: 'PB',
        eps: 'EPS TTM',
        dividend: 'Dividend yield',
        shares: 'Shares',
        floatCap: 'Float cap',
        breadth: 'Constituents',
        constituents: 'Constituents',
        relatedPlates: 'Related sectors',
        relatedCompanies: 'Industry peers',
        relatedEtfs: 'Related ETFs',
        relatedIndices: 'Related indices',
        companiesTotal: '{n} companies',
        news: 'News',
        noNews: 'No news',
        finance: 'Business & financials',
        chart: 'Intraday',
        chartTitle: 'Price chart',
        noChart: 'No intraday data',
        close: 'Close',
        date: 'Date',
        period: 'Period',
        'period.intraday': 'Intraday',
        'period.5m': '5m',
        'period.day': '1D',
        'period.week': '1W',
        'period.month': '1M',
        'period.quarter': '1Q',
        'period.year': '1Y',
        klineLoading: 'Loading K-line…',
        klineFailed: 'Failed to load K-line',
        klineNoData: 'No K-line data',
        chartHint: 'Drag to pan · wheel to zoom · click a candle for details',
        klineSource: 'K-line source',
        genuiChart: 'GenUI intraday',
        genuiFallback: 'GenUI unavailable, using the built-in chart',
        resetZoom: 'Reset zoom',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        changePct: 'Change',
        status: 'Status',
        loadDetail: 'Details',
        etfTrust: 'Fund data',
        leverage: 'Leverage',
        units: 'Units',
        marketPhase: 'Market',
        lastData: 'Data time',
        stale: 'Upstream unavailable, showing the latest snapshot',
        dataAge: 'Data delayed {s}s',
        searchNotFound: 'Symbol not found',
        indexConstituents: 'Index constituents',
        plateIndex: 'Sector index',
        closeReport: 'US CLOSE REPORT',
        noSector: 'No sector data',
      },
    }

    let translate = (key) => DICT.zh[key] ?? key
    let localeService = null

    function useT() {
      const [, force] = React.useReducer((value) => value + 1, 0)
      React.useEffect(() => {
        if (!localeService || typeof localeService.subscribe !== 'function') return undefined
        return localeService.subscribe(() => force())
      }, [])
      return translate
    }

    /* ------------------------------------------------------------ */
    /* 格式化与颜色                                                  */
    /* ------------------------------------------------------------ */

    function toNum(value) {
      if (value === null || value === undefined) return null
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }

    function fmt(value, digits = 2) {
      const n = toNum(value)
      if (n === null) return '--'
      return n.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    }

    function signed(value, digits = 2) {
      const n = toNum(value)
      if (n === null) return '--'
      return `${n > 0 ? '+' : ''}${fmt(n, digits)}`
    }

    function pct(value) {
      const n = toNum(value)
      if (n === null) return '--'
      return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
    }

    function plainPct(value) {
      const n = toNum(value)
      if (n === null) return '--'
      return `${n.toFixed(2)}%`
    }

    function amount(value) {
      const n = toNum(value)
      if (n === null) return '--'
      const abs = Math.abs(n)
      if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}万亿`
      if (abs >= 1e8) return `${(n / 1e8).toFixed(2)}亿`
      if (abs >= 1e4) return `${(n / 1e4).toFixed(2)}万`
      return n.toFixed(0)
    }

    function toneOf(value) {
      const n = toNum(value)
      if (n === null) return 'flat'
      if (n > 0.000001) return 'up'
      if (n < -0.000001) return 'down'
      return 'flat'
    }

    function timeText(ms) {
      if (!ms) return '--'
      return new Date(ms).toLocaleTimeString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    }

    function shortTime(ms) {
      if (!ms) return '--'
      return new Date(ms).toLocaleTimeString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }

    function dayText(ms) {
      if (!ms) return '--'
      return new Date(ms).toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
      })
    }

    /** 富途的分钟数据可能跨两个交易日；只保留最后一个纽约交易日。 */
    function lastSessionPoints(points) {
      const clean = (points ?? []).filter(
        (point) => Number.isFinite(Number(point.t)) && toNum(point.price) !== null,
      )
      if (!clean.length) return []
      let formatter
      try {
        formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' })
      } catch {
        return clean
      }
      const lastDate = formatter.format(new Date(Number(clean[clean.length - 1].t)))
      return clean.filter((point) => formatter.format(new Date(Number(point.t))) === lastDate)
    }

    const KIND_KEY = {
      index: 'kind.index',
      sector: 'kind.sector',
      stock: 'kind.stock',
      etf: 'kind.etf',
    }

    /* ------------------------------------------------------------ */
    /* 基础组件                                                      */
    /* ------------------------------------------------------------ */

    function Pill({ value, suffix = '%', className = '' }) {
      const tone = toneOf(value)
      const text = suffix === '%' ? pct(value) : `${signed(value)}${suffix}`
      return h('span', { className: `uscr-pill uscr-${tone} ${className}` }, text)
    }

    function BreadthBar({ rise = 0, fall = 0, flat = 0, compact = false }) {
      const total = Math.max(1, rise + fall + flat)
      const width = (n) => `${(n / total) * 100}%`
      return h(
        'div',
        { className: `uscr-breadth ${compact ? 'uscr-breadth-compact' : ''}`, 'aria-hidden': 'true' },
        h('span', { className: 'uscr-breadth-up', style: { width: width(rise) } }),
        h('span', { className: 'uscr-breadth-flat', style: { width: width(flat) } }),
        h('span', { className: 'uscr-breadth-down', style: { width: width(fall) } }),
      )
    }

    function RangeBar({ low, high, value, prev }) {
      const lo = toNum(low)
      const hi = toNum(high)
      const v = toNum(value)
      if (lo === null || hi === null || v === null || hi <= lo) {
        return h('div', { className: 'uscr-range-placeholder' })
      }
      const ratio = Math.min(1, Math.max(0, (v - lo) / (hi - lo)))
      const prevRatio = toNum(prev) === null ? null : Math.min(1, Math.max(0, (prev - lo) / (hi - lo)))
      return h(
        'div',
        { className: 'uscr-range' },
        h('div', { className: 'uscr-range-track' }),
        prevRatio !== null
          ? h('span', { className: 'uscr-range-prev', style: { left: `${prevRatio * 100}%` } })
          : null,
        h('span', { className: 'uscr-range-dot', style: { left: `${ratio * 100}%` } }),
        h(
          'div',
          { className: 'uscr-range-ends' },
          h('span', null, fmt(lo, 2)),
          h('span', null, fmt(hi, 2)),
        ),
      )
    }

    function Section({ title, extra, children, className = '' }) {
      return h(
        'section',
        { className: `uscr-section ${className}` },
        h(
          'header',
          { className: 'uscr-section-head' },
          h('h3', null, title),
          extra ? h('span', { className: 'uscr-section-extra' }, extra) : null,
        ),
        children,
      )
    }

    function StatGrid({ items }) {
      return h(
        'div',
        { className: 'uscr-stats' },
        items.map((item, index) =>
          h(
            'div',
            { className: 'uscr-stat', key: `${item.label}-${index}` },
            h('span', { className: 'uscr-stat-label' }, item.label),
            h('b', { className: `uscr-stat-value uscr-${item.tone ?? 'flat'}` }, item.value),
          ),
        ),
      )
    }

    function Empty({ text }) {
      return h('div', { className: 'uscr-empty' }, text)
    }

    function CompanyRow({ item, onOpen, showMarketCap = true }) {
      const tone = toneOf(item.changePct)
      return h(
        'button',
        {
          type: 'button',
          className: 'uscr-company-row',
          onClick: () => onOpen(item.code, item.kind),
          title: `${item.name} ${item.code}`,
        },
        h(
          'span',
          { className: 'uscr-company-main' },
          h('b', null, item.name),
          h('em', null, item.code),
        ),
        h('span', { className: 'uscr-company-price' }, fmt(item.price, 3)),
        h('span', { className: `uscr-company-pct uscr-${tone}` }, pct(item.changePct)),
        showMarketCap
          ? h('span', { className: 'uscr-company-cap' }, item.marketCap ? amount(item.marketCap) : '--')
          : null,
      )
    }

    /* ------------------------------------------------------------ */
    /* 样式                                                          */
    /* ------------------------------------------------------------ */

    const STYLES = `
.uscr-root{--uscr-up:var(--dsw-alias-state-error-primary);--uscr-down:var(--dsw-alias-state-success-primary);
  --uscr-flat:var(--dsw-alias-state-idle-primary);--uscr-gold:var(--dsw-alias-brand-primary);
  position:relative;box-sizing:border-box;min-height:100%;padding:28px 32px 56px;
  background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);
  font-variant-numeric:tabular-nums;overflow-x:hidden;}
.uscr-root *,.uscr-root *::before,.uscr-root *::after{box-sizing:border-box;}
.uscr-shell{max-width:1220px;margin:0 auto;}
.uscr-up{color:var(--uscr-up)!important;}
.uscr-down{color:var(--uscr-down)!important;}
.uscr-flat{color:var(--uscr-flat)!important;}
.uscr-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px;}
.uscr-brand{display:flex;align-items:center;gap:14px;}
.uscr-logo{display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:13px;
  background:linear-gradient(145deg,#0d2547,#153a6b);color:#8fc0ff;box-shadow:0 8px 24px rgba(13,37,71,.28);}
.uscr-eyebrow{font-size:11px;letter-spacing:.22em;font-weight:700;color:var(--uscr-gold);margin-bottom:3px;}
.uscr-title{margin:0;font-size:26px;line-height:1.15;font-weight:700;letter-spacing:-.01em;}
.uscr-sub{margin-top:5px;font-size:12.5px;color:var(--dsw-alias-label-secondary);}
.uscr-head-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.uscr-status{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:12.5px;font-weight:600;}
.uscr-dot{width:7px;height:7px;border-radius:50%;background:var(--uscr-flat);}
.uscr-status.is-live .uscr-dot{background:var(--uscr-up);box-shadow:0 0 0 4px color-mix(in srgb,var(--uscr-up) 14%,transparent);animation:uscr-pulse 2s infinite;}
.uscr-status.is-live{color:var(--uscr-up);border-color:color-mix(in srgb,var(--uscr-up) 32%,transparent);}
.uscr-updated{font-size:12px;color:var(--dsw-alias-label-secondary);}
.uscr-btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:9px;cursor:pointer;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);
  font-size:13px;font-weight:600;transition:background .15s,border-color .15s,transform .15s;}
.uscr-btn:hover{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary);}
.uscr-btn:active{transform:translateY(1px);}
.uscr-btn:disabled{opacity:.6;cursor:default;}
.uscr-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;}
.uscr-btn-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.06);}
.uscr-spin{width:13px;height:13px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:uscr-spin .8s linear infinite;}
.uscr-search{display:flex;align-items:center;gap:6px;height:34px;padding:0 4px 0 11px;border-radius:9px;
  border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);}
.uscr-search input{width:180px;border:0;outline:0;background:transparent;color:inherit;font-size:13px;}
.uscr-search input::placeholder{color:var(--dsw-alias-label-secondary);}
.uscr-search button{border:0;border-radius:7px;background:var(--dsw-alias-bg-layer-2);color:inherit;font-size:12px;
  font-weight:600;padding:5px 9px;cursor:pointer;}
.uscr-search button:hover{background:var(--dsw-alias-brand-primary);color:#fff;}
.uscr-banner{margin:-8px 0 16px;padding:10px 14px;border-radius:10px;font-size:12.5px;
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent);color:var(--dsw-alias-label-primary);}
.uscr-hero{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px;}
.uscr-card{position:relative;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;
  background:linear-gradient(180deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-1) 62%,var(--dsw-alias-bg-layer-2));
  padding:14px 16px;overflow:hidden;}
.uscr-index-card{cursor:pointer;text-align:left;color:inherit;font:inherit;transition:border-color .16s,transform .16s,box-shadow .16s;}
.uscr-index-card:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px);box-shadow:0 10px 26px rgba(12,34,64,.12);}
.uscr-index-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.uscr-index-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.uscr-index-name{font-size:13px;font-weight:700;}
.uscr-index-code{font-size:11px;color:var(--dsw-alias-label-secondary);letter-spacing:.02em;}
.uscr-index-value{font-size:27px;font-weight:700;line-height:1.05;letter-spacing:-.02em;}
.uscr-index-change{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;font-weight:600;}
.uscr-index-change .uscr-flat{color:var(--dsw-alias-label-secondary)!important;}
.uscr-index-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:10.5px;
  color:var(--dsw-alias-label-secondary);}
.uscr-pill{display:inline-flex;align-items:center;justify-content:center;min-width:62px;height:23px;padding:0 8px;
  border-radius:6px;font-size:12px;font-weight:700;line-height:1;background:var(--dsw-alias-bg-layer-2);color:inherit;white-space:nowrap;}
.uscr-pill.uscr-up{background:color-mix(in srgb,var(--uscr-up) 13%,transparent);}
.uscr-pill.uscr-down{background:color-mix(in srgb,var(--uscr-down) 13%,transparent);}
.uscr-pill.uscr-flat{background:var(--dsw-alias-bg-layer-2);}
.uscr-range{position:relative;height:22px;margin-top:10px;}
.uscr-range-track{position:absolute;left:0;right:0;top:7px;height:3px;border-radius:3px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--uscr-down) 45%,transparent),var(--dsw-alias-border-l2) 52%,color-mix(in srgb,var(--uscr-up) 45%,transparent));}
.uscr-range-prev{position:absolute;top:3px;width:2px;height:11px;border-radius:1px;background:var(--dsw-alias-label-secondary);opacity:.55;}
.uscr-range-dot{position:absolute;top:2.5px;width:12px;height:12px;margin-left:-6px;border-radius:50%;
  background:var(--dsw-alias-label-primary);border:2.5px solid var(--dsw-alias-bg-layer-1);box-shadow:0 1px 4px rgba(0,0,0,.25);}
.uscr-range-ends{display:flex;justify-content:space-between;margin-top:2px;font-size:10px;color:var(--dsw-alias-label-secondary);}
.uscr-range-placeholder{height:22px;margin-top:10px;}
.uscr-brief{display:flex;flex-direction:column;gap:9px;}
.uscr-brief-title{font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;}
.uscr-brief-title svg{color:var(--uscr-gold);}
.uscr-brief-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;
  padding-bottom:8px;border-bottom:1px dashed var(--dsw-alias-border-l1);}
.uscr-brief-row:last-child{border-bottom:0;padding-bottom:0;}
.uscr-brief-row span{color:var(--dsw-alias-label-secondary);}
.uscr-brief-row b{font-weight:700;text-align:right;max-width:64%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.uscr-tabs{display:flex;align-items:center;gap:6px;margin:2px 0 16px;border-bottom:1px solid var(--dsw-alias-border-l1);}
.uscr-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;
  font-size:14px;font-weight:600;padding:10px 14px 12px;cursor:pointer;border-bottom:2px solid transparent;
  margin-bottom:-1px;display:inline-flex;align-items:center;gap:7px;}
.uscr-tab:hover{color:var(--dsw-alias-label-primary);}
.uscr-tab.is-active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);}
.uscr-tab-count{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);
  border-radius:999px;padding:1px 7px;}
.uscr-tab.is-active .uscr-tab-count{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);color:var(--dsw-alias-brand-primary);}
.uscr-hint{margin:-4px 0 14px;font-size:12px;color:var(--dsw-alias-label-secondary);}
.uscr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.uscr-sector-card{text-align:left;color:inherit;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l1);
  border-radius:13px;background:var(--dsw-alias-bg-layer-1);padding:14px;transition:border-color .15s,transform .15s,box-shadow .15s;}
.uscr-sector-card:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px);box-shadow:0 10px 24px rgba(12,34,64,.1);}
.uscr-sector-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.uscr-sector-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:11px;}
.uscr-sector-name{font-size:14px;font-weight:700;line-height:1.3;}
.uscr-sector-code{margin-top:3px;font-size:10.5px;color:var(--dsw-alias-label-secondary);letter-spacing:.03em;}
.uscr-breadth{display:flex;height:5px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);}
.uscr-breadth span{display:block;height:100%;}
.uscr-breadth-up{background:var(--uscr-up);}
.uscr-breadth-down{background:var(--uscr-down);}
.uscr-breadth-flat{background:var(--dsw-alias-border-l2);}
.uscr-breadth-compact{height:4px;}
.uscr-sector-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;font-size:11px;
  color:var(--dsw-alias-label-secondary);}
.uscr-sector-meta span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.uscr-sector-meta b{font-weight:700;color:var(--dsw-alias-label-primary);}
.uscr-table{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);}
.uscr-tr{display:grid;grid-template-columns:44px minmax(150px,1.7fr) 100px 96px 112px 112px 82px 82px;
  align-items:center;gap:8px;padding:0 14px;min-height:48px;}
.uscr-th{min-height:38px;background:var(--dsw-alias-bg-layer-2);font-size:11px;font-weight:600;
  color:var(--dsw-alias-label-secondary);letter-spacing:.03em;}
.uscr-row{width:100%;border:0;border-top:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;
  font:inherit;text-align:left;cursor:pointer;transition:background .12s;}
.uscr-row:hover{background:var(--dsw-alias-bg-layer-2);}
.uscr-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}
.uscr-rank{font-size:12px;color:var(--dsw-alias-label-secondary);font-weight:600;}
.uscr-rank.is-top{color:var(--uscr-gold);}
.uscr-stock-main{display:flex;flex-direction:column;gap:2px;min-width:0;}
.uscr-stock-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.uscr-stock-code{font-size:10.5px;color:var(--dsw-alias-label-secondary);letter-spacing:.03em;}
.uscr-cell{font-size:12.5px;font-weight:600;}
.uscr-cell-muted{font-size:12px;color:var(--dsw-alias-label-secondary);font-weight:500;}
.uscr-mini-pct{font-size:11.5px;font-weight:700;}
.uscr-section{margin:0 0 16px;}
.uscr-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;}
.uscr-section-head h3{margin:0;font-size:13px;font-weight:700;}
.uscr-section-extra{font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.uscr-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;border:1px solid var(--dsw-alias-border-l1);
  border-radius:11px;overflow:hidden;background:var(--dsw-alias-border-l1);}
.uscr-stat{background:var(--dsw-alias-bg-layer-1);padding:9px 11px;display:flex;flex-direction:column;gap:3px;}
.uscr-stat-label{font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.uscr-stat-value{font-size:13px;font-weight:700;}
.uscr-empty{padding:26px 12px;text-align:center;font-size:12.5px;color:var(--dsw-alias-label-secondary);}
.uscr-footer{margin-top:26px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1);
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  font-size:11px;color:var(--dsw-alias-label-secondary);}
.uscr-chips{display:flex;flex-wrap:wrap;gap:7px;}
.uscr-chip{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
  color:inherit;font:inherit;font-size:12px;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;transition:border-color .14s,background .14s;}
.uscr-chip:hover{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);}
.uscr-chip em{font-style:normal;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.uscr-company-list{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;overflow:hidden;}
.uscr-company-row{display:grid;grid-template-columns:minmax(0,1fr) 82px 78px 74px;align-items:center;gap:8px;
  width:100%;border:0;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
  color:inherit;font:inherit;text-align:left;padding:9px 11px;cursor:pointer;transition:background .12s;}
.uscr-company-row:first-child{border-top:0;}
.uscr-company-row:hover{background:var(--dsw-alias-bg-layer-2);}
.uscr-company-main{display:flex;flex-direction:column;gap:1px;min-width:0;text-align:left;}
.uscr-company-main b{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.uscr-company-main em{font-style:normal;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.uscr-company-price,.uscr-company-pct,.uscr-company-cap{font-size:12px;font-weight:600;text-align:right;}
.uscr-company-cap{color:var(--dsw-alias-label-secondary);font-weight:500;}
.uscr-news{display:flex;flex-direction:column;gap:1px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;overflow:hidden;}
.uscr-news-item{display:block;padding:10px 12px;background:var(--dsw-alias-bg-layer-1);border-top:1px solid var(--dsw-alias-border-l1);
  color:inherit;text-decoration:none;transition:background .12s;}
.uscr-news-item:first-child{border-top:0;}
.uscr-news-item:hover{background:var(--dsw-alias-bg-layer-2);}
.uscr-news-title{font-size:12.5px;font-weight:600;line-height:1.45;display:block;}
.uscr-news-meta{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:10.5px;color:var(--dsw-alias-label-secondary);}
.uscr-news-important{color:var(--uscr-gold);font-weight:700;}
.uscr-news-abstract{margin-top:4px;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-secondary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.uscr-chart-wrap{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);
  padding:10px 10px 6px;overflow:hidden;}
.uscr-chart-meta{display:flex;align-items:center;justify-content:space-between;font-size:10.5px;
  color:var(--dsw-alias-label-secondary);padding:0 2px;margin-bottom:2px;}
.uscr-chart{display:block;width:100%;height:150px;}
.uscr-periods{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;}
.uscr-period{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
  color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:600;padding:4px 9px;
  border-radius:7px;cursor:pointer;transition:background .14s,border-color .14s,color .14s;}
.uscr-period:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary);}
.uscr-period.is-active{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;}
.uscr-genui-chart{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);
  min-height:240px;overflow:hidden;padding:2px;}
.uscr-genui-chart dsh-genui-card{display:block;width:100%;height:240px;min-height:220px;}
.uscr-kline{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);
  padding:10px 8px 6px;position:relative;overflow:hidden;}
.uscr-kline-info{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:11px;
  color:var(--dsw-alias-label-secondary);padding:0 4px 8px;}
.uscr-kline-date{font-size:12px;font-weight:700;color:var(--dsw-alias-label-primary);}
.uscr-kline-info-item{display:inline-flex;align-items:baseline;gap:4px;white-space:nowrap;}
.uscr-kline-info-item em{font-style:normal;font-size:10px;color:var(--dsw-alias-label-secondary);}
.uscr-kline-info-item b{font-size:12px;font-weight:700;color:var(--dsw-alias-label-primary);}
.uscr-kline-svg{display:block;width:100%;touch-action:none;cursor:crosshair;user-select:none;-webkit-user-select:none;}
.uscr-kline-tools{position:absolute;right:10px;bottom:30px;display:flex;gap:4px;}
.uscr-kline-tools .uscr-icon-btn{background:var(--dsw-alias-bg-layer-2);}
.uscr-kline-skeleton{height:300px;border-radius:11px;border:1px solid var(--dsw-alias-border-l1);
  background:linear-gradient(90deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));
  background-size:200% 100%;animation:uscr-shimmer 1.4s infinite;}
.uscr-chart-note{font-size:10.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);margin-top:6px;}
.uscr-trust{display:flex;flex-wrap:wrap;gap:8px;}
.uscr-trust-item{flex:1 1 120px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px;}
.uscr-trust-item span{display:block;font-size:10.5px;color:var(--dsw-alias-label-secondary);margin-bottom:2px;}
.uscr-trust-item b{font-size:13px;}
.uscr-skeleton{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2));
  background-size:200% 100%;animation:uscr-shimmer 1.4s infinite;}
.uscr-skeleton-card{height:150px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);
  background:linear-gradient(90deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));
  background-size:200% 100%;animation:uscr-shimmer 1.4s infinite;}
.uscr-toast{position:fixed;left:50%;bottom:28px;z-index:70;transform:translateX(-50%);max-width:min(520px,90vw);
  padding:10px 16px;border-radius:10px;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 12px 32px rgba(5,15,30,.24);font-size:12.5px;color:var(--dsw-alias-label-primary);animation:uscr-fade .16s ease-out;}
.uscr-drawer-mask{position:fixed;inset:0;z-index:60;background:rgba(6,14,26,.48);backdrop-filter:blur(2px);
  display:flex;justify-content:flex-end;animation:uscr-fade .16s ease-out;}
.uscr-drawer{width:min(560px,100vw);height:100%;background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l1);
  box-shadow:-24px 0 60px rgba(5,15,30,.28);display:flex;flex-direction:column;animation:uscr-slide .22s cubic-bezier(.22,.8,.3,1);}
.uscr-drawer-head{position:relative;padding:18px 20px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);
  background:linear-gradient(180deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-base));}
.uscr-drawer-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}
.uscr-icon-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
  color:var(--dsw-alias-label-secondary);border-radius:8px;width:30px;height:30px;display:inline-flex;align-items:center;
  justify-content:center;cursor:pointer;font-size:15px;line-height:1;}
.uscr-icon-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);}
.uscr-kind{display:inline-flex;align-items:center;height:21px;padding:0 8px;border-radius:5px;font-size:10.5px;font-weight:700;
  letter-spacing:.06em;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary);}
.uscr-drawer-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.uscr-drawer-name{margin:0;font-size:21px;font-weight:700;line-height:1.2;}
.uscr-drawer-code{margin-top:4px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.uscr-drawer-price{text-align:right;}
.uscr-drawer-price b{display:block;font-size:25px;line-height:1.1;}
.uscr-drawer-price span{font-size:12.5px;font-weight:700;}
.uscr-drawer-body{flex:1;overflow-y:auto;padding:16px 20px 30px;overscroll-behavior:contain;}
.uscr-drawer-loading{padding:40px 20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px;}
.uscr-drawer-error{margin:20px;padding:16px;border-radius:11px;
  border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 30%,transparent);
  background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);font-size:12.5px;}
.uscr-breadth-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:12px;}
.uscr-breadth-head b{font-size:14px;}
.uscr-breadth-legend{display:flex;gap:12px;margin-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary);}
.uscr-breadth-legend i{display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:4px;vertical-align:1px;}
.uscr-top-gainers{display:flex;gap:8px;flex-wrap:wrap;}
.uscr-mini-chip{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:5px 9px;font-size:11.5px;
  background:var(--dsw-alias-bg-layer-1);cursor:pointer;color:inherit;font:inherit;display:inline-flex;gap:6px;align-items:center;}
.uscr-mini-chip:hover{border-color:var(--dsw-alias-brand-primary);}
.uscr-loading-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}
@media (max-width:1080px){
  .uscr-root{padding:22px 20px 48px;}
  .uscr-hero{grid-template-columns:repeat(2,minmax(0,1fr));}
  .uscr-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .uscr-exclusive{display:none;}
  .uscr-loading-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:760px){
  .uscr-root{padding:18px 14px 42px;}
  .uscr-title{font-size:22px;}
  .uscr-hero{grid-template-columns:1fr;}
  .uscr-grid{grid-template-columns:1fr;}
  .uscr-tr{grid-template-columns:34px minmax(120px,1.5fr) 92px 76px 90px;padding:0 10px;}
  .uscr-tr .uscr-hide-md{display:none;}
  .uscr-search input{width:120px;}
  .uscr-stats{grid-template-columns:repeat(2,minmax(0,1fr));}
  .uscr-company-row{grid-template-columns:minmax(0,1fr) 76px 70px;}
  .uscr-company-cap{display:none;}
  .uscr-drawer{width:100vw;}
}
@media (prefers-reduced-motion:reduce){
  .uscr-dot,.uscr-spin,.uscr-skeleton,.uscr-skeleton-card{animation:none!important;}
  .uscr-drawer,.uscr-drawer-mask{animation:none!important;}
}
@keyframes uscr-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes uscr-spin{to{transform:rotate(360deg)}}
@keyframes uscr-fade{from{opacity:0}to{opacity:1}}
@keyframes uscr-slide{from{transform:translateX(26px);opacity:.4}to{transform:translateX(0);opacity:1}}
@keyframes uscr-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
`

    /* ------------------------------------------------------------ */
    /* 指数 / 速览 / 板块                                            */
    /* ------------------------------------------------------------ */

    const INDEX_ETFS = {
      '.DJI': ['DIA'],
      '.IXIC': ['QQQ', 'QQQM'],
      '.SPX': ['SPY', 'VOO', 'IVV'],
    }

    const ETF_INDEX = {
      QQQ: '.IXIC',
      QQQM: '.IXIC',
      SPY: '.SPX',
      VOO: '.SPX',
      IVV: '.SPX',
      DIA: '.DJI',
    }

    const ETF_FALLBACK_NAMES = {
      DIA: '道指 ETF-DIA',
      QQQ: '纳指 100 ETF-QQQ',
      QQQM: '纳指 100 ETF-QQQM',
      SPY: '标普 500 ETF-SPY',
      VOO: '标普 500 ETF-VOO',
      IVV: '标普 500 ETF-IVV',
    }

    function IndexCard({ item, onOpen, t }) {
      const tone = toneOf(item.changePct)
      return h(
        'button',
        {
          type: 'button',
          className: 'uscr-card uscr-index-card',
          onClick: () => onOpen(item.code, 'index'),
          'aria-label': `${item.name} ${fmt(item.price)} ${pct(item.changePct)}`,
        },
        h(
          'div',
          { className: 'uscr-index-top' },
          h('span', { className: 'uscr-index-name' }, item.short || item.name),
          h('span', { className: 'uscr-index-code' }, item.code),
        ),
        h('div', { className: `uscr-index-value uscr-${tone}` }, fmt(item.price, 2)),
        h(
          'div',
          { className: 'uscr-index-change' },
          h('span', { className: `uscr-${tone}` }, signed(item.change, 2)),
          h(Pill, { value: item.changePct }),
        ),
        h(
          'div',
          { className: 'uscr-index-foot' },
          h('span', null, `${t('low')} ${fmt(item.low, 2)}`),
          h('span', null, `${t('high')} ${fmt(item.high, 2)}`),
        ),
        h(RangeBar, { low: item.low, high: item.high, value: item.price, prev: item.prevClose }),
      )
    }

    function BriefCard({ data, t }) {
      const sectors = data.sectors ?? []
      const etfs = data.etfs ?? []
      const upSector = sectors.filter((s) => (toNum(s.changePct) ?? 0) > 0).length
      const downSector = sectors.filter((s) => (toNum(s.changePct) ?? 0) < 0).length
      const upEtf = etfs.filter((s) => (toNum(s.changePct) ?? 0) > 0).length
      const downEtf = etfs.filter((s) => (toNum(s.changePct) ?? 0) < 0).length
      const leaderSector = sectors[0]
      const leaderStock = (data.stocks ?? [])[0]
      const phase = data.phase ?? { label: '--' }
      return h(
        'div',
        { className: 'uscr-card uscr-brief' },
        h(
          'div',
          { className: 'uscr-brief-title' },
          h(
            'svg',
            {
              width: 15,
              height: 15,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': 'true',
            },
            h('path', { d: 'M4 19V5' }),
            h('path', { d: 'M4 19h16' }),
            h('path', { d: 'm7 15 4-4 3 2 5-6' }),
          ),
          t('brief'),
        ),
        h(
          'div',
          { className: 'uscr-brief-row' },
          h('span', null, t('marketPhase')),
          h('b', { className: data.live ? 'uscr-up' : '' }, phaseLabel(phase, t)),
        ),
        h(
          'div',
          { className: 'uscr-brief-row' },
          h('span', null, t('sectorsUpDown')),
          h(
            'b',
            null,
            h('span', { className: 'uscr-up' }, upSector),
            ' / ',
            h('span', { className: 'uscr-down' }, downSector),
          ),
        ),
        h(
          'div',
          { className: 'uscr-brief-row' },
          h('span', null, t('etfsUpDown')),
          h(
            'b',
            null,
            h('span', { className: 'uscr-up' }, upEtf),
            ' / ',
            h('span', { className: 'uscr-down' }, downEtf),
          ),
        ),
        h(
          'div',
          { className: 'uscr-brief-row' },
          h('span', null, t('leaderSector')),
          h(
            'b',
            null,
            leaderSector ? `${leaderSector.name} ` : '--',
            leaderSector ? h('span', { className: `uscr-${toneOf(leaderSector.changePct)}` }, pct(leaderSector.changePct)) : null,
          ),
        ),
        h(
          'div',
          { className: 'uscr-brief-row' },
          h('span', null, t('leaderStock')),
          h(
            'b',
            null,
            leaderStock ? `${leaderStock.name} ` : '--',
            leaderStock ? h('span', { className: `uscr-${toneOf(leaderStock.changePct)}` }, pct(leaderStock.changePct)) : null,
          ),
        ),
      )
    }

    function SectorCard({ item, onOpen, t }) {
      const tone = toneOf(item.changePct)
      return h(
        'button',
        {
          type: 'button',
          className: 'uscr-sector-card',
          onClick: () => onOpen(item.code, 'sector'),
          title: `${item.name} ${item.code}`,
        },
        h(
          'div',
          { className: 'uscr-sector-head' },
          h(
            'div',
            null,
            h('div', { className: 'uscr-sector-name' }, item.name),
            h('div', { className: 'uscr-sector-code' }, `${item.code}${item.enName ? ` · ${item.enName}` : ''}`),
          ),
          h(Pill, { value: item.changePct }),
        ),
        h(BreadthBar, { rise: item.rise, fall: item.fall, flat: item.flat }),
        h(
          'div',
          { className: 'uscr-sector-meta' },
          h(
            'span',
            null,
            `${t('rise')} `,
            h('b', { className: 'uscr-up' }, item.rise ?? 0),
            ' · ',
            `${t('fall')} `,
            h('b', { className: 'uscr-down' }, item.fall ?? 0),
          ),
          item.leader
            ? h(
                'span',
                null,
                `${t('leader')} `,
                h('b', null, item.leader.name),
                ' ',
                h('b', { className: `uscr-${toneOf(item.leader.changePct)}` }, pct(item.leader.changePct)),
              )
            : h('span', { className: `uscr-${tone}` }, pct(item.changePct)),
        ),
      )
    }

    /* ------------------------------------------------------------ */
    /* 表格                                                          */
    /* ------------------------------------------------------------ */

    function StockTable({ rows, onOpen, t }) {
      if (!rows.length) return h(Empty, { text: t('empty') })
      return h(
        'div',
        { className: 'uscr-table', role: 'table' },
        h(
          'div',
          { className: 'uscr-tr uscr-th', role: 'row' },
          h('span', { role: 'columnheader' }, t('rank')),
          h('span', { role: 'columnheader' }, t('name')),
          h('span', { role: 'columnheader' }, t('price')),
          h('span', { role: 'columnheader' }, t('change')),
          h('span', { role: 'columnheader' }, t('turnover')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('marketCap')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('fiveDay')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('twentyDay')),
        ),
        rows.map((row, index) =>
          h(
            'button',
            {
              type: 'button',
              role: 'row',
              key: `${row.code}-${index}`,
              className: 'uscr-tr uscr-row',
              onClick: () => onOpen(row.code, 'stock'),
            },
            h('span', { className: `uscr-rank ${index < 3 ? 'is-top' : ''}` }, index + 1),
            h(
              'span',
              { className: 'uscr-stock-main' },
              h('span', { className: 'uscr-stock-name' }, row.name),
              h('span', { className: 'uscr-stock-code' }, row.code),
            ),
            h('span', { className: 'uscr-cell' }, fmt(row.price, 3)),
            h('span', { className: `uscr-cell uscr-${toneOf(row.changePct)}` }, pct(row.changePct)),
            h('span', { className: 'uscr-cell uscr-cell-muted' }, amount(row.turnover)),
            h('span', { className: 'uscr-cell uscr-cell-muted uscr-hide-md' }, amount(row.marketCap)),
            h(
              'span',
              { className: `uscr-mini-pct uscr-hide-md uscr-${toneOf(row.change5d)}` },
              pct(row.change5d),
            ),
            h(
              'span',
              { className: `uscr-mini-pct uscr-hide-md uscr-${toneOf(row.change20d)}` },
              pct(row.change20d),
            ),
          ),
        ),
      )
    }

    function EtfTable({ rows, onOpen, t }) {
      if (!rows.length) return h(Empty, { text: t('empty') })
      return h(
        'div',
        { className: 'uscr-table', role: 'table' },
        h(
          'div',
          { className: 'uscr-tr uscr-th', role: 'row' },
          h('span', { role: 'columnheader' }, t('rank')),
          h('span', { role: 'columnheader' }, t('name')),
          h('span', { role: 'columnheader' }, t('price')),
          h('span', { role: 'columnheader' }, t('change')),
          h('span', { role: 'columnheader' }, t('turnover')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('aum')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('fiveDay')),
          h('span', { role: 'columnheader', className: 'uscr-hide-md' }, t('twentyDay')),
        ),
        rows.map((row, index) =>
          h(
            'button',
            {
              type: 'button',
              role: 'row',
              key: `${row.code}-${index}`,
              className: 'uscr-tr uscr-row',
              onClick: () => onOpen(row.code, 'etf'),
            },
            h('span', { className: `uscr-rank ${index < 3 ? 'is-top' : ''}` }, index + 1),
            h(
              'span',
              { className: 'uscr-stock-main' },
              h('span', { className: 'uscr-stock-name' }, row.name),
              h('span', { className: 'uscr-stock-code' }, row.code),
            ),
            h('span', { className: 'uscr-cell' }, fmt(row.price, 3)),
            h('span', { className: `uscr-cell uscr-${toneOf(row.changePct)}` }, pct(row.changePct)),
            h('span', { className: 'uscr-cell uscr-cell-muted' }, amount(row.turnover)),
            h('span', { className: 'uscr-cell uscr-cell-muted uscr-hide-md' }, amount(row.aum)),
            h('span', { className: `uscr-mini-pct uscr-hide-md uscr-${toneOf(row.change5d)}` }, pct(row.change5d)),
            h(
              'span',
              { className: `uscr-mini-pct uscr-hide-md uscr-${toneOf(row.change20d)}` },
              pct(row.change20d),
            ),
          ),
        ),
      )
    }

    /* ------------------------------------------------------------ */
    /* 分时图                                                        */
    /* ------------------------------------------------------------ */

    function PriceChart({ points, prevClose, t }) {
      const clean = (points ?? []).filter((p) => toNum(p.price) !== null)
      if (clean.length < 2) return h(Empty, { text: t('noChart') })
      const W = 640
      const H = 156
      const PAD = 8
      const values = clean.map((p) => toNum(p.price))
      const base = toNum(prevClose)
      let min = Math.min(...values)
      let max = Math.max(...values)
      if (base !== null) {
        min = Math.min(min, base)
        max = Math.max(max, base)
      }
      if (max - min < 1e-6) {
        max += 1
        min -= 1
      }
      const pad = (max - min) * 0.08
      min -= pad
      max += pad
      const span = max - min
      const x = (i) => PAD + ((W - PAD * 2) * i) / (clean.length - 1)
      const y = (v) => PAD + (H - PAD * 2) * (1 - (v - min) / span)
      const line = clean.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(toNum(p.price)).toFixed(1)}`).join(' ')
      const area = `${line} L${x(clean.length - 1).toFixed(1)} ${(H - PAD).toFixed(1)} L${PAD} ${(H - PAD).toFixed(1)} Z`
      const last = toNum(clean[clean.length - 1].price)
      const rising = base === null ? true : last >= base
      const color = rising
        ? 'var(--dsw-alias-state-error-primary)'
        : 'var(--dsw-alias-state-success-primary)'
      const id = `uscr-chart-${rising ? 'up' : 'down'}`
      return h(
        'div',
        { className: 'uscr-chart-wrap' },
        h(
          'div',
          { className: 'uscr-chart-meta' },
          h('span', null, shortTime(clean[0].t)),
          h('span', null, `${t('prevClose')} ${fmt(base, 3)}`),
          h('span', null, shortTime(clean[clean.length - 1].t)),
        ),
        h(
          'svg',
          {
            className: 'uscr-chart',
            viewBox: `0 0 ${W} ${H}`,
            preserveAspectRatio: 'none',
            role: 'img',
            'aria-label': t('chart'),
          },
          h(
            'defs',
            null,
            h(
              'linearGradient',
              { id, x1: '0', y1: '0', x2: '0', y2: '1' },
              h('stop', { offset: '0%', stopColor: color, stopOpacity: '0.22' }),
              h('stop', { offset: '100%', stopColor: color, stopOpacity: '0.01' }),
            ),
          ),
          [0.2, 0.4, 0.6, 0.8].map((ratio) =>
            h('line', {
              key: ratio,
              x1: PAD,
              x2: W - PAD,
              y1: PAD + (H - PAD * 2) * ratio,
              y2: PAD + (H - PAD * 2) * ratio,
              stroke: 'currentColor',
              strokeOpacity: 0.08,
              strokeWidth: 1,
              vectorEffect: 'non-scaling-stroke',
            }),
          ),
          base !== null
            ? h('line', {
                x1: PAD,
                x2: W - PAD,
                y1: y(base),
                y2: y(base),
                stroke: 'currentColor',
                strokeOpacity: 0.35,
                strokeDasharray: '4 4',
                strokeWidth: 1,
                vectorEffect: 'non-scaling-stroke',
              })
            : null,
          h('path', { d: area, fill: `url(#${id})` }),
          h('path', {
            d: line,
            fill: 'none',
            stroke: color,
            strokeWidth: 1.7,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
            vectorEffect: 'non-scaling-stroke',
          }),
          h('circle', {
            cx: x(clean.length - 1),
            cy: y(last),
            r: 3,
            fill: color,
            stroke: 'var(--dsw-alias-bg-layer-1)',
            strokeWidth: 1.5,
            vectorEffect: 'non-scaling-stroke',
          }),
        ),
      )
    }

    /* ------------------------------------------------------------ */
    /* 图表：分时（GenUI）+ K 线（原生可拖拽蜡烛图）                  */
    /* ------------------------------------------------------------ */

    const KLINE_PERIODS = [
      ['intraday', 'period.intraday'],
      ['5m', 'period.5m'],
      ['day', 'period.day'],
      ['week', 'period.week'],
      ['month', 'period.month'],
      ['quarter', 'period.quarter'],
      ['year', 'period.year'],
    ]

    function cssVar(name, fallback) {
      try {
        const host = document.querySelector('.uscr-root')
        const value = getComputedStyle(host ?? document.documentElement).getPropertyValue(name).trim()
        return value || fallback
      } catch {
        return fallback
      }
    }

    let genuiRuntimePromise = null
    function ensureGenuiRuntime() {
      if (typeof customElements !== 'undefined' && customElements.get('dsh-genui-card')) {
        return Promise.resolve()
      }
      if (genuiRuntimePromise) return genuiRuntimePromise
      genuiRuntimePromise = new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
          reject(new Error('no document'))
          return
        }
        const timer = setTimeout(() => reject(new Error('GenUI runtime timeout')), 15_000)
        const existing = document.querySelector('script[data-uscr-genui-runtime]')
        const script = existing ?? document.createElement('script')
        script.type = 'module'
        script.src = '/dsh-genui/runtime.js'
        script.dataset.uscrGenuiRuntime = '1'
        script.addEventListener('load', () => {
          clearTimeout(timer)
          if (customElements.get('dsh-genui-card')) resolve()
          else reject(new Error('GenUI runtime loaded without dsh-genui-card'))
        })
        script.addEventListener('error', () => {
          clearTimeout(timer)
          reject(new Error('GenUI runtime failed to load'))
        })
        if (!existing) document.head.appendChild(script)
      }).catch((error) => {
        genuiRuntimePromise = null
        throw error
      })
      return genuiRuntimePromise
    }

    function GenuiIntraday({ points, prevClose, t }) {
      const hostRef = React.useRef(null)
      const [failed, setFailed] = React.useState(false)

      const sampled = React.useMemo(() => {
        const clean = lastSessionPoints(points).map((point) => ({
          t: Number(point.t),
          price: toNum(point.price),
        }))
        if (!clean.length) return []
        const step = Math.max(1, Math.ceil(clean.length / 220))
        const out = clean.filter((_, index) => index % step === 0)
        const last = clean[clean.length - 1]
        if (out[out.length - 1]?.t !== last.t) out.push(last)
        return out
      }, [points])

      const schema = React.useMemo(() => {
        const base = toNum(prevClose)
        const rows = sampled.map((point) => {
          const row = {
            time: shortTime(point.t),
            价格: Number(point.price.toFixed(3)),
          }
          if (base !== null) row['昨收'] = base
          return row
        })
        return {
          componentName: 'Page',
          children: [
            {
              componentName: 'TinyHuichartsLine',
              props: {
                options: {
                  data: rows,
                  xAxis: { data: 'time' },
                  yAxis: {},
                  legend: { show: true },
                  tooltip: { trigger: 'axis' },
                  dataZoom: { type: 'inside' },
                  padding: [22, 8, 22, 8],
                  color: [cssVar('--uscr-up', '#e5484d'), cssVar('--uscr-flat', '#8a94a6')],
                },
              },
            },
          ],
        }
      }, [sampled, prevClose])

      React.useEffect(() => {
        let cancelled = false
        const host = hostRef.current
        if (!host) return undefined
        let checkTimer = null
        ensureGenuiRuntime()
          .then(() => {
            if (cancelled || !hostRef.current) return
            host.innerHTML = ''
            const card = document.createElement('dsh-genui-card')
            card.style.display = 'block'
            card.style.width = '100%'
            card.style.height = '240px'
            card.style.minHeight = '220px'
            host.appendChild(card)
            card.content = JSON.stringify(schema)
            card.isJsonComplete = true
            card.generating = false
            checkTimer = setTimeout(() => {
              if (cancelled || !hostRef.current) return
              const rendered = hostRef.current.querySelector('dsh-genui-card')
              if (rendered && !rendered.querySelector('canvas,svg')) setFailed(true)
            }, 4_000)
          })
          .catch(() => {
            if (!cancelled) setFailed(true)
          })
        return () => {
          cancelled = true
          if (checkTimer) clearTimeout(checkTimer)
          if (hostRef.current) hostRef.current.innerHTML = ''
        }
      }, [schema])

      if (failed) {
        return h(
          React.Fragment,
          null,
          h(PriceChart, { points: lastSessionPoints(points), prevClose, t }),
          h('div', { className: 'uscr-chart-note' }, t('genuiFallback')),
        )
      }

      return h('div', {
        ref: hostRef,
        className: 'uscr-genui-chart',
        style: {
          '--tr-bubble-content-bg': 'transparent',
          '--tr-bubble-text-color': 'var(--dsw-alias-label-primary)',
          '--tr-bubble-content-padding': '0',
          '--tr-bubble-content-border-radius': '10px',
          '--tr-bubble-content-box-shadow': 'none',
        },
      })
    }

    function KlineInfo({ bar, preClose, period, t }) {
      if (!bar) return null
      const change =
        bar.changePct ??
        (preClose ? ((bar.c - preClose) / preClose) * 100 : null)
      const tone = toneOf(change)
      const items = [
        [t('open'), fmt(bar.o, 3)],
        [t('high'), fmt(bar.h, 3)],
        [t('low'), fmt(bar.l, 3)],
        [t('close'), fmt(bar.c, 3)],
        [t('changePct'), pct(change)],
        [t('volume'), amount(bar.v)],
      ]
      if (bar.turnover) items.push([t('turnover'), amount(bar.turnover)])
      return h(
        'div',
        { className: 'uscr-kline-info' },
        h('span', { className: 'uscr-kline-date' }, bar.date),
        items.map(([label, value], index) =>
          h(
            'span',
            { key: `${label}-${index}`, className: 'uscr-kline-info-item' },
            h('em', null, label),
            h(
              'b',
              { className: label === t('changePct') ? `uscr-${tone}` : '' },
              value,
            ),
          ),
        ),
      )
    }

    function KlineChart({ bars, period, preClose, t }) {
      const wrapRef = React.useRef(null)
      const svgRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const [width, setWidth] = React.useState(720)
      const [view, setView] = React.useState(() => ({
        visible: Math.min(bars.length || 90, period === '5m' ? 96 : 90),
        end: bars.length,
        selected: Math.max(0, bars.length - 1),
      }))
      const [hover, setHover] = React.useState(null)

      React.useEffect(() => {
        if (!wrapRef.current) return undefined
        const observer = new ResizeObserver((entries) => {
          const next = entries[0]?.contentRect?.width
          if (next && Number.isFinite(next)) setWidth(Math.max(300, Math.round(next)))
        })
        observer.observe(wrapRef.current)
        return () => observer.disconnect()
      }, [])

      React.useEffect(() => {
        const count = bars.length
        const visible = Math.min(count || 1, period === '5m' ? 96 : 90)
        setView({ visible, end: count, selected: Math.max(0, count - 1) })
        setHover(null)
      }, [bars, period])

      const H = 330
      const PAD = { left: 8, right: 60, top: 20, bottom: 22 }
      const VOLUME_H = 52
      const plotW = Math.max(40, width - PAD.left - PAD.right)
      const priceH = H - PAD.top - PAD.bottom - VOLUME_H
      const volumeBottom = H - PAD.bottom
      const visible = Math.max(1, Math.min(view.visible, bars.length || 1))
      const end = Math.max(visible, Math.min(view.end, bars.length))
      const start = Math.max(0, Math.min(end - visible, bars.length - visible))
      const slice = bars.slice(start, end)
      const barW = plotW / Math.max(1, slice.length)
      const bodyW = Math.max(1, barW * 0.62)

      const values = slice.flatMap((bar) => [bar.h, bar.l])
      const base = toNum(preClose)
      let min = values.length ? Math.min(...values) : 0
      let max = values.length ? Math.max(...values) : 1
      const span = max - min || Math.max(1, max * 0.02)
      min -= span * 0.04
      max += span * 0.04
      const range = max - min || 1
      const y = (value) => PAD.top + priceH * (1 - (value - min) / range)
      const x = (index) => PAD.left + (index + 0.5) * barW
      const volumeMax = Math.max(1, ...slice.map((bar) => bar.v ?? 0))
      const active = bars[
        hover !== null ? Math.min(bars.length - 1, start + hover) : Math.min(bars.length - 1, view.selected)
      ]

      const zoomBy = React.useCallback(
        (factor) => {
          setView((previous) => {
            const maximum = Math.min(260, Math.max(16, bars.length))
            const next = Math.min(maximum, Math.max(16, Math.round(previous.visible * factor)))
            return {
              ...previous,
              visible: next,
              end: Math.min(Math.max(previous.end, next), bars.length),
            }
          })
        },
        [bars.length],
      )

      React.useEffect(() => {
        const element = wrapRef.current
        if (!element) return undefined
        const onWheel = (event) => {
          if (!event.deltaY) return
          event.preventDefault()
          zoomBy(event.deltaY > 0 ? 1.18 : 0.85)
        }
        element.addEventListener('wheel', onWheel, { passive: false })
        return () => element.removeEventListener('wheel', onWheel)
      }, [zoomBy])

      const pointerIndex = (event) => {
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect || rect.width <= 0) return 0
        const relative = (event.clientX - rect.left - PAD.left) / Math.max(0.001, barW)
        return Math.max(0, Math.min(slice.length - 1, Math.floor(relative)))
      }

      const onPointerDown = (event) => {
        dragRef.current = { x: event.clientX, end, moved: false }
        setHover(pointerIndex(event))
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* 忽略 */
        }
      }

      const onPointerMove = (event) => {
        const index = pointerIndex(event)
        setHover(index)
        const drag = dragRef.current
        if (!drag) return
        const dx = event.clientX - drag.x
        if (Math.abs(dx) > 3) drag.moved = true
        const shift = Math.round(dx / Math.max(0.001, barW))
        setView((previous) => ({
          ...previous,
          end: Math.min(bars.length, Math.max(previous.visible, drag.end - shift)),
        }))
      }

      const onPointerUp = (event) => {
        const drag = dragRef.current
        dragRef.current = null
        if (!drag?.moved) {
          const index = pointerIndex(event)
          setView((previous) => ({
            ...previous,
            selected: Math.min(bars.length - 1, start + index),
          }))
        }
        try {
          event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
          /* 忽略 */
        }
      }

      const onPointerLeave = () => {
        if (!dragRef.current) setHover(null)
      }

      if (!slice.length) return h(Empty, { text: t('klineNoData') })

      const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const value = max - range * ratio
        const yPos = y(value)
        return h(
          'g',
          { key: `grid-${ratio}` },
          h('line', {
            x1: PAD.left,
            x2: width - PAD.right,
            y1: yPos,
            y2: yPos,
            stroke: 'var(--dsw-alias-border-l1)',
            strokeWidth: 1,
            strokeDasharray: ratio === 0 || ratio === 1 ? '' : '3 4',
          }),
          h(
            'text',
            {
              x: width - PAD.right + 5,
              y: yPos + 3,
              fontSize: 10,
              fill: 'var(--dsw-alias-label-secondary)',
            },
            fmt(value, value > 1000 ? 0 : 2),
          ),
        )
      })

      const xLabels = [0, Math.floor(slice.length / 2), slice.length - 1]
        .filter((value, index, list) => list.indexOf(value) === index)
        .map((index) => {
          const bar = slice[index]
          const label =
            period === '5m'
              ? bar.date.slice(11)
              : period === 'year'
                ? bar.date.slice(0, 4)
                : period === 'quarter' || period === 'month'
                  ? bar.date.slice(0, 7)
                  : bar.date.slice(5, 10)
          return h(
            'text',
            {
              key: `x-${index}`,
              x: x(index),
              y: H - 6,
              fontSize: 10,
              fill: 'var(--dsw-alias-label-secondary)',
              textAnchor: index === 0 ? 'start' : index === slice.length - 1 ? 'end' : 'middle',
            },
            label,
          )
        })

      return h(
        'div',
        { className: 'uscr-kline', ref: wrapRef },
        h(KlineInfo, { bar: active, preClose, period, t }),
        h(
          'svg',
          {
            ref: svgRef,
            width: '100%',
            height: H,
            viewBox: `0 0 ${width} ${H}`,
            className: 'uscr-kline-svg',
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave,
          },
          gridLines,
          base !== null && base >= min && base <= max
            ? h('line', {
                x1: PAD.left,
                x2: width - PAD.right,
                y1: y(base),
                y2: y(base),
                stroke: 'var(--dsw-alias-label-secondary)',
                strokeDasharray: '4 4',
                strokeOpacity: 0.55,
                strokeWidth: 1,
              })
            : null,
          slice.map((bar, index) => {
            const center = x(index)
            const up = bar.c >= bar.o
            const color = up ? 'var(--uscr-up)' : 'var(--uscr-down)'
            const top = Math.min(y(bar.o), y(bar.c))
            const height = Math.max(1, Math.abs(y(bar.c) - y(bar.o)))
            return h(
              'g',
              { key: `candle-${index}` },
              h('line', {
                x1: center,
                x2: center,
                y1: y(bar.h),
                y2: y(bar.l),
                stroke: color,
                strokeWidth: 1,
              }),
              h('rect', {
                x: center - bodyW / 2,
                y: top,
                width: bodyW,
                height,
                fill: color,
                stroke: color,
                strokeWidth: 0.5,
                rx: 0.4,
              }),
              h('rect', {
                x: center - bodyW / 2,
                y: volumeBottom - ((bar.v ?? 0) / volumeMax) * VOLUME_H,
                width: bodyW,
                height: Math.max(0.5, ((bar.v ?? 0) / volumeMax) * VOLUME_H),
                fill: color,
                opacity: 0.55,
              }),
            )
          }),
          h('line', {
            x1: PAD.left,
            x2: width - PAD.right,
            y1: volumeBottom - VOLUME_H,
            y2: volumeBottom - VOLUME_H,
            stroke: 'var(--dsw-alias-border-l1)',
            strokeWidth: 1,
          }),
          hover !== null && slice[hover]
            ? h(
                'g',
                null,
                h('line', {
                  x1: x(hover),
                  x2: x(hover),
                  y1: PAD.top,
                  y2: volumeBottom,
                  stroke: 'var(--dsw-alias-label-secondary)',
                  strokeDasharray: '3 3',
                  strokeOpacity: 0.7,
                  strokeWidth: 1,
                }),
                h('line', {
                  x1: PAD.left,
                  x2: width - PAD.right,
                  y1: y(slice[hover].c),
                  y2: y(slice[hover].c),
                  stroke: 'var(--dsw-alias-label-secondary)',
                  strokeDasharray: '3 3',
                  strokeOpacity: 0.7,
                  strokeWidth: 1,
                }),
                h('circle', {
                  cx: x(hover),
                  cy: y(slice[hover].c),
                  r: 2.8,
                  fill: slice[hover].c >= slice[hover].o ? 'var(--uscr-up)' : 'var(--uscr-down)',
                }),
              )
            : null,
          xLabels,
        ),
        h(
          'div',
          { className: 'uscr-kline-tools' },
          h(
            'button',
            { type: 'button', className: 'uscr-icon-btn', onClick: () => zoomBy(0.8), title: t('zoomIn'), 'aria-label': t('zoomIn') },
            '+',
          ),
          h(
            'button',
            { type: 'button', className: 'uscr-icon-btn', onClick: () => zoomBy(1.25), title: t('zoomOut'), 'aria-label': t('zoomOut') },
            '−',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'uscr-icon-btn',
              onClick: () => {
                const count = bars.length
                setView({ visible: Math.min(count, period === '5m' ? 96 : 90), end: count, selected: count - 1 })
              },
              title: t('resetZoom'),
              'aria-label': t('resetZoom'),
            },
            '⟲',
          ),
        ),
        h('div', { className: 'uscr-chart-note' }, t('chartHint')),
      )
    }

    function ChartPanel({ detail, t }) {
      const [period, setPeriod] = React.useState('intraday')
      const [state, setState] = React.useState({ loading: false, data: null, error: '' })
      const [nonce, setNonce] = React.useState(0)
      const cache = React.useRef(new Map())

      React.useEffect(() => {
        setPeriod('intraday')
        setState({ loading: false, data: null, error: '' })
      }, [detail.code])

      React.useEffect(() => {
        if (period === 'intraday' || detail.kind === 'sector') {
          setState({ loading: false, data: null, error: '' })
          return undefined
        }
        const key = `${detail.code}:${period}`
        const cached = cache.current.get(key)
        if (cached && Date.now() - cached.at < 5 * 60_000) {
          setState({ loading: false, data: cached.data, error: '' })
          return undefined
        }
        let cancelled = false
        setState({ loading: true, data: null, error: '' })
        fetch(`${KLINE}?code=${encodeURIComponent(detail.code)}&period=${encodeURIComponent(period)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
          .then((response) => response.json())
          .then((json) => {
            if (cancelled) return
            if (!json?.ok) throw new Error(json?.error ?? t('klineFailed'))
            cache.current.set(key, { at: Date.now(), data: json })
            setState({ loading: false, data: json, error: '' })
          })
          .catch((error) => {
            if (!cancelled) setState({ loading: false, data: null, error: String(error?.message ?? error) })
          })
        return () => {
          cancelled = true
        }
      }, [period, detail.code, detail.kind, nonce])

      const sourceLabel =
        period === 'intraday' ? '富途牛牛' : state.data?.sourceLabel ?? ''
      const extra = state.data?.label
        ? `${sourceLabel} · ${state.data.label}`
        : sourceLabel
      const periods = detail.kind === 'sector' ? KLINE_PERIODS.slice(0, 1) : KLINE_PERIODS

      const body = (() => {
        if (period === 'intraday') {
          if (detail.chart?.length > 1) {
            return h(GenuiIntraday, { points: detail.chart, prevClose: detail.quote?.prevClose, t })
          }
          return h(Empty, { text: t('noChart') })
        }
        if (state.loading) return h('div', { className: 'uscr-kline-skeleton' })
        if (state.error) {
          return h(
            'div',
            { className: 'uscr-drawer-error', style: { margin: 0 } },
            h('div', { style: { fontWeight: 700, marginBottom: 6 } }, t('klineFailed')),
            h('div', { className: 'uscr-updated' }, state.error),
            h(
              'button',
              { type: 'button', className: 'uscr-btn', style: { marginTop: 10 }, onClick: () => setNonce((value) => value + 1) },
              t('retry'),
            ),
          )
        }
        if (!state.data?.bars?.length) return h(Empty, { text: t('klineNoData') })
        return h(KlineChart, {
          bars: state.data.bars,
          period,
          preClose: state.data.preClose ?? detail.quote?.prevClose,
          t,
        })
      })()

      return h(
        Section,
        { title: t('chartTitle'), extra },
        h(
          'div',
          { className: 'uscr-periods', role: 'tablist' },
          periods.map(([key, labelKey]) =>
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                key,
                'aria-selected': period === key,
                className: `uscr-period ${period === key ? 'is-active' : ''}`,
                onClick: () => setPeriod(key),
              },
              t(labelKey),
            ),
          ),
        ),
        body,
        state.data?.note
          ? h('div', { className: 'uscr-chart-note' }, `${state.data.sourceLabel} · ${state.data.note}`)
          : null,
      )
    }

    /* ------------------------------------------------------------ */
    /* 详情抽屉                                                      */
    /* ------------------------------------------------------------ */

    const PHASE_KEY = {
      open: 'phase.open',
      pre: 'phase.pre',
      after: 'phase.after',
      closed: 'phase.closed',
      weekend: 'phase.weekend',
    }

    function phaseLabel(phase, t) {
      return t(PHASE_KEY[phase?.phase] ?? 'phase.closed')
    }

    function DetailDrawer(props) {
      const { stack, loading, error, onClose, onBack, onOpen, onRefresh, market, t } = props
      const current = stack[stack.length - 1] ?? null
      const bodyRef = React.useRef(null)

      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      React.useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0
      }, [current?.code])

      const q = current?.quote ?? {}
      const tone = toneOf(q.changePct)
      const topTone = tone

      const stats = current
        ? [
            { label: t('open'), value: fmt(q.open, 3) },
            { label: t('high'), value: fmt(q.high, 3) },
            { label: t('low'), value: fmt(q.low, 3) },
            { label: t('prevClose'), value: fmt(q.prevClose, 3) },
            { label: t('turnover'), value: amount(q.turnover) },
            { label: t('volume'), value: amount(q.volume) },
            { label: t('amplitude'), value: plainPct(q.amplitude) },
            { label: t('turnoverRate'), value: plainPct(q.turnoverRate) },
            { label: t('volumeRatio'), value: fmt(q.volumeRatio, 2) },
          ]
        : []

      const valuation = current
        ? [
            q.marketCap ? { label: t('marketCap'), value: amount(q.marketCap) } : null,
            q.floatMarketCap ? { label: t('floatCap'), value: amount(q.floatMarketCap) } : null,
            q.peTtm ? { label: t('peTtm'), value: fmt(q.peTtm, 2) } : null,
            q.pb ? { label: t('pb'), value: fmt(q.pb, 2) } : null,
            q.epsTtm ? { label: t('eps'), value: fmt(q.epsTtm, 3) } : null,
            q.dividendYield ? { label: t('dividend'), value: plainPct(q.dividendYield) } : null,
            q.high52 ? { label: t('high52'), value: fmt(q.high52, 3) } : null,
            q.low52 ? { label: t('low52'), value: fmt(q.low52, 3) } : null,
            q.bid || q.ask
              ? { label: t('bidAsk'), value: `${fmt(q.bid, 3)} / ${fmt(q.ask, 3)}` }
              : null,
          ].filter(Boolean)
        : []

      const relatedEtfs =
        current?.kind === 'index'
          ? (INDEX_ETFS[current.code] ?? []).map(
              (code) =>
                (market?.etfs ?? []).find((etf) => etf.code === code) ?? {
                  code,
                  name: ETF_FALLBACK_NAMES[code] ?? code,
                  changePct: null,
                },
            )
          : []

      const relatedIndex =
        current?.kind === 'etf' && ETF_INDEX[current.code]
          ? (market?.indices ?? []).find((index) => index.code === ETF_INDEX[current.code])
          : null

      const companiesTitle = current?.kind === 'sector' ? t('constituents') : t('relatedCompanies')
      const companiesExtra = current?.industry
        ? `${current.industry.name} · ${t('companiesTotal').replace('{n}', current.industry.total)}`
        : current?.breadth
          ? t('companiesTotal').replace('{n}', current.breadth.total)
          : ''

      const trustItems = []
      if (current?.kind === 'etf') {
        if (current.trust?.aum || q.marketCap) trustItems.push({ label: t('aum'), value: amount(current.trust?.aum ?? q.marketCap) })
        if (current.trust?.outstandingUnits) trustItems.push({ label: t('units'), value: amount(current.trust.outstandingUnits) })
        if (q.floatShares) trustItems.push({ label: t('shares'), value: amount(q.floatShares) })
      }

      return h(
        'div',
        {
          className: 'uscr-drawer-mask',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose()
          },
        },
        h(
          'aside',
          {
            className: 'uscr-drawer',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': current ? `${current.name} ${t('detail')}` : t('detail'),
          },
          h(
            'div',
            { className: 'uscr-drawer-head' },
            h(
              'div',
              { className: 'uscr-drawer-tools' },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                stack.length > 1
                  ? h(
                      'button',
                      { type: 'button', className: 'uscr-icon-btn', onClick: onBack, title: t('back'), 'aria-label': t('back') },
                      '‹',
                    )
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'uscr-icon-btn',
                    onClick: onRefresh,
                    title: t('refresh'),
                    'aria-label': t('refresh'),
                    disabled: loading,
                  },
                  loading ? h('span', { className: 'uscr-spin' }) : '↻',
                ),
                stack.length > 1
                  ? h('span', { className: 'uscr-updated' }, `${stack.length - 1} / ${t('back')}`)
                  : null,
              ),
              h(
                'button',
                { type: 'button', className: 'uscr-icon-btn', onClick: onClose, title: t('close'), 'aria-label': t('close') },
                '×',
              ),
            ),
            current
              ? h(
                  'div',
                  { className: 'uscr-drawer-title-row' },
                  h(
                    'div',
                    null,
                    h('span', { className: 'uscr-kind' }, t(KIND_KEY[current.kind] ?? 'kind.stock')),
                    h('h2', { className: 'uscr-drawer-name' }, current.name),
                    h(
                      'div',
                      { className: 'uscr-drawer-code' },
                      `${current.code}${current.enName ? ` · ${current.enName}` : ''}`,
                    ),
                  ),
                  h(
                    'div',
                    { className: 'uscr-drawer-price' },
                    h('b', { className: `uscr-${topTone}` }, fmt(q.price, 3)),
                    h(
                      'span',
                      { className: `uscr-${topTone}` },
                      `${signed(q.change, 3)} · ${pct(q.changePct)}`,
                    ),
                  ),
                )
              : h('div', { className: 'uscr-drawer-name' }, t('detail')),
            current
              ? h(
                  'div',
                  { className: 'uscr-breadth-legend', style: { marginTop: 8, marginBottom: 0 } },
                  h('span', null, `${t('status')} ${q.statusText || '--'}`),
                  h('span', null, `${t('lastData')} ${timeText(q.time)}`),
                )
              : null,
          ),
          h(
            'div',
            { className: 'uscr-drawer-body', ref: bodyRef },
            loading && !current
              ? h(
                  'div',
                  { className: 'uscr-drawer-loading' },
                  h('div', { style: { marginBottom: 12 } }, t('refreshingDetail')),
                  h('div', { className: 'uscr-skeleton', style: { width: '72%', margin: '0 auto 8px' } }),
                  h('div', { className: 'uscr-skeleton', style: { width: '48%', margin: '0 auto' } }),
                )
              : null,
            error && !current
              ? h(
                  'div',
                  { className: 'uscr-drawer-error' },
                  h('div', { style: { fontWeight: 700, marginBottom: 6 } }, t('detailFailed')),
                  h('div', { className: 'uscr-updated' }, error),
                  h(
                    'button',
                    { type: 'button', className: 'uscr-btn', style: { marginTop: 12 }, onClick: onRefresh },
                    t('retry'),
                  ),
                )
              : null,
            current
              ? h(
                  React.Fragment,
                  null,
                  h(ChartPanel, { detail: current, t }),
                  current.breadth
                    ? h(
                        Section,
                        { title: t('breadth'), extra: `${current.breadth.total}` },
                        h(
                          'div',
                          { className: 'uscr-breadth-head' },
                          h(
                            'span',
                            null,
                            h('b', { className: 'uscr-up' }, current.breadth.rise),
                            ` ${t('rise')}`,
                            ' · ',
                            h('b', { className: 'uscr-down' }, current.breadth.fall),
                            ` ${t('fall')}`,
                          ),
                          h('span', { className: 'uscr-updated' }, `${current.breadth.flat} ${t('flat')}`),
                        ),
                        h(BreadthBar, {
                          rise: current.breadth.rise,
                          fall: current.breadth.fall,
                          flat: current.breadth.flat,
                        }),
                      )
                    : null,
                  h(Section, { title: t('stats') }, h(StatGrid, { items: stats })),
                  valuation.length
                    ? h(Section, { title: t('quote'), extra: t('stats') }, h(StatGrid, { items: valuation }))
                    : null,
                  trustItems.length
                    ? h(
                        Section,
                        { title: t('etfTrust') },
                        h(
                          'div',
                          { className: 'uscr-trust' },
                          trustItems.map((item) =>
                            h(
                              'div',
                              { className: 'uscr-trust-item', key: item.label },
                              h('span', null, item.label),
                              h('b', null, item.value),
                            ),
                          ),
                        ),
                      )
                    : null,
                  current.plates?.length
                    ? h(
                        Section,
                        { title: t('relatedPlates') },
                        h(
                          'div',
                          { className: 'uscr-chips' },
                          current.plates.map((plate) =>
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'uscr-chip',
                                key: plate.code,
                                onClick: () => onOpen(plate.code, 'sector'),
                                title: plate.desc || plate.enName || plate.name,
                              },
                              plate.name,
                              h('em', { className: `uscr-${toneOf(plate.changePct)}` }, pct(plate.changePct)),
                            ),
                          ),
                        ),
                      )
                    : null,
                  current.companies?.length
                    ? h(
                        Section,
                        { title: companiesTitle, extra: companiesExtra },
                        h(
                          'div',
                          { className: 'uscr-company-list' },
                          current.companies
                            .filter((company) => company.code !== current.code)
                            .slice(0, 15)
                            .map((company) =>
                              h(CompanyRow, { key: company.code, item: company, onOpen }),
                            ),
                        ),
                      )
                    : null,
                  relatedEtfs.length
                    ? h(
                        Section,
                        { title: t('relatedEtfs') },
                        h(
                          'div',
                          { className: 'uscr-chips' },
                          relatedEtfs.map((etf) =>
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'uscr-chip',
                                key: etf.code,
                                onClick: () => onOpen(etf.code, 'etf'),
                              },
                              `${etf.name}（${etf.code}）`,
                              toNum(etf.changePct) === null
                                ? null
                                : h('em', { className: `uscr-${toneOf(etf.changePct)}` }, pct(etf.changePct)),
                            ),
                          ),
                        ),
                      )
                    : null,
                  relatedIndex
                    ? h(
                        Section,
                        { title: t('relatedIndices') },
                        h(
                          'div',
                          { className: 'uscr-chips' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'uscr-chip',
                              onClick: () => onOpen(relatedIndex.code, 'index'),
                            },
                            relatedIndex.name,
                            h('em', { className: `uscr-${toneOf(relatedIndex.changePct)}` }, pct(relatedIndex.changePct)),
                          ),
                        ),
                      )
                    : null,
                  current.news?.length
                    ? h(
                        Section,
                        { title: t('news'), extra: `${current.news.length}` },
                        h(
                          'div',
                          { className: 'uscr-news' },
                          current.news.map((item) =>
                            h(
                              'a',
                              {
                                className: 'uscr-news-item',
                                key: item.id,
                                href: item.url || undefined,
                                target: '_blank',
                                rel: 'noreferrer noopener',
                              },
                              h(
                                'span',
                                { className: 'uscr-news-title' },
                                item.important ? h('span', { className: 'uscr-news-important' }, '● ') : null,
                                item.title,
                              ),
                              item.abstract ? h('span', { className: 'uscr-news-abstract' }, item.abstract) : null,
                              h(
                                'span',
                                { className: 'uscr-news-meta' },
                                h('span', null, item.source || '富途'),
                                h('span', null, `${dayText(item.time)} ${shortTime(item.time)}`),
                              ),
                            ),
                          ),
                        ),
                      )
                    : h(Section, { title: t('news') }, h(Empty, { text: t('noNews') })),
                  current.finance?.length
                    ? h(
                        Section,
                        { title: t('finance') },
                        h(
                          'div',
                          { className: 'uscr-chips' },
                          current.finance.map((item) => h('span', { className: 'uscr-chip', key: item.chartId }, item.name)),
                        ),
                      )
                    : null,
                  h(
                    'div',
                    { className: 'uscr-footer', style: { marginTop: 18 } },
                    h('span', null, t('source')),
                    h('span', null, t('disclaimer')),
                  ),
                )
              : null,
          ),
        ),
      )
    }

    /* ------------------------------------------------------------ */
    /* 主面板                                                        */
    /* ------------------------------------------------------------ */

    function Page() {
      const t = useT()
      const [view, setView] = React.useState({ phase: 'loading', data: null, error: '' })
      const [tab, setTab] = React.useState('sectors')
      const [busy, setBusy] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [toast, setToast] = React.useState('')
      const [stack, setStack] = React.useState([])
      const [drawerOpen, setDrawerOpen] = React.useState(false)
      const [detailLoading, setDetailLoading] = React.useState(false)
      const [detailError, setDetailError] = React.useState('')
      const alive = React.useRef(true)
      const detailReq = React.useRef(0)

      const load = React.useCallback(
        async (force) => {
          if (force) setBusy(true)
          try {
            const url = new URL(API, document.baseURI)
            if (force) url.searchParams.set('refresh', '1')
            const response = await fetch(url.href, { cache: 'no-store', headers: { Accept: 'application/json' } })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const json = await response.json()
            if (!alive.current) return
            if (json?.ok || (Array.isArray(json?.indices) && json.indices.length)) {
              setView({
                phase: 'ready',
                data: json,
                error: json?.stale ? json?.errors?.[0]?.message ?? '' : '',
              })
            } else if (json?.snapshot?.indices?.length) {
              setView({ phase: 'ready', data: json.snapshot, error: json?.error ?? '' })
            } else {
              setView((previous) =>
                previous.data
                  ? { ...previous, error: json?.error ?? t('loadFailed') }
                  : { phase: 'error', data: null, error: json?.error ?? t('loadFailed') },
              )
            }
          } catch (error) {
            if (!alive.current) return
            const message = String(error?.message ?? error)
            setView((previous) =>
              previous.data
                ? { ...previous, error: message }
                : { phase: 'error', data: null, error: message },
            )
          } finally {
            if (alive.current) setBusy(false)
          }
        },
        [t],
      )

      React.useEffect(() => {
        alive.current = true
        load(false)
        const timer = setInterval(() => {
          if (document.visibilityState !== 'hidden') load(false)
        }, REFRESH_MS)
        return () => {
          alive.current = false
          clearInterval(timer)
        }
      }, [load])

      React.useEffect(() => {
        if (!toast) return undefined
        const timer = setTimeout(() => setToast(''), 2800)
        return () => clearTimeout(timer)
      }, [toast])

      const openDetail = React.useCallback(
        async (code, kind, mode = 'push') => {
          const clean = String(code ?? '').trim()
          if (!clean) return
          setDrawerOpen(true)
          setDetailLoading(true)
          setDetailError('')
          const requestId = ++detailReq.current
          try {
            const response = await fetch(`${DETAIL}?code=${encodeURIComponent(clean)}`, {
              cache: 'no-store',
              headers: { Accept: 'application/json' },
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const json = await response.json()
            if (!alive.current || requestId !== detailReq.current) return
            if (!json?.ok) throw new Error(json?.error ?? t('detailFailed'))
            setStack((previous) => {
              if (mode === 'replace') return [...previous.slice(0, -1), json]
              if (mode === 'reset') return [json]
              return [...previous, json]
            })
          } catch (error) {
            if (!alive.current || requestId !== detailReq.current) return
            const message = String(error?.message ?? error)
            setDetailError(message)
            setToast(message)
          } finally {
            if (alive.current && requestId === detailReq.current) setDetailLoading(false)
          }
        },
        [t],
      )

      const closeDetail = React.useCallback(() => {
        detailReq.current += 1
        setDrawerOpen(false)
        setStack([])
        setDetailError('')
        setDetailLoading(false)
      }, [])

      const backDetail = React.useCallback(() => {
        setStack((previous) => {
          const next = previous.slice(0, -1)
          if (!next.length) {
            setDrawerOpen(false)
            setDetailError('')
          }
          return next
        })
      }, [])

      const refreshDetail = React.useCallback(() => {
        const current = stack[stack.length - 1]
        if (current) openDetail(current.code, current.kind, 'replace')
      }, [openDetail, stack])

      const submitSearch = (event) => {
        event.preventDefault()
        const raw = query.trim()
        if (!raw) return
        const needle = raw.toUpperCase()
        const data = view.data
        const pool = [
          ...(data?.indices ?? []),
          ...(data?.sectors ?? []),
          ...(data?.stocks ?? []),
          ...(data?.etfs ?? []),
        ]
        const hit = pool.find(
          (item) => String(item.code).toUpperCase() === needle || String(item.name).includes(raw),
        )
        setQuery('')
        if (hit) openDetail(hit.code, hit.kind, 'reset')
        else openDetail(needle, 'stock', 'reset')
      }

      const data = view.data
      const phase = data?.phase ?? null
      const tabs = [
        { key: 'sectors', label: t('tab.sectors'), count: data?.sectors?.length ?? 0 },
        {
          key: 'stocks',
          label: t('tab.stocks'),
          count: (data?.stocks ?? []).filter((row) => row.instrumentType === 3).length,
        },
        { key: 'etfs', label: t('tab.etfs'), count: data?.etfs?.length ?? 0 },
      ]

      const content = (() => {
        if (view.phase === 'loading' && !data) {
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'uscr-loading-grid' },
              [0, 1, 2, 3].map((index) => h('div', { className: 'uscr-skeleton-card', key: index })),
            ),
            h('div', { className: 'uscr-hint', style: { marginTop: 18 } }, t('loading')),
          )
        }
        if (view.phase === 'error' && !data) {
          return h(
            'div',
            { className: 'uscr-card', style: { padding: '42px 22px', textAlign: 'center' } },
            h('div', { style: { fontSize: 15, fontWeight: 700, marginBottom: 8 } }, t('loadFailed')),
            h('div', { className: 'uscr-updated' }, view.error),
            h(
              'button',
              {
                type: 'button',
                className: 'uscr-btn uscr-btn-primary',
                style: { marginTop: 16 },
                onClick: () => load(true),
                disabled: busy,
              },
              busy ? h('span', { className: 'uscr-spin' }) : null,
              t('retry'),
            ),
          )
        }
        if (!data) return null
        if (tab === 'sectors') {
          const sectors = data.sectors ?? []
          return h(
            React.Fragment,
            null,
            h('div', { className: 'uscr-hint' }, t('sectorHint')),
            sectors.length
              ? h(
                  'div',
                  { className: 'uscr-grid' },
                  sectors.map((sector) =>
                    h(SectorCard, { key: sector.code, item: sector, onOpen: openDetail, t }),
                  ),
                )
              : h(Empty, { text: t('noSector') }),
          )
        }
        if (tab === 'stocks') {
          const rows = (data.stocks ?? []).filter((row) => row.instrumentType === 3)
          return h(
            React.Fragment,
            null,
            h('div', { className: 'uscr-hint' }, t('stockHint')),
            h(StockTable, { rows, onOpen: openDetail, t }),
          )
        }
        return h(
          React.Fragment,
          null,
          h('div', { className: 'uscr-hint' }, t('etfHint')),
          h(EtfTable, { rows: data.etfs ?? [], onOpen: openDetail, t }),
        )
      })()

      return h(
        'div',
        { className: 'uscr-root' },
        h('style', null, STYLES),
        h(
          'div',
          { className: 'uscr-shell' },
          h(
            'header',
            { className: 'uscr-head' },
            h(
              'div',
              { className: 'uscr-brand' },
              h('div', { className: 'uscr-logo' }, h(ReportIcon, { size: 26 })),
              h(
                'div',
                null,
                h('div', { className: 'uscr-eyebrow' }, t('closeReport')),
                h('h1', { className: 'uscr-title' }, t('title')),
                h('div', { className: 'uscr-sub' }, t('subtitle')),
              ),
            ),
            h(
              'div',
              { className: 'uscr-head-right' },
              h(
                'span',
                { className: `uscr-status ${data?.live ? 'is-live' : ''}` },
                h('span', { className: 'uscr-dot' }),
                phase ? phaseLabel(phase, t) : '--',
              ),
              h(
                'span',
                { className: 'uscr-updated' },
                data?.generatedAt ? `${t('updated')} ${timeText(Date.parse(data.generatedAt))}` : '--',
              ),
              h(
                'form',
                { className: 'uscr-search', onSubmit: submitSearch },
                h('input', {
                  value: query,
                  onChange: (event) => setQuery(event.target.value),
                  placeholder: t('searchPlaceholder'),
                  'aria-label': t('searchPlaceholder'),
                  spellCheck: false,
                }),
                h('button', { type: 'submit' }, t('search')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'uscr-btn uscr-btn-primary',
                  onClick: () => load(true),
                  disabled: busy,
                  title: t('autoRefresh'),
                },
                busy ? h('span', { className: 'uscr-spin' }) : null,
                busy ? t('refreshing') : t('refresh'),
              ),
            ),
          ),
          view.error && data
            ? h('div', { className: 'uscr-banner' }, `${t('stale')}：${view.error}`)
            : null,
          h(
            'div',
            { className: 'uscr-hero' },
            data
              ? h(
                  React.Fragment,
                  null,
                  (data.indices ?? []).map((index) =>
                    h(IndexCard, { key: index.code, item: index, onOpen: openDetail, t }),
                  ),
                  h(BriefCard, { data, t }),
                )
              : [0, 1, 2, 3].map((index) => h('div', { className: 'uscr-skeleton-card', key: index })),
          ),
          h(
            'div',
            { className: 'uscr-tabs', role: 'tablist' },
            tabs.map((item) =>
              h(
                'button',
                {
                  type: 'button',
                  role: 'tab',
                  key: item.key,
                  'aria-selected': tab === item.key,
                  className: `uscr-tab ${tab === item.key ? 'is-active' : ''}`,
                  onClick: () => setTab(item.key),
                },
                item.label,
                h('span', { className: 'uscr-tab-count' }, item.count),
              ),
            ),
          ),
          content,
          h(
            'footer',
            { className: 'uscr-footer' },
            h('span', null, t('source')),
            h('span', null, `${t('autoRefresh')} · ${t('disclaimer')}`),
          ),
        ),
        drawerOpen
          ? h(DetailDrawer, {
              stack,
              loading: detailLoading,
              error: detailError,
              onClose: closeDetail,
              onBack: backDetail,
              onOpen: openDetail,
              onRefresh: refreshDetail,
              market: data,
              t,
            })
          : null,
        toast ? h('div', { className: 'uscr-toast' }, toast) : null,
      )
    }

    /* ------------------------------------------------------------ */
    /* 图标与注册                                                    */
    /* ------------------------------------------------------------ */

    function ReportIcon(props) {
      const size = Number(props?.size) || 20
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block', opacity: props?.active === false ? 0.8 : 1 },
        },
        h('path', { d: 'M4 20V4' }),
        h('path', { d: 'M4 20h16' }),
        h('path', { d: 'M7 16v-4' }),
        h('path', { d: 'M11 16V7' }),
        h('path', { d: 'M15 16v-6' }),
        h('path', { d: 'M19 16V5' }),
        h('path', { d: 'm7 9 4-3 4 1 5-4' }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        localeService = ctx.locale ?? null
        try {
          const disposers = [
            ctx.locale.register(NS, 'zh', DICT.zh),
            ctx.locale.register(NS, 'en', DICT.en),
          ]
          ctx.effect(() => () => {
            for (const dispose of disposers) {
              try {
                dispose()
              } catch {
                /* 卸载期忽略 */
              }
            }
          })
          translate = ctx.locale.bind(NS)
        } catch (error) {
          console.warn('[us-close-report] locale registration failed:', error)
          translate = (key) => DICT.zh[key] ?? key
        }

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'us-close-report' }, Page),
        )

        // Shown in the Workbench app grid (auto-classified by type); the panel
        // itself stays a normal `main` entry opened from there.
        ctx.slots.inject('workbench.apps', () =>
          ctx.slots.register(
            { name: 'workbench.apps', id: 'us-close-report', order: 40, label: () => translate('panel') },
            ReportIcon,
          ),
        )
      },
    }
  },
})

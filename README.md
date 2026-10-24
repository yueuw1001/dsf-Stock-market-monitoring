# 美国收盘报（dsh-us-close-report）

DSH 插件：用**富途牛牛（futunn.com）** 的美股行情页面，在 Web 界面提供一个实时更新的
「美国收盘报」看板，并在侧边栏提供入口。盘中每 30 秒刷新指数与个股，板块 / ETF 每 5 分钟
刷新；收盘后保留最近一次快照，随时可以复盘。详情抽屉内置 **GenUI 分时图**与可拖拽、
可缩放的 **K 线图**（5 分钟 / 日 / 周 / 月 / 季 / 年）。

## 界面与交互

1. **总览**
   - 三大指数卡片：道琼斯（.DJI）、纳斯达克（.IXIC）、标普 500（.SPX），显示当前点位、
     涨跌额、涨跌幅、当日区间（低—高，含昨收参考线）。
   - 收盘速览：市场状态、上涨 / 下跌板块数、上涨 / 下跌 ETF 数、领涨板块、领涨个股。
2. **板块**：涨幅居前的美股行业板块（约 145 个行业中的前 30 个），显示涨跌幅、
   上涨 / 下跌 / 平盘家数与领涨股。
3. **个股**：美股涨幅榜（仅普通股，已剔除杠杆 ETF），显示最新价、涨跌幅、成交额、
   总市值、5 日 / 20 日涨跌。
4. **ETF**：涨幅居前的美股 ETF，显示最新价、涨跌幅、成交额、基金规模、5 日 / 20 日涨跌。
5. **详情抽屉**：点击任意指数、板块、个股或 ETF 打开右侧抽屉。
   - **走势图**：周期切换 `分时 / 5分 / 日K / 周K / 月K / 季K / 年K`。
     - 分时：通过 **dsh-genui** 的自定义元素渲染折线图（`TinyHuichartsLine`），
       支持图例、悬浮提示与滚轮缩放；GenUI 不可用时自动回退到插件内置分时图。
     - 5 分钟与日 / 周 / 月 / 季 / 年 K：原生蜡烛图，**拖动平移、滚轮/按钮缩放、
       点击蜡烛查看开高低收、涨跌幅、成交量与成交额**。
     - K 线数据优先尝试富途 `get-kline`；富途风控拦截时自动回退东方财富美股 K 线，
       图表右上角会标注实际数据源。
   - 行情与估值：今开 / 最高 / 最低 / 昨收 / 成交量 / 成交额 / 振幅 / 换手率 / 量比、
     总市值 / 流通市值、PE / PB / EPS / 股息率、52 周区间、买一 / 卖一。
   - 板块详情：成分股涨跌家数与涨跌分布条。
   - **行业关联板块**：可继续点击进入对应板块。
   - **行业关联公司**：个股显示其所属行业板块的成分股；板块显示全部成分股。
     点击任意公司即可打开该公司的完整资料（行情、估值、分时、资讯、行业关联公司）。
   - 指数详情：展示成分股涨跌家数，并给出关联 ETF（DIA / QQQ / SPY 等）入口。
   - ETF 详情：展示基金规模、份额等基金资料，并可跳转跟踪指数。
   - 相关资讯：富途资讯列表，点击在新窗口打开原文。
6. **搜索**：顶部输入代码或名称（如 `NVDA`、`QQQ`、`BK2492`、`.DJI`）直接打开详情。

## 数据来源与刷新

- 看板、分时与详情数据全部来自富途牛牛官网公开行情页面：
  - `/quote/us/market`：指数、涨幅榜、市场状态。
  - `/quote/us/sector-industry`：美股行业板块。
  - `/quote/etf-us`：美股 ETF 列表。
  - `/quote/stock?m=us&code=<代码>`：个股 / ETF / 板块 / 指数详情，含成分股、分时、资讯。
- 富途对部分请求会下发 WAF 挑战页。插件在受限的 `node:vm` 沙箱里执行挑战脚本，取出
  `wafToken` cookie 后自动重试，无需人工干预。
- **K 线数据源**：优先调用富途 `quote-api/quote-v2/get-kline`（签名 + 系统 curl）；富途对
  匿名 K 线接口风控较严，连续失败两次后会暂停尝试 30 分钟，并回退到东方财富美股 K 线接口
  （`push2his.eastmoney.com`）。5 分钟线富途网页不提供，直接使用东方财富。接口返回的
  `source` / `sourceLabel` 会在图表上方标注实际来源。
- 纳斯达克综合指数（`.IXIC`）没有直接的东方财富 K 线代码，回退时使用纳斯达克 100
  （`NDX`）代替，并在图表下方注明。
- 刷新节奏：盘中指数与个股每 `pulseSeconds`（默认 30 秒）刷新；板块与 ETF 每
  `listRefreshMinutes`（默认 5 分钟）刷新；详情缓存 `detailTtlSeconds`（默认 45 秒）。
  非交易时段自动降频到 10 分钟，收盘后仍保留最近快照。
- 上游失败时按退避重试，并继续展示最近一次快照（页面顶部提示「缓存数据」）。
- 快照持久化在 `dataDir`（默认 `~/.dsh-us-close-report/snapshot.json`），DSH 重启后先展示
  上次快照，再后台刷新。

## 配置

在 `cordis.patch.yml` 的入口 `config` 中覆盖：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `autoUpdate` | `true` | 是否启用后台定时刷新 |
| `pulseSeconds` | `30` | 盘中指数 / 个股刷新间隔（秒），10–300 |
| `listRefreshMinutes` | `5` | 板块 / ETF 刷新间隔（分钟），1–60 |
| `detailTtlSeconds` | `45` | 详情缓存时间（秒），15–600 |
| `maxStocks` | `50` | 个股榜条数 |
| `maxSectors` | `30` | 板块条数 |
| `maxEtfs` | `50` | ETF 条数 |
| `dataDir` | 空 | 快照目录，空表示 `~/.dsh-us-close-report` |

## Agent 工具

`us_close_report`：

- `section`：`summary`（默认）/ `indices` / `sectors` / `stocks` / `etfs` / `detail`
- `code`：`section=detail` 时必填，支持个股、ETF、板块（`BKxxxx`）与指数（`.DJI`）
- `limit`：榜单行数 1–50，默认 10
- `refresh`：是否强制刷新，默认 `false`

## 接口

- `GET /dsh-usclose/api.json`：看板快照；`?refresh=1` 强制刷新。
- `GET /dsh-usclose/detail.json?code=NVDA`：标的详情。
- `GET /dsh-usclose/company.json?code=NVDA`：公司全部资料（详情接口的个股语义别名）。
- `GET /dsh-usclose/kline.json?code=NVDA&period=day`：K 线；`period` 支持
  `5m` / `day` / `week` / `month` / `quarter` / `year`，返回 `source`、`bars`、
  `preClose` 与来源说明。

## 结构

```
index.js           快照调度、详情缓存、HTTP 接口、Agent 工具
lib/futu.js        富途页面抓取、WAF 处理、__INITIAL_STATE__ 解析与归一化
lib/kline.js       K 线抓取：富途 get-kline 优先，东方财富回退，季/年聚合
client.js          Web 主面板与侧边栏入口、详情抽屉、GenUI 分时、可交互蜡烛图
locale/*.json      插件管理页展示的标题与描述
icon.svg           插件图标
cordis.patch.yml   Bundle 补丁与默认配置
```

## 说明

- 分时图通过 `dsh-genui` 暴露的 `<dsh-genui-card>` 自定义元素渲染；若当前 profile 没有启用
  `dsh-genui`、运行时加载失败或 4 秒内没有渲染出图表，会自动切换为插件内置的分时图。
- K 线接口在富途风控拦截时回退东方财富，图表上方会标注「富途牛牛」或「东方财富」，
  不会把备用源伪装成富途数据。
- 行情与资讯仅用于展示和复盘，不构成投资建议。
- 富途页面结构可能调整；若上游改版，`lib/futu.js` / `lib/kline.js` 的解析字段需要同步更新。
- 板块页首屏只返回涨幅前 30 个行业（共约 145 个）；看板按这 30 个展示，详情不受影响。

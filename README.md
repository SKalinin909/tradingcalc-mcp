# TradingCalc MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp/skalinin909-tradingcalc-mcp)](https://lobehub.com/mcp/skalinin909-tradingcalc-mcp)

**Deterministic crypto futures calculations for AI agents and developer integrations.**

13 tools across 3 suites + 1 composite intent: 12 primitive calculators (pnl, liquidation, breakeven, target exit, position sizing, average entry, scenario, max leverage, hedge ratio, funding cost, funding arb, compound funding) + `pre_trade_check` composite workflow.

Two access surfaces: **MCP** (Claude Desktop / Cursor / VS Code) and **REST API** (`/v1/primitives`, `/v1/workflows`).

> Not estimates — exact numbers your trading bot can trust.

## Endpoints

| Surface | URL | Auth |
|---|---|---|
| MCP | `https://tradingcalc.io/api/mcp` | Bearer optional |
| REST primitives | `https://tradingcalc.io/v1/primitives/:id` | Bearer required |
| REST workflows | `https://tradingcalc.io/v1/workflows/:id` | Bearer required |
| Discovery | `https://tradingcalc.io/v1/primitives` | None |
| Docs | `https://tradingcalc.io/docs` | None |

MCP transport: **Streamable HTTP** (MCP spec 2024-11-05)

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tradingcalc": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://tradingcalc.io/api/mcp"]
    }
  }
}
```

### Cursor / VS Code

```json
{
  "tradingcalc": {
    "url": "https://tradingcalc.io/api/mcp"
  }
}
```

### Direct HTTP

```bash
curl -X POST https://tradingcalc.io/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "liquidation",
      "arguments": {
        "side": "long",
        "entryPrice": 95000,
        "leverage": 10,
        "marginType": "isolated"
      }
    }
  }'
```

## Tools (13)

### Primitives — 1 credit each (via MCP or `POST /v1/primitives/:id`)

**Trade Planning**
| Tool | Description |
|---|---|
| `pnl` | Net PnL, ROE, fees and gross profit/loss for a futures trade |
| `breakeven` | Break-even price accounting for entry/exit fees |
| `target_exit` | Exit price required to hit a target PnL or ROE |
| `risk_sizer` | Position size based on account size and max risk % |
| `average_entry` | Average entry price after adding to a position (DCA) |
| `scenario` | Multi-scenario P&L analysis across price targets |

**Risk & Margin**
| Tool | Description |
|---|---|
| `liquidation` | Liquidation price for long/short with cross or isolated margin |
| `max_leverage` | Maximum safe leverage based on drawdown tolerance and asset volatility |
| `hedge_ratio` | Short perp size, required margin, and funding cost to hedge a spot position |

**Funding & Carry**
| Tool | Description |
|---|---|
| `funding_cost` | Cumulative funding cost over a holding period |
| `funding_arb` | Annualized yield and net profit from long/short basis trades across two exchanges |
| `compound_funding` | Capital growth projection from reinvesting perpetual futures funding income |

### Composite Workflow — 10 credits (via MCP or `POST /v1/workflows/pre-trade-check`)

| Tool | Description |
|---|---|
| `pre_trade_check` | Full pre-trade decision: position size, liquidation price, breakeven, funding cost, go/no-go signal. Accepts live exchange + symbol to fetch funding rate automatically. |

Formulas normalized across 7 exchanges: **Binance, Bybit, OKX, Hyperliquid, Aster, KuCoin, MEXC**.

## Rate Limits & Pricing

| Plan | Limit | Credits/mo | Price |
|---|---|---|---|
| Anonymous | 20 req/day | — | Free |
| Free API key | 200 req/day | — | Free |
| Trader | 10,000 req/day | 250 | $19/mo |
| Builder | 10,000 req/day | 5,000 | $79/mo |

Credits: primitive = 1 cr · standard workflow = 5 cr · pre-trade-check = 10 cr

Get your API key → email [hi@tradingcalc.io](mailto:hi@tradingcalc.io) or see [tradingcalc.io/pricing](https://tradingcalc.io/pricing)

Pass key as: `Authorization: Bearer <your-api-key>`

## Use Cases

- **Trading bots** — check liquidation price before every trade
- **AI agents** — deterministic risk calculations without hallucination risk
- **Multi-agent systems** — drop-in risk management agent in analyst + risk + execution pipelines
- **Dashboards** — embed calculations programmatically

## Why deterministic?

LLMs asked directly give plausible but potentially wrong numbers. TradingCalc MCP returns exact calculations — same inputs always produce the same outputs. No hallucination risk for financial data.

## Links

- API docs: [tradingcalc.io/docs](https://tradingcalc.io/docs)
- Pricing: [tradingcalc.io/pricing](https://tradingcalc.io/pricing)
- Verification proof: [tradingcalc.io/verify](https://tradingcalc.io/verify)
- Web calculators: [tradingcalc.io](https://tradingcalc.io)
- Telegram Mini App: [@perpcalcbot](https://t.me/perpcalcbot)

# TradingCalc MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp/skalinin909-tradingcalc-mcp)](https://lobehub.com/mcp/skalinin909-tradingcalc-mcp)

**Deterministic crypto futures calculations for AI agents.**

12 calculators for perpetual futures trading: PnL, liquidation price, break-even, target exit, position sizing, funding cost, average entry, scenario analysis, max safe leverage, funding rate arbitrage, hedge ratio, and compound funding.

> Not estimates — exact numbers your trading bot can trust.

## MCP Endpoint

```
https://tradingcalc.io/api/mcp
```

Transport: **Streamable HTTP** (MCP spec 2024-11-05)

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

## Tools

| Tool | Description |
|---|---|
| `pnl` | Net PnL, ROE, fees and gross profit/loss for a futures trade |
| `liquidation` | Liquidation price for long/short with cross or isolated margin |
| `breakeven` | Break-even price accounting for entry/exit fees |
| `target_exit` | Exit price required to hit a target PnL or ROE |
| `risk_sizer` | Position size based on account size and max risk % |
| `funding_cost` | Cumulative funding cost over a holding period |
| `average_entry` | Average entry price after adding to a position (DCA) |
| `scenario` | Multi-scenario P&L analysis across price targets |
| `max_leverage` | Maximum safe leverage based on drawdown tolerance and asset volatility |
| `funding_arb` | Annualized yield and net profit from long/short basis trades across two exchanges |
| `hedge_ratio` | Short perp size, required margin, and funding cost to hedge a spot position |
| `compound_funding` | Capital growth projection from reinvesting perpetual futures funding income |

Formulas normalized across 7 exchanges: **Binance, Bybit, OKX, Hyperliquid, Aster, KuCoin, MEXC**.

## Rate Limits

| Plan | Limit | Price |
|---|---|---|
| Anonymous | 20 req/day | Free |
| Free API key | 200 req/day | Free |
| Developer | 10,000 req/day | $19/mo |

Get your API key: [tradingcalc.io](https://tradingcalc.io)

Pass key as: `Authorization: Bearer <your-api-key>`

## Use Cases

- **Trading bots** — check liquidation price before every trade
- **AI agents** — deterministic risk calculations without hallucination risk
- **Multi-agent systems** — drop-in risk management agent in analyst + risk + execution pipelines
- **Dashboards** — embed calculations programmatically

## Why deterministic?

LLMs asked directly give plausible but potentially wrong numbers. TradingCalc MCP returns exact calculations — same inputs always produce the same outputs. No hallucination risk for financial data.

## Links

- Web app: [tradingcalc.io](https://tradingcalc.io)
- Telegram Mini App: [@perpcalcbot](https://t.me/perpcalcbot)

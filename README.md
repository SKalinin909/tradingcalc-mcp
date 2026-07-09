# TradingCalc MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp/skalinin909-tradingcalc-mcp)](https://lobehub.com/mcp/skalinin909-tradingcalc-mcp)

Ask Claude or Cursor trade questions and get exact numbers back — not AI guesses.

> "What's my PnL if I buy 0.5 BTC at $80k and sell at $95k with 5x leverage?"
> "Size my position: $10k account, 1% risk, long BTC at $83k, stop at $81k."
> "Is this carry trade worth it? 0.01% funding long, 0.05% short, $50k, 30 days."

23 deterministic tools across trade planning, risk & margin, funding/carry, and market-structure (Market Profile) analysis. Formulas verified against 22 canonical test vectors — same inputs always produce the same outputs. Free, no signup.

Access via **MCP** (Claude Desktop / Cursor / VS Code) or a plain HTTP POST to the MCP endpoint. Free, no signup.

## Endpoints

| Surface | URL | Auth |
|---|---|---|
| MCP | `https://tradingcalc.io/api/mcp` | Bearer optional (free) |
| For agents / setup | `https://tradingcalc.io/for-agents` | None |
| Verification proof | `https://tradingcalc.io/verify` | None |

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
      "name": "workflow.run_liquidation_safety",
      "arguments": {
        "side": "long",
        "entryPrice": 95000,
        "leverage": 10
      }
    }
  }'
```

## Example prompts

After connecting, just ask naturally — the AI picks the right tool automatically:

**Trade P&L**
> "I bought 0.5 BTC at $80,000 and want to sell at $95,000 with 5x leverage. What's my net profit after fees?"

**Position sizing**
> "I have a $10,000 account and want to risk 1% going long BTC at $83,000 with a stop at $81,000. How many coins should I buy?"

**Liquidation check**
> "Long ETH at $3,200 with 10x leverage — where do I get liquidated?"

**Full pre-trade check**
> "Analyze this setup: long BTC at $83,000, stop $81,000, target $90,000, $10k account, 1% risk, 5x leverage. Is it worth taking?"

**Funding cost**
> "I'm holding 0.5 BTC long on Bybit at $83,000 with 0.01% funding rate. How much will funding cost me over 3 days?"

**Carry trade**
> "Is this carry trade worth it? Long on Bybit at 0.01% funding, short on Binance at 0.05%, $50k notional, 30 days."

**DCA average entry**
> "I bought BTC at $78k (0.2 BTC), $80k (0.3 BTC), and $82k (0.1 BTC). What's my average entry and breakeven?"

**Scale-out plan**
> "I'm long 1 BTC from $80k. I want to close 30% at $88k, 40% at $92k, 30% at $96k. What's my total P&L?"

---

## Tools (23)

Tool naming follows the `workflow.run_*` / `primitive.*` / `system.*` namespace convention.
Old flat names (`pnl`, `liquidation`, etc.) are accepted for backward compatibility. All tools are
free via MCP — no signup; 20 calls/day anonymously, 200/day with a free API key.

### Trade Planning

| Tool | Description |
|---|---|
| `workflow.run_pnl_planning` | Net PnL, fees and gross profit/loss for a futures trade |
| `workflow.run_breakeven_planning` | Break-even price accounting for entry/exit fees |
| `workflow.run_exit_target` | Exit price required to hit a target PnL or ROE |
| `workflow.run_scenario_planning` | Multi-scenario P&L analysis across price targets |
| `workflow.run_dca_entry` | DCA across N price levels → avg entry, breakeven, level contribution |
| `workflow.run_scale_out` | Partial exits at multiple levels → P&L per exit, weighted avg, overall ROI |

### Risk & Margin

| Tool | Description |
|---|---|
| `workflow.run_liquidation_safety` | Liquidation price for long/short isolated margin |
| `workflow.run_position_sizing` | Position size based on account size and max risk % |
| `workflow.run_max_leverage` | Maximum safe leverage based on drawdown tolerance and volatility |
| `workflow.run_risk_reward` | Full R:R analysis: sizing + liquidation + breakeven + P&L at stop and target |

### Funding & Carry

| Tool | Description |
|---|---|
| `workflow.run_funding_cost` | Cumulative funding cost over a holding period |
| `workflow.run_funding_arbitrage` | Annualized yield from long/short basis trades across two exchanges |
| `workflow.run_compound_funding` | Capital growth projection from reinvesting funding income |
| `workflow.run_funding_breakeven` | Price move needed to cover funding cost + fees over holding period |
| `workflow.run_carry_trade` | Delta-neutral carry setup: net yield, ROI, breakeven days, verdict |

### Market Structure (Market Profile)

| Tool | Description |
|---|---|
| `workflow.run_open_analysis` | Open location + type (OD/OTD/ORR/OAIR), VAH/VAL/VPOC/IB, scenario framing |
| `workflow.run_session_structure` | Day-type classifier — trend / balance / neutral_trend / normal / normal_var |
| `workflow.run_value_migration` | Value-area migration across sessions — directional conviction vs balance |
| `workflow.run_breakout_acceptance` | Breakout acceptance vs rejection beyond the value area (optional delta) |

### Primitives

| Tool | Description |
|---|---|
| `primitive.average_entry` | Average entry price after DCA into a position |
| `primitive.hedge_ratio` | Short perp size and funding cost to hedge a spot position |

### Integrated Decision

| Tool | Description |
|---|---|
| `workflow.run_pre_trade_check` | Full pre-trade decision: position size, liquidation, breakeven, funding cost, go/no-go signal. Accepts live exchange + symbol. |

### System

| Tool | Description |
|---|---|
| `system.verify` | Run 22 canonical test vectors against all calculators. Returns pass/fail report. |

Formulas normalized across 7 exchanges: **Binance, Bybit, OKX, Hyperliquid, Aster, KuCoin, MEXC**.

## Rate Limits

| Access | Req/day | Price |
|---|---|---|
| Anonymous | 20 | Free |
| Free API key | 200 | Free |

The Service is free. Need a higher-limit key → email [hi@tradingcalc.io](mailto:hi@tradingcalc.io).

Pass key as: `Authorization: Bearer <your-api-key>`

## Self-Verification

Agents can verify all 22 canonical test vectors before trusting results:

```json
{
  "jsonrpc": "2.0", "id": 1,
  "method": "tools/call",
  "params": { "name": "system.verify", "arguments": {} }
}
```

Response: `{ "status": "pass", "passed": 22, "failed": 0, "total": 22 }`

Live proof: [tradingcalc.io/verify](https://tradingcalc.io/verify)

## Use Cases

- **Trading bots** — check liquidation price before every trade
- **AI agents** — deterministic risk calculations without hallucination risk
- **Multi-agent systems** — drop-in risk management agent in analyst + risk + execution pipelines
- **Dashboards** — embed calculations programmatically

## Why deterministic?

LLMs asked directly give plausible but potentially wrong numbers. TradingCalc MCP returns exact calculations — same inputs always produce the same outputs. No hallucination risk for financial data.

## Risk Agent Wrapper

`examples/risk-agent-wrapper.ts` — a drop-in TypeScript wrapper for risk-gated trade execution.
Integrates with any agent framework (ElizaOS, CrewAI, AutoGen, Hummingbot, Freqtrade).

```typescript
import { RiskAgent, preTradeGate } from './examples/risk-agent-wrapper';

const agent = new RiskAgent({ apiKey: 'tc_your_key', minLiqDistancePct: 3.0 });

const result = await agent.evaluate({
  symbol: 'BTCUSDT', exchange: 'bybit',
  side: 'long', entry_price: 83000, stop_loss: 81000,
  account_balance: 10000, risk_pct: 1, leverage: 5,
  funding_rate: 0.0001, hold_hours: 24,
});

if (result.approved) {
  // execute trade — result.recommended_size, result.liquidation_price
} else {
  console.log('Rejected:', result.rejection_reason);
}

// Binary gate for execution bots
const ok = await agent.isSafe({ symbol: 'ETHUSDT', side: 'short', ... });

// Standalone function (minimal integration)
const { approved, size, liqPrice } = await preTradeGate({ ... }, 'tc_your_key');
```

## TypeScript SDK

For code-first integrations, use `tradingcalc-sdk` instead of raw JSON-RPC:

```bash
npm install tradingcalc-sdk
```

```typescript
import { TradingCalcClient } from 'tradingcalc-sdk';

const tc = new TradingCalcClient({ apiKey: 'tc_your_key' });

// Workflows — orchestrated decisions
const check = await tc.workflows.preTradeCheck({ side: 'long', entry_price: 83000, leverage: 5, funding_rate: 0.0001, account_balance: 5000 });

// Primitives — single formula
const avg = await tc.primitives.averageEntry({ symbol: 'BTCUSDT', input: { fills: [{ price: 83000, quantity: 0.1 }] } });

// System
const report = await tc.system.verify();
```

`tc.call()` is available for raw MCP access. Full docs: [npmjs.com/package/tradingcalc-sdk](https://www.npmjs.com/package/tradingcalc-sdk)

## Links

- For agents: [tradingcalc.io/for-agents](https://tradingcalc.io/for-agents)
- For agents: [tradingcalc.io/for-agents](https://tradingcalc.io/for-agents)
- Verification proof: [tradingcalc.io/verify](https://tradingcalc.io/verify)
- Web calculators: [tradingcalc.io](https://tradingcalc.io)

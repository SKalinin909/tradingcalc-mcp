# TradingCalc MCP Server

[![MCP Badge](https://lobehub.com/badge/mcp/skalinin909-tradingcalc-mcp)](https://lobehub.com/mcp/skalinin909-tradingcalc-mcp)

Ask Claude or Cursor trade questions and get exact numbers back, not AI guesses.

> "What should a BTC call at a $90k strike, 30 days out, with 55% implied volatility be worth?"
> "How many lots of EUR/USD should I trade to risk $200 with a 30-pip stop?"
> "What's my 95% Value at Risk on this monthly return series?"
> "What's my PnL if I buy 0.5 BTC at $80k and sell at $95k with 5x leverage?"

75 deterministic tools across Deribit BTC/ETH options math (payoff/breakeven, Black-Scholes price/Greeks, straddle/strangle, vertical spreads, covered call/protective put, implied volatility), forex (pip value, margin level, breakeven, PnL, risk/reward, scenario, average entry, position size, margin required, currency conversion, swap/rollover cost, correlation, with live-FX-rate variants), quant risk/stats (VaR/CVaR, Sharpe with the Lo 2002 correction, GARCH(1,1) volatility, risk parity, Hurst exponent, cointegration, portfolio tearsheet, Deflated Sharpe Ratio, Kelly growth-security frontier, return unsmoothing, EVT tail risk, order-book impact), prediction-market odds and fair value across Kalshi, Polymarket, Limitless, Myriad and ADI Predictstreet's crypto categories, chain-agnostic on-chain tools (Solana token safety, swap price impact, bonding curve, plus Solana + 5 EVM chains for market cap comparison, wallet flag check and impermanent loss), and crypto perpetual futures (trade planning, risk & margin, funding/carry, Market Profile market-structure analysis). Formulas verified against 42 canonical test vectors: same inputs always produce the same outputs. Every response is also signed with ECDSA P-256, so you can verify offline that it actually came from us. Once a day the verification state is also written to Solana ([latest record](https://tradingcalc.io/verification#public-anchor)). Free, no signup.

Access via **MCP** (Claude Desktop / Cursor / VS Code) or a plain HTTP POST to the MCP endpoint. Free, no signup.

## Endpoints

| Surface | URL | Auth |
|---|---|---|
| MCP | `https://tradingcalc.io/api/mcp` | Bearer optional (free) |
| For agents / setup | `https://tradingcalc.io/for-agents` | None |
| Full API & MCP reference | `https://docs.tradingcalc.io/api` | None |
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

### Agent Skill

For coding agents that support the [skills.sh](https://skills.sh) ecosystem (Claude Code, Cursor,
GitHub Copilot, and others) - installs a `SKILL.md` that teaches the agent when to reach for these
tools instead of estimating trade math itself:

```bash
npx skills add SKalinin909/tradingcalc-mcp
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

After connecting, just ask naturally: the AI picks the right tool automatically:

**Options payoff**
> "What does my BTC call payoff at $90,000? Strike $85,000, premium 0.02 BTC, long 1 contract."

**Black-Scholes / IV check**
> "Is Deribit's BTC-27FEB27-90000-C fairly priced right now?"

**Covered call yield**
> "I hold BTC bought at $80,000. What annualized yield do I get selling a $85,000-strike call for 0.02 BTC, 30 days out?"

**Forex pip value**
> "What's a pip worth on 2 lots of EUR/USD, in my USD account?"

**Forex position size**
> "How many lots should I trade to risk $200 on EUR/USD with a 30-pip stop?"

**Forex margin level**
> "My equity is $5,000 and used margin is $1,800. How close am I to a margin call?"

**Value at Risk**
> "What's my 95% Value at Risk and expected shortfall on this monthly return series? [paste returns]"

**Sharpe ratio**
> "What's the Sharpe ratio of these monthly returns, corrected for autocorrelation?"

**Cointegration**
> "Are these two price series cointegrated? Is there a pairs trade?"

**Odds converter**
> "What odds does a 35% probability work out to?"

**Market-implied odds**
> "What does the market think BTC will be worth by year end?"

**Prediction market edge**
> "I think this event is 60% likely but the market prices it at 40%. Should I bet, and how much with a $10k bankroll?"

**Token safety check**
> "Is this Solana token a rug pull risk? Mint: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"

**Swap price impact**
> "How much slippage will I eat swapping 50,000,000 BONK to USDC?"

**Bonding curve**
> "How many tokens do I get buying with 1 SOL on a pump.fun curve that's already raised 20 SOL?"

**Market cap comparison**
> "If I put $1,000 into BONK and it reaches JUP's market cap, what's it worth?"

**Wallet flag check**
> "Is this wallet address flagged for anything? [address]" (Solana or EVM)

**Trade P&L**
> "I bought 0.5 BTC at $80,000 and want to sell at $95,000 with 5x leverage. What's my net profit after fees?"

**Position sizing**
> "I have a $10,000 account and want to risk 1% going long BTC at $83,000 with a stop at $81,000. How many coins should I buy?"

**Liquidation check**
> "Long ETH at $3,200 with 10x leverage, where do I get liquidated?"

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

## Tools (75)

Tool naming follows the `workflow.run_*` / `primitive.*` / `system.*` namespace convention.
Old flat names (`pnl`, `liquidation`, etc.) are accepted for backward compatibility. All tools are
free via MCP, no signup; 100 calls/day anonymously, 200/day with a free API key.

| Category | Tools |
|---|---|
| Options (Deribit BTC/ETH, coin-settled) | Options payoff & breakeven, Black-Scholes price/Greeks (manual + live), straddle/strangle, vertical spread & iron condor, covered call/protective put, implied volatility solver (7) |
| Forex (quote-currency + live account-currency conversion) | Pip value, margin level, breakeven, PnL, risk/reward, scenario, average entry, position size, margin required, currency converter, swap/rollover cost, correlation/hedge ratio: manual + live-FX-rate variants (17) |
| Risk/Stats | VaR/CVaR (+ Modified VaR), Sharpe ratio (Lo 2002 + PSR), Hurst exponent, cointegration, portfolio tearsheet, GARCH(1,1), risk parity, Deflated Sharpe Ratio, Kelly growth-security frontier, return unsmoothing, EVT tail risk, order-book impact (12) |
| Prediction Markets (Kalshi, Polymarket, Limitless, Myriad, ADI Predictstreet crypto categories) | Odds converter, market-implied odds, prediction-market edge, window fair value, cross-venue spread reader, cross-venue arbitrage (6) |
| On-chain (Solana + 5 EVM chains, per tool) | Token risk check, swap price impact, bonding curve, market cap comparison, wallet flag check, impermanent loss (manual + live) (7) |
| Trade Planning | PnL, break-even, exit target, scenario, DCA entry, scale-out, average down (7) |
| Risk & Margin | Liquidation safety, position sizing, max leverage, risk/reward (4) |
| Funding & Carry | Funding cost, funding arbitrage, compound funding, funding break-even, carry trade (5) |
| Market Structure (Market Profile) | Open analysis, session structure, value migration, breakout acceptance (4) |
| Primitives | Average entry, hedge ratio (2) |
| Integrated Decision | Pre-trade check (sizing + liquidation + breakeven + funding + go/no-go in one call), portfolio risk review (2) |
| System | `system.verify` - run 42 canonical test vectors, get a pass/fail report; `system.pubkey` - get the public key to verify signed responses offline (2) |

Full tool-by-tool reference (every input/output schema, request/response examples, per-tool
descriptions): **[docs.tradingcalc.io/api](https://docs.tradingcalc.io/api)**

Formulas normalized across 17 exchanges: **Binance, OKX, Bybit, Aster, Hyperliquid, MEXC, KuCoin, Gate, Deribit, Kraken, HTX, WOO, Phemex, Blofin, Backpack, dYdX, Polymarket Perps**.

## Rate Limits

| Access | Req/day | Price |
|---|---|---|
| Anonymous | 100 | Free |
| Free API key | 200 | Free |

The Service is free. Need a higher-limit key? Email [s@tradingcalc.io](mailto:s@tradingcalc.io).

Pass key as: `Authorization: Bearer <your-api-key>`

## Self-Verification

Agents can verify all 42 canonical test vectors before trusting results:

```json
{
  "jsonrpc": "2.0", "id": 1,
  "method": "tools/call",
  "params": { "name": "system.verify", "arguments": {} }
}
```

Response: `{ "status": "pass", "passed": 42, "failed": 0, "total": 42 }`

Live proof: [tradingcalc.io/verify](https://tradingcalc.io/verify)

## Signed Responses

`system.verify` proves the formulas are correct. It doesn't prove the specific response you got
wasn't altered by a proxy, cache, or MITM in between. Every `tools/call` result carries a second
`content` block signed with ECDSA P-256, plus `X-TradingCalc-Signature/Kid/Signed-At` headers.
Call `system.pubkey` (or `GET /api/mcp/pubkey`) for the public key (PEM + JWK) and the canonical
string format needed to verify offline, no callback required.

Once a day the verification state is also signed and its SHA-256 is written to Solana mainnet in a Memo transaction (`tcalc1 {date} {hash}`), each record carrying the hash of the day before. Read the records at `GET https://tradingcalc.io/api/anchors`; the latest record and how to verify it yourself are at [tradingcalc.io/verification](https://tradingcalc.io/verification#public-anchor).

## Use Cases

- **Options and forex desks**: price an option, size a forex position, or check margin level in one exact call
- **Quant research**: Sharpe, VaR, cointegration and drawdown statistics from a return series, cross-checked against reference libraries
- **Trading bots**: check liquidation price before every trade
- **AI agents**: deterministic risk calculations without hallucination risk
- **Multi-agent systems**: drop-in risk management agent in analyst + risk + execution pipelines
- **Dashboards**: embed calculations programmatically

## Why deterministic?

LLMs asked directly give plausible but potentially wrong numbers. TradingCalc MCP returns exact calculations: same inputs always produce the same outputs. No hallucination risk for financial data.

## Risk Agent Wrapper

`examples/risk-agent-wrapper.ts`: a drop-in TypeScript wrapper for risk-gated trade execution.
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
  // execute trade: result.recommended_size, result.liquidation_price
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

// Workflows: orchestrated decisions
const check = await tc.workflows.preTradeCheck({ side: 'long', entry_price: 83000, leverage: 5, funding_rate: 0.0001, account_balance: 5000 });

// Primitives: single formula
const avg = await tc.primitives.averageEntry({ symbol: 'BTCUSDT', input: { fills: [{ price: 83000, quantity: 0.1 }] } });

// System
const report = await tc.system.verify();
```

`tc.call()` is available for raw MCP access. Full docs: [npmjs.com/package/tradingcalc-sdk](https://www.npmjs.com/package/tradingcalc-sdk)

## Links

- For agents: [tradingcalc.io/for-agents](https://tradingcalc.io/for-agents)
- Full docs (API & MCP reference, methodology, architecture, changelog): [docs.tradingcalc.io](https://docs.tradingcalc.io)
- Verification proof: [tradingcalc.io/verify](https://tradingcalc.io/verify)
- Web calculators: [tradingcalc.io](https://tradingcalc.io)

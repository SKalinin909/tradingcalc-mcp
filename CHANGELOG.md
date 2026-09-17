# Changelog

All notable changes to the TradingCalc MCP server are documented here.

Format: **Tool Changes · Verification Changes · MCP/API Changes · Breaking Changes**

---

## [2.9.0] — 2026-09-17

### Tool Changes
- Three new tools (31 total), a new domain — Prediction Markets, reading Kalshi's public,
  keyless crypto-price category (a CFTC-regulated exchange; settlement sourced to CF Benchmarks'
  BRTI index):
  - `workflow.run_odds_converter` — probability (manual or live Kalshi ticker) → decimal/American
    odds, breakeven win rate, and vig when a live market gives both sides of the price.
  - `workflow.run_market_implied_odds` — full BTC/ETH year-end price ladder → median/mode bucket,
    probability at any real bucket boundary. No expected value or in-bucket interpolation — the
    open-ended top/bottom buckets would need an invented assumption, so every number traces to
    one live, sourced price instead.
  - `workflow.run_prediction_market_edge` — your probability estimate vs the market's price →
    fractional (quarter-)Kelly recommended stake and verdict.
- Scoped deliberately to Kalshi's Crypto category only, not politics/sports — stays horizontal
  within crypto rather than drifting into an unrelated vertical. Polymarket was evaluated as a
  second venue but found unreachable from the build/dev network entirely.

---

## [2.8.0] — 2026-09-17

### MCP/API Changes
- `workflow.run_market_cap_comparison` and `workflow.run_wallet_flag_check` are no longer
  Solana-only — both now accept `chain`/`tokenChain`/`compareToChain` (`solana`, `ethereum`,
  `base`, `bsc`, `arbitrum`, `polygon`, default `solana`). The two tokens in a market-cap
  comparison can be on different chains. Backward compatible: omitting the new parameter
  defaults to Solana, matching the previous behavior exactly.
- `workflow.run_wallet_flag_check` gains a third source on EVM chains: ScamSniffer's public
  phishing/drainer blacklist (not applicable on Solana — their database has zero Solana coverage).

### Tool Changes
- The other three on-chain tools (`token_risk_check`, `swap_price_impact`, `bonding_curve`) stay
  Solana-only — their primary vendors (RugCheck, Jupiter, pump.fun) are Solana-specific by nature,
  not by an unexamined default like the two above were.

---

## [2.7.0] — 2026-09-17

### Tool Changes
- New tool `workflow.run_wallet_flag_check` (28 tools total) — checks a Solana wallet against two
  independent sources (GoPlus's 18 malicious-address categories, keyless; Webacy's address
  analysis + dedicated sanctions check, keyed) and returns each source's own facts separately,
  never merged into one invented score — the two use different, opaque methodologies.
- First tool requiring a paid-signup vendor key. Every prior on-chain tool was fully keyless.
  Vendor research ruled out ScamSniffer (public database confirmed EVM-only, zero Solana
  addresses across 2530 entries) and RugCheck's documented wallet-risk endpoint (dead, 404).

---

## [2.6.0] — 2026-09-17

### Tool Changes
- New tool `workflow.run_market_cap_comparison` (27 tools total) — projects what an investment
  would be worth if one token's market cap matched a second token's, using live market caps.
  Deliberately narrative-agnostic (works for any token pair, not one hype cycle).
- Fourth On-chain tool, and the first needing two independent live identifier lookups instead of
  one (every prior on-chain tool took a single token address).

---

## [2.5.0] — 2026-09-17

### Tool Changes
- New tool `workflow.run_bonding_curve` (26 tools total) — exact tokens received, price impact,
  and graduation progress for a pump.fun-style bonding curve buy. Pure constant-product (Uniswap
  V2) math using pump.fun's own documented reserve constants
  (github.com/pump-fun/pump-public-docs) — no live lookup needed. Graduation threshold (~85 SOL
  raised) is derived from those constants, not hardcoded.
- Third On-chain tool, and the first with no live-data dependency at all — confirms domain (chain
  scope) and data tier are independent classifications, not the same thing.

---

## [2.4.0] — 2026-09-16

### Tool Changes
- New tool `workflow.run_swap_price_impact` (25 tools total) — live price-impact quote for a
  Solana swap, routed through Jupiter across every pool it knows about, not a single-pool
  estimate. Shows expected output amount, price impact %, and effective price vs current market
  price.
- Second On-chain-domain tool (after `workflow.run_token_risk_check`) — the tool catalog now
  groups these under their own "On-chain (Solana)" section rather than folding them into an
  unrelated category.

---

## [2.3.0] — 2026-09-16

### Tool Changes
- New tool `workflow.run_token_risk_check` (24 tools total) — Solana token rug-pull mechanism check.
  Scores only rug MECHANISMS: mint authority, freeze authority, LP-lock %, mutable metadata, and
  RugCheck's own named scam-pattern flags (e.g. copycat-token detection). Holder concentration and
  top-holder dump-impact are returned as informational `market_context`, not scored — live testing
  showed large legitimate tokens (BONK/WIF/JUP) landing in the worst score band purely for being
  large and liquid when those were included.
- Facts that can't be verified when the primary data source (RugCheck) is unavailable come back as
  `null` and are excluded from scoring rather than defaulted to a guessed value.

### MCP/API Changes
- Exchange matrix corrected to 16 (CoinEx removed — exchange shut down 2026-09).

---

## [2.2.0] — 2026-04-09

### Other
- `/what-is-deterministic-computation-layer` — concept page: 4 properties (idempotent / traceable / verifiable / composable), contrast table vs LLM / spreadsheet, use-case matrix
- `/deterministic-workflows` — product hub: Primitive → Analyzer → Workflow taxonomy, all 6 workflows with primitives and verdicts, REST example
- `/docs` sidebar Concepts section added; `/for-agents` "Why deterministic" links updated

---

## [2.1.0] — 2026-04-09

### Other
- `/methodology` — formula derivation reference: all 12 calculators, exchange doc sources, 3-layer verification system
- `/why-ai-agents-need-exact-calculations` — SEO article: LLM vs deterministic tool, architecture pattern, critical calculation types
- 55 exchange-specific calculator pages indexed in sitemap (Binance/Bybit/OKX/Hyperliquid/Aster/KuCoin/MEXC × 7–8 calculators)

---

## [2.0.1] — 2026-04-09

### SDK Fix
- `tradingcalc-sdk@2.0.1`: fixes `PreTradeCheckOutput` missing `verdict` / `verdict_summary` in dist types

### Examples
- `examples/risk-agent-wrapper.ts` — drop-in TypeScript risk gate for agent frameworks
  - `RiskAgent` class with `evaluate()` / `isSafe()` / configurable gates
  - `preTradeGate()` standalone function
  - `examples/package.json` + `tsconfig.json` — runnable via `npm run risk-agent`

---

## [2.0.0] — 2026-04-08

### Breaking Changes
- `tradingcalc-sdk@2.0.0`: flat methods removed (`tc.pnl()`, `tc.verify()`, etc.)
- New namespace API: `tc.workflows.*` / `tc.primitives.*` / `tc.system.*`
- `tc.call()` unchanged — raw MCP access still works

### TypeScript SDK
- `PrimitivesNamespace`, `WorkflowsNamespace`, `SystemNamespace` exported as first-class types

---

## [1.5.2] — 2026-04-07

### Other
- All workflow pages open with live pre-filled BTC example — result visible before first keystroke
- Risk/Reward: counterfactual nudge — "Move target to $X → 2:1. Win rate drops from Y% to Z%"
- Risk/Reward: partial results after 3 fields — verdict and price ladder visible without account size
- Direct personal language across all widgets — "You're risking $100 to make $240"
- Narrative bars rewritten: "You're going long BTC/USDT at $83,000 · your stop is $80,500"
- Empty states rewritten as questions: "Where are you buying? I'll tell you your real entry price."

---

## [1.5.1] — 2026-04-07

### Other
- All 6 workflow pages rewritten with human-narrative UX — question titles, conversational labels, verdict cards
- Instrument selector on all workflow pages — exchange + live pair list + "Use current price" button
- Risk/Reward: visual price ladder (stop/entry/target proportions), minimum win rate metric
- Funding Breakeven: live funding rate auto-fill from selected exchange/pair
- Carry Trade: live funding rates for both legs with independent exchange selectors
- Scale-Out: visual exit ladder showing exit points proportional to price range
- Cross-workflow navigation links — Risk/Reward → Scale-Out, DCA Entry → Funding Breakeven

---

## [1.5.0] — 2026-04-06

### Tool Changes
- Added 5 composite workflow tools: `workflow.run_risk_reward`, `workflow.run_carry_trade`, `workflow.run_dca_entry`, `workflow.run_scale_out`, `workflow.run_funding_breakeven`
- Credits-based billing: Primitive = 1 cr · Standard workflow = 5 cr · Integrated decision = 10 cr

### MCP/API Changes
- New namespaced tool names (M1 contract): `workflow.*`, `primitive.*`, `system.*`
- Old flat names (`pnl`, `liquidation`, etc.) retained for backward compatibility

---

## [1.4.1] — 2026-04-07

### Other
- `server.json` — added `category`, `type`, `verification`, `use_cases` metadata fields for MCP catalog discoverability

---

## [1.4.0] — 2026-04-06 — M2 Developer Surface

### MCP/API Changes
- `POST /v1/primitives/:primitive_id` — REST compute endpoint for all 12 primitives; 1 credit each; same Bearer `tc_*` auth as `/v1/workflows`
- `GET /v1/primitives` — public discovery endpoint, returns all primitives with input schemas, descriptions, credit cost
- `/docs` — API reference hub: quick start, auth & rate limits, primitives, workflows, response contract, error codes, MCP config

### Other
- `/pricing` — code examples updated to `/v1/primitives` and `/v1/workflows` (was `/api/mcp` jsonrpc)
- `/pre-trade-check` — empty state panel in results column; form Tailwind-only (removed inline `C.*` styles)

### Fixed
- MCP `client_name` in `mcp_tool_call` PostHog events — was always `null` for authenticated clients; `initialize` now stores client name under API key hash in addition to IP hash

---

## [1.3.0] — 2026-04-05 — M1 Platform Foundation

### MCP/API Changes
- `POST /v1/workflows/:workflow_id` — 11 workflows across Planning, Risk, and Funding families
- Response contract: `request_id`, `execution_id`, `workflow_id`, `workflow_version`, `status`, `result`, `metadata`, `trust`
- `trust.manifest_id` — every execution persists a `ManifestRecord` with input classification and verification status
- Bearer `tc_*` API key auth (`src/lib/v1Auth.ts`); rate limits: free 200/day, pro 10k/day; `X-RateLimit-Remaining` header

### Other
- Prisma schema: `Account`, `Workspace`, `ApiKey`, `WorkflowDefinition`, `WorkflowVersion`, `CreditLedger`, `WorkflowExecution`, `ManifestRecord`, `FundingRateSnapshot`, `InstrumentReference`
- Workflow Registry: `resolveWorkflow()` — DB lookup with Redis cache (5 min TTL)
- Reference Store v0: cron funding rate capture (Binance + Bybit, 1h), seed script for P0 instruments
- `/pricing` — credits-based model (Free → Growth), credits table, overage rates
- Full `docs/` archive: platform, workflows, API reference, pricing, roadmap, platform contracts (14+ files)

---

## [1.2.1] — 2026-03-31

### Tool Changes
- `pre_trade_check` output now includes `summary_a`, `summary_b`, `summary_c` — human-readable Russian decision strings
  - `summary_a`: position size, breakeven price, funding cost per 24h
  - `summary_b`: liquidation distance ratio with safety verdict (ok / warn / danger)
  - `summary_c`: overnight breakeven shift over `hold_hours`

### MCP/API Changes
- CI: bot webhook auto-registration after every staging deploy

---

## [1.2.0] — 2026-03-31

### MCP/API Changes
- Added `mcp_connect` analytics event on `initialize` — captures `client_name`, `client_version`, `protocol_version`
- Enriched `mcp_tool_call` event properties: `tool_name`, `has_api_key`, `exchange` (was: `tool`, `plan`, `source`)
- `tools/list` promoted to fast-path — no auth or rate limit required for metadata

### Other
- `/for-agents` page: FAQ (10 Q&A), pricing tiers (Evaluate / Builder / Pro Agent / Strategy), tool suite reference
- `/verify` page: live proof expanded with hero, formula assumptions (12 calculators), error model (6 codes), version history
- `/tools` standalone page added to sitemap
- UTM referral tracking (`catalog_referral`) via middleware — captures `utm_source`, `utm_medium`, `utm_campaign`
- PostHog "MCP Growth" dashboard: tool call trends, top tools, UTM breakdown, agent page views

---

## [1.1.0] — 2026-03-30

### Tool Changes
- Added `max_leverage` — Max Safe Leverage: max leverage from stop distance, maintenance margin, and fee
- Added `funding_arb` — Funding Rate Arbitrage: annualized yield from rate differential between two exchanges
- Added `hedge_ratio` — Hedge Ratio: spot-to-perp hedge size with funding cost over holding period
- Added `compound_funding` — Compound Funding: iterative funding cost with position size decay per period
- Total: **12 tools** across 3 suites (Trade Planning · Risk & Margin · Funding & Carry)

### Verification Changes
- Added formal 3-layer verification system:
  - `VERIFY_VECTORS` — 22 canonical input/output pairs with step-by-step arithmetic (`src/lib/verify.ts`)
  - Test suite — 66 Vitest tests: 22 exact-value vector tests + 44 property tests (`calculators.test.ts`)
  - `verify_calculators` MCP tool — runs full test-vector suite on demand, returns pass/fail report
- Added `/verify` public proof page — SSR, no cache, runs `runVerify()` live on every request

### MCP/API Changes
- MCP `initialize` fast-path: returns before auth/rate-limit check — eliminates cold-start timeouts
- MCP `notifications/*` returns `204` (silent, per JSON-RPC spec)
- SSE `GET /api/mcp` sends keepalive ping — prevents health check failures on Glama
- `server.json` updated: title `"TradingCalc MCP"`, version `1.1.0`, 12 tools listed
- `llms.txt` updated: `/for-agents`, `/verify`, 12 tools

---

## [1.0.0] — 2025-12-01

### Tool Changes
Initial release with **8 calculators**:
- `pnl` — Net PnL, ROE, fees and gross P&L for a futures trade
- `breakeven` — Break-even price accounting for entry and exit fees
- `target_exit` — Exit price required to hit a target PnL or ROE
- `position_sizer` — Position size from account balance and max risk %
- `average_entry` — Average entry price after DCA into a position
- `scenario` — Multi-scenario P&L table across price targets
- `liquidation` — Liquidation price for isolated and cross margin
- `funding_cost` — Funding cost over a holding period

### MCP/API Changes
- MCP Streamable HTTP endpoint at `POST /api/mcp` (JSON-RPC 2.0)
- Auth: `Authorization: Bearer <api-key>` (anonymous allowed)
- Rate limits: anonymous 20/day · free 200/day · pro 10,000/day
- Formulas normalized across 7 exchanges: Binance, Bybit, OKX, KuCoin, MEXC, Bitget, Gate.io

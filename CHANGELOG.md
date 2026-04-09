# Changelog

All notable changes to the TradingCalc MCP server are documented here.

Format: **Tool Changes · Verification Changes · MCP/API Changes · Breaking Changes**

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

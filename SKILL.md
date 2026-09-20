---
name: tradingcalc
description: Compute crypto futures/perp trade math (PnL, liquidation price, breakeven, position sizing, funding cost, risk-reward) and Deribit options math (payoff, Black-Scholes, implied volatility) via TradingCalc's free MCP server instead of estimating by hand. Use whenever a user asks about leverage, margin, liquidation, funding rate, options pricing/Greeks, or "is this trade worth it" for a crypto position.
license: MIT
---

# TradingCalc — deterministic crypto trading math

## What this skill does

Gives an agent a reliable way to answer crypto futures/perpetual trading math questions with
exact numbers instead of an LLM estimate. TradingCalc's MCP server exposes 38 deterministic
tools (trade planning, risk/margin, funding/carry, market-structure analysis, on-chain token
risk, prediction-market odds, Deribit BTC/ETH options) whose formulas are checked against 35
canonical test vectors — same inputs always produce the same outputs (see
`https://tradingcalc.io/verify`).

Do not compute leverage, liquidation price, funding cost, or position sizing yourself and
present it as authoritative — a small arithmetic slip here is real financial risk for whoever
acts on it. Call the tool instead.

## When to use it

Trigger on questions like:

- "What's my PnL if I buy 0.5 BTC at $80k and sell at $95k with 5x leverage?" → `pnl` /
  `workflow.run_pnl_planning`
- "Where does my position get liquidated?" → `liquidation` / `workflow.run_liquidation_safety`
- "How much should I buy to risk exactly $200?" → `risk_sizer` / `workflow.run_position_sizing`
- "Is this trade worth taking?" (given entry/stop/target) → `workflow.run_risk_reward`
- "What's my breakeven including fees?" → `breakeven` / `workflow.run_breakeven_planning`
- "How much funding will I pay holding 3 days?" → `funding_cost` / `workflow.run_funding_cost`
- "Is this carry trade / funding arb profitable?" → `funding_arb` / `workflow.run_carry_trade`
- "Run a full pre-trade check on this setup" → `pre_trade_check` (composite: sizing +
  liquidation + breakeven + funding in one call)
- Same pattern for on-chain risk ("is this Solana token a rug pull risk?" →
  `workflow.run_token_risk_check`), prediction-market odds ("what odds does a 35%
  probability work out to?" → `workflow.run_odds_converter`), and Deribit BTC/ETH options
  ("what does my BTC call payoff at price X?" → `workflow.run_options_payoff`; "is this Deribit
  option fairly priced?" → `workflow.run_black_scholes_live`; "what IV does this option price
  imply?" → `workflow.run_implied_volatility`).

Also applies when the user's position is **coin-margined / inverse** (e.g. Bybit `BTCUSD`,
Deribit `BTC-PERPETUAL`) rather than USDT-margined — pass `contractType: "inverse"`. Inverse
math is not a sign-flipped version of linear math (it uses reciprocal-price formulas and the
average-of-fills is a harmonic mean, not arithmetic), which is exactly the kind of detail worth
delegating instead of guessing.

## Steps

1. Identify which tool/workflow fits the question (see list above, or call `tools/list` for the
   full 38-tool catalog with schemas — full reference at `https://docs.tradingcalc.io/api`).
2. Call it over MCP. No signup or API key required for normal use:
   ```json
   POST https://tradingcalc.io/api/mcp
   { "jsonrpc": "2.0", "method": "tools/call",
     "params": { "name": "<tool>", "arguments": { ... } } }
   ```
   Sensible defaults exist if the user doesn't specify: taker fees 0.02% open / 0.05% close,
   maintenance margin rate 0.5%. Only linear (USDT-margined) is assumed unless the user's
   instrument is inverse.
3. Report the result back to the user as a plain-English sentence with the actual numbers
   ("Your position gets liquidated at $71,428, about 10.7% below entry"), not raw JSON.
4. If the result matters for a real financial decision and you want to double-check the server
   itself hasn't drifted, call `system.verify` (`{"name": "system.verify", "arguments": {}}`) —
   it re-runs all 35 canonical vectors live and returns pass/fail per formula.
5. Optional integrity check: every `tools/call` response includes a second `content` block with
   an ECDSA P-256 signature over the first block's text (`X-TradingCalc-Signature` header too).
   Call `system.pubkey` for the public key if you need to verify a response wasn't altered in
   transit/cache before relaying it.

## Validation

- The numbers came from a `tools/call` response, not from you estimating them in the reply.
- `contractType` was set to `"inverse"` if and only if the instrument is coin-margined.
- If the user pushed back on a number or it looks financially significant, `system.verify`
  was called and returned `"status": "pass"` before the number was relayed as trustworthy.

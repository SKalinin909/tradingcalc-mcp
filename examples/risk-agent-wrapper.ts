/**
 * TradingCalc Risk Agent Wrapper
 *
 * A reusable TypeScript wrapper for risk-gated trade execution.
 * Drop this into any agent framework (ElizaOS, CrewAI, AutoGen, Hummingbot, Freqtrade)
 * to add deterministic pre-trade risk checks before entering a position.
 *
 * Setup:
 *   cd examples && npm install
 *   TC_API_KEY=tc_your_key npm run risk-agent
 *
 * Usage:
 *   const agent = new RiskAgent({ apiKey: 'tc_your_key' });
 *   const result = await agent.evaluate({ ... });
 *   if (result.approved) { // execute trade }
 */

import { TradingCalcClient } from 'tradingcalc-sdk';
import type { PreTradeCheckOutput } from 'tradingcalc-sdk';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Side = 'long' | 'short';

export interface TradeSetup {
  /** Trading pair, e.g. 'BTCUSDT' */
  symbol: string;
  /** Exchange for live funding rate lookup: 'binance' | 'bybit' | 'okx' | 'hyperliquid' */
  exchange?: string;
  side: Side;
  /** Entry price in USDT */
  entry_price: number;
  /** Stop-loss price in USDT */
  stop_loss: number;
  /** Account balance in USDT */
  account_balance: number;
  /** Max risk as % of account (e.g. 1 = 1%) */
  risk_pct: number;
  /** Leverage multiplier */
  leverage: number;
  /** Funding rate per 8h period (decimal). If omitted and exchange+symbol provided, fetched live. */
  funding_rate?: number;
  /** Hold duration in hours (default: 8) */
  hold_hours?: number;
}

export interface RiskCheckResult {
  /** Whether the agent approves this trade */
  approved: boolean;
  /** Reason for rejection if not approved */
  rejection_reason?: string;
  /** Recommended position size in base currency (e.g. BTC) */
  recommended_size: number;
  /** Liquidation price */
  liquidation_price: number;
  /** Breakeven price after fees */
  breakeven_price: number;
  /** Estimated funding cost over hold period in USDT */
  funding_cost_hold: number;
  /** Safety level: 'ok' | 'warn' | 'danger' | 'impossible' */
  safety: PreTradeCheckOutput['safety'];
  /** Verdict: 'safe' | 'proceed_with_caution' | 'high_risk' | 'unsafe' */
  verdict: PreTradeCheckOutput['verdict'];
  /** Plain-English trade summary from TradingCalc */
  summary: string;
  /** Full pre-trade check output for detailed analysis */
  raw: PreTradeCheckOutput;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export interface RiskAgentConfig {
  /** TradingCalc API key. Get one at tradingcalc.io/pricing */
  apiKey?: string;
  /** Reject trades with verdict = 'unsafe' (default: true) */
  rejectUnsafe?: boolean;
  /** Reject trades with verdict = 'high_risk' (default: false) */
  rejectHighRisk?: boolean;
  /** Minimum liquidation distance as % of entry (default: 2.0%) */
  minLiqDistancePct?: number;
}

// ─── RiskAgent ────────────────────────────────────────────────────────────────

export class RiskAgent {
  private readonly tc: TradingCalcClient;
  private readonly config: Required<RiskAgentConfig>;

  constructor(config: RiskAgentConfig = {}) {
    this.tc = new TradingCalcClient({ apiKey: config.apiKey });
    this.config = {
      apiKey:            config.apiKey ?? '',
      rejectUnsafe:      config.rejectUnsafe      ?? true,
      rejectHighRisk:    config.rejectHighRisk     ?? false,
      minLiqDistancePct: config.minLiqDistancePct  ?? 2.0,
    };
  }

  /**
   * Run a full pre-trade risk check.
   * Returns approved=true if the trade passes all configured risk gates.
   */
  async evaluate(setup: TradeSetup): Promise<RiskCheckResult> {
    // Call TradingCalc pre-trade check — deterministic, not AI estimation
    const check = await this.tc.workflows.preTradeCheck({
      side:            setup.side,
      entry_price:     setup.entry_price,
      stop_loss:       setup.stop_loss,
      account_balance: setup.account_balance,
      risk_pct:        setup.risk_pct,
      leverage:        setup.leverage,
      funding_rate:    setup.funding_rate ?? 0,
      hold_hours:      setup.hold_hours   ?? 8,
    });

    // Risk gate 1: explicit safety flags
    if (check.safety === 'impossible') {
      return this._reject(check, 'Trade is impossible at these parameters (check liquidation vs stop distance)');
    }

    // Risk gate 2: verdict threshold
    if (this.config.rejectUnsafe && check.verdict === 'unsafe') {
      return this._reject(check, `Verdict: unsafe — ${check.verdict_summary}`);
    }
    if (this.config.rejectHighRisk && check.verdict === 'high_risk') {
      return this._reject(check, `Verdict: high_risk — ${check.verdict_summary}`);
    }

    // Risk gate 3: liquidation distance
    if (check.liquidation_distance_pct < this.config.minLiqDistancePct) {
      return this._reject(
        check,
        `Liquidation too close: ${check.liquidation_distance_pct.toFixed(2)}% < minimum ${this.config.minLiqDistancePct}%`,
      );
    }

    return {
      approved:          true,
      recommended_size:  check.recommended_size,
      liquidation_price: check.liquidation_price,
      breakeven_price:   check.breakeven_price,
      funding_cost_hold: check.funding_cost_hold,
      safety:            check.safety,
      verdict:           check.verdict,
      summary:           [check.summary_a, check.summary_b, check.summary_c].filter(Boolean).join(' | '),
      raw:               check,
    };
  }

  /**
   * Quick safety check — returns true/false only.
   * Use when you only need a binary go/no-go signal.
   */
  async isSafe(setup: TradeSetup): Promise<boolean> {
    const result = await this.evaluate(setup);
    return result.approved;
  }

  private _reject(check: PreTradeCheckOutput, reason: string): RiskCheckResult {
    return {
      approved:          false,
      rejection_reason:  reason,
      recommended_size:  check.recommended_size,
      liquidation_price: check.liquidation_price,
      breakeven_price:   check.breakeven_price,
      funding_cost_hold: check.funding_cost_hold,
      safety:            check.safety,
      verdict:           check.verdict,
      summary:           [check.summary_a, check.summary_b, check.summary_c].filter(Boolean).join(' | '),
      raw:               check,
    };
  }
}

// ─── Standalone functions (for frameworks that prefer functional style) ────────

/**
 * Gate-check a single trade setup.
 * Returns { approved, size, liqPrice } — minimal surface for execution bots.
 */
export async function preTradeGate(
  setup: TradeSetup,
  apiKey?: string,
): Promise<{ approved: boolean; size: number; liqPrice: number; reason?: string }> {
  const agent = new RiskAgent({ apiKey });
  const result = await agent.evaluate(setup);
  return {
    approved: result.approved,
    size:     result.recommended_size,
    liqPrice: result.liquidation_price,
    reason:   result.rejection_reason,
  };
}

// ─── Example usage ─────────────────────────────────────────────────────────────

async function main() {
  const agent = new RiskAgent({
    apiKey:         process.env.TC_API_KEY,
    rejectUnsafe:   true,
    rejectHighRisk: false,
    minLiqDistancePct: 3.0,
  });

  // Example 1: standard risk check
  const result = await agent.evaluate({
    symbol:          'BTCUSDT',
    exchange:        'bybit',
    side:            'long',
    entry_price:     83000,
    stop_loss:       81000,
    account_balance: 10000,
    risk_pct:        1,
    leverage:        5,
    funding_rate:    0.0001,
    hold_hours:      24,
  });

  console.log('Approved:', result.approved);
  console.log('Size:    ', result.recommended_size, 'BTC');
  console.log('Liq:     ', result.liquidation_price);
  console.log('Safety:  ', result.safety, '/', result.verdict);
  console.log('Summary: ', result.summary);

  if (!result.approved) {
    console.log('Rejected:', result.rejection_reason);
    return;
  }

  // Example 2: binary gate for execution bot
  const ok = await agent.isSafe({
    symbol:          'ETHUSDT',
    side:            'short',
    entry_price:     3200,
    stop_loss:       3350,
    account_balance: 5000,
    risk_pct:        0.5,
    leverage:        3,
    funding_rate:    -0.0002,
  });
  console.log('\nETH short safe to enter:', ok);

  // Example 3: standalone function (minimal integration)
  const gate = await preTradeGate({
    symbol:          'SOLUSDT',
    side:            'long',
    entry_price:     140,
    stop_loss:       133,
    account_balance: 2000,
    risk_pct:        1,
    leverage:        3,
    funding_rate:    0.0003,
  }, process.env.TC_API_KEY);

  console.log('\nSOL gate:', gate.approved ? 'GO' : `NO-GO (${gate.reason})`);
  console.log('Size:', gate.size, 'SOL | Liq:', gate.liqPrice);
}

main().catch(console.error);

# TradingCalc plugin for Claude

Exact trading math for Claude, from a remote MCP server with 75 deterministic tools. Instead of
estimating a number, Claude calls a calculator and reports the result: the same inputs always give the
same outputs.

## What you get

- **Options:** Black-Scholes price and Greeks, payoff and breakeven, covered call and protective put,
  straddle and strangle, implied volatility, and a live check against a real Deribit option.
- **Forex:** position size from a risk amount and a stop, pip value, margin level and margin required,
  swap cost, currency conversion and pair correlation, with live account-currency conversion.
- **Risk and statistics:** VaR and CVaR, Sharpe ratio with the Probabilistic and Deflated variants,
  Kelly growth-security frontier, GARCH, risk parity, Hurst exponent, cointegration and a portfolio
  tearsheet.
- **Crypto futures:** PnL, liquidation price, breakeven, position sizing, funding cost and a full
  pre-trade check across 17 exchanges, including coin-margined (inverse) contracts.
- Also on-chain token and wallet checks and prediction-market odds.

The plugin bundles one skill that tells Claude when to use each tool, and the connection to the
server at `https://tradingcalc.io/api/mcp`.

## Install

Add the plugin from the Claude plugin directory once it is listed there. No account or API key is
needed for normal use. To use only the tools without the plugin, add the remote MCP server
`https://tradingcalc.io/api/mcp` as a custom connector.

## Data handling

- The plugin sends only the arguments of each tool call (for example a price, a size, a leverage or a
  return series) to `tradingcalc.io` over HTTPS, and receives the computed result.
- It asks for no personal data and no credentials, and it does not read files or your environment.
- Some tools fetch public data on the server side: exchange prices, FX rates (TrueFX, frankfurter.app),
  Deribit instruments, prediction-market venue APIs (Kalshi, Polymarket, Limitless, Myriad, ADI
  Predictstreet) and, for the on-chain tools, Jupiter quotes and address-risk providers (GoPlus, Webacy,
  ScamSniffer's public list). Only the instrument, token or wallet identifier you give for that call is
  passed on to those sources, never anything else you have typed.
- Every tool response is signed with ECDSA P-256, so you can verify offline that a result was not
  altered. The public key is available from the `system.pubkey` tool.

## Limits

Anonymous use is limited to 100 calls per day per IP. A free API key, issued on request by email
(`s@tradingcalc.io`), raises that to 200 calls per day.

## Verification and reference

- Live verification of the 12 core calculators against the canonical test vectors: https://tradingcalc.io/verify
- Tool reference and request examples: https://docs.tradingcalc.io/api
- Source and issues: https://github.com/SKalinin909/tradingcalc-mcp

## License

MIT. See `LICENSE`.

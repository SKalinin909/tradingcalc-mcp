"""
Check TradingCalc's Black-Scholes and implied-volatility tools against QuantLib.

    pip install QuantLib
    python examples/quantlib-check.py [--cases 30] [--seed 20261018]

Draws random European options from a fixed seed, prices each with QuantLib's AnalyticEuropeanEngine
(Actual/365 fixed, flat continuously compounded rate, no dividend yield), calls the live endpoint
https://tradingcalc.io/api/mcp (tools workflow.run_black_scholes and workflow.run_implied_volatility)
with the same inputs and prints the largest difference per output. The default 30 cases use 60 calls,
inside the 100 calls per day an anonymous caller gets.

Unit mapping: QuantLib vega and rho are per 1.00, ours per 1 percentage point; QuantLib theta is per
year, ours per calendar day. The implied-volatility tool is given QuantLib's call price, never ours.
"""
import argparse
import json
import math
import random
import urllib.request

import QuantLib as ql

ENDPOINT = "https://tradingcalc.io/api/mcp"


def call_tool(name, arguments, ident):
    body = json.dumps({"jsonrpc": "2.0", "id": ident, "method": "tools/call",
                       "params": {"name": name, "arguments": arguments}}).encode()
    req = urllib.request.Request(ENDPOINT, body, {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "User-Agent": "tradingcalc-quantlib-check/1.0",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read())
    result = payload["result"]
    if result.get("isError"):
        raise RuntimeError(result["content"][0]["text"])
    return json.loads(result["content"][0]["text"])


def make_cases(n, seed):
    rng = random.Random(seed)
    cases = []
    while len(cases) < n:
        spot = math.exp(rng.uniform(math.log(100), math.log(120000)))
        c = {
            "spot": round(spot, 2),
            "strike": round(spot * math.exp(rng.uniform(math.log(0.7), math.log(1.3))), 2),
            "daysToExpiry": rng.randint(7, 365),
            "volatilityPct": round(rng.uniform(20, 150), 2),
            "riskFreeRatePct": round(rng.choice([0.0, rng.uniform(0, 8)]), 2),
        }
        cases.append(c)
    return cases


def quantlib_values(c):
    today = ql.Date(15, 6, 2026)
    ql.Settings.instance().evaluationDate = today
    dc, cal = ql.Actual365Fixed(), ql.NullCalendar()
    process = ql.BlackScholesMertonProcess(
        ql.QuoteHandle(ql.SimpleQuote(c["spot"])),
        ql.YieldTermStructureHandle(ql.FlatForward(today, 0.0, dc)),
        ql.YieldTermStructureHandle(ql.FlatForward(today, c["riskFreeRatePct"] / 100, dc)),
        ql.BlackVolTermStructureHandle(ql.BlackConstantVol(today, cal, c["volatilityPct"] / 100, dc)),
    )
    out = {}
    for kind, side in (("call", ql.Option.Call), ("put", ql.Option.Put)):
        opt = ql.VanillaOption(ql.PlainVanillaPayoff(side, c["strike"]), ql.EuropeanExercise(today + c["daysToExpiry"]))
        opt.setPricingEngine(ql.AnalyticEuropeanEngine(process))
        out[kind] = {"price": opt.NPV(), "delta": opt.delta(), "gamma": opt.gamma(),
                     "vega": opt.vega() / 100, "theta": opt.theta() / 365, "rho": opt.rho() / 100}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", type=int, default=30)
    ap.add_argument("--seed", type=int, default=20261018)
    args = ap.parse_args()

    pairs = [
        ("call price", "callPriceUsd", "call", "price"), ("put price", "putPriceUsd", "put", "price"),
        ("delta call", "deltaCall", "call", "delta"), ("delta put", "deltaPut", "put", "delta"),
        ("gamma", "gamma", "call", "gamma"), ("vega per 1pt", "vegaPerPct", "call", "vega"),
        ("theta call per day", "thetaCallPerDay", "call", "theta"), ("theta put per day", "thetaPutPerDay", "put", "theta"),
        ("rho call per 1pt", "rhoCallPerPct", "call", "rho"), ("rho put per 1pt", "rhoPutPerPct", "put", "rho"),
    ]
    worst = {label: 0.0 for label, *_ in pairs}
    worst_iv = 0.0
    for i, c in enumerate(make_cases(args.cases, args.seed)):
        q = quantlib_values(c)
        ours = call_tool("workflow.run_black_scholes", c, 2 * i)
        for label, key, kind, qkey in pairs:
            worst[label] = max(worst[label], abs(ours[key] - q[kind][qkey]))
        iv = call_tool("workflow.run_implied_volatility", {
            "optionType": "call", "spot": c["spot"], "strike": c["strike"], "daysToExpiry": c["daysToExpiry"],
            "riskFreeRatePct": c["riskFreeRatePct"], "targetPriceUsd": q["call"]["price"]}, 2 * i + 1)
        worst_iv = max(worst_iv, abs(iv["impliedVolatilityPct"] - c["volatilityPct"]))

    print(f"QuantLib {ql.__version__} against {ENDPOINT}, {args.cases} cases, seed {args.seed}")
    print(f"{'output':22} {'max abs diff':>14}")
    for label, value in worst.items():
        print(f"{label:22} {value:14.3e}")
    print(f"{'implied vol (points)':22} {worst_iv:14.3e}")


if __name__ == "__main__":
    main()

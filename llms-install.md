# Installing TradingCalc MCP in Cline

TradingCalc is a remote MCP server (Streamable HTTP). There is nothing to build or install locally, no API key and no environment variables.

1. Open the MCP Servers panel in Cline and choose Configure, which opens `cline_mcp_settings.json`.
2. Add this entry under `mcpServers`:

```json
{
  "mcpServers": {
    "tradingcalc": {
      "type": "streamableHttp",
      "url": "https://tradingcalc.io/api/mcp"
    }
  }
}
```

`type` must be `streamableHttp`. Without it Cline treats the URL as the legacy SSE transport and the connection fails.

3. Check the connection: the server should list 90 tools. A quick test is calling `system.verify`, which returns `status: pass`.

Anonymous use is limited to 100 calls a day; a free API key raises it to 200 and goes in a header: `"headers": { "Authorization": "Bearer <key>" }`. Details: https://docs.tradingcalc.io/api

Every tool result carries an ECDSA P-256 signature; the live test vectors are at https://tradingcalc.io/verify.

// Regenerates the "tools" array of lhm.plugin.json from the live tools/list: node scripts/build-manifest.mjs
// Never edit that array by hand. Afterwards: bump "version", update the tool count and names in "description",
// then run node scripts/check-counts.mjs (it must exit 0).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = process.env.TRADINGCALC_MCP_URL || 'https://tradingcalc.io/api/mcp';
const FILE = join(ROOT, 'lhm.plugin.json');

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
});
if (!res.ok) { console.error(`tools/list: HTTP ${res.status}`); process.exit(2); }
const text = await res.text();
const body = text.trimStart().startsWith('{') ? text : text.split('\n').find((l) => l.startsWith('data:'))?.slice(5);
const tools = JSON.parse(body).result.tools;
if (!Array.isArray(tools) || tools.length === 0) { console.error('empty tools/list'); process.exit(2); }

const manifest = JSON.parse(readFileSync(FILE, 'utf8'));
manifest.tools = tools.map((t) => ({
  name: t.name,
  title: t.title ?? t.annotations?.title ?? t.name,
  description: t.description,
  inputSchema: t.inputSchema,
  annotations: t.annotations,
}));
writeFileSync(FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${tools.length} tools to lhm.plugin.json`);

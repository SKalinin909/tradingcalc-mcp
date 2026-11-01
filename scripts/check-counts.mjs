// Run before every release: node scripts/check-counts.mjs
// Compares what this repo states (tool count, vector count, the LobeHub tools array) with the live server,
// and fails on any count in catalog metadata (NO_COUNT_FILES below).
// Optional TRADINGCALC_API_KEY lifts the anonymous 100/day limit.
// Exit 0 when everything agrees, 1 on any difference, 2 when the server could not be read.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = process.env.TRADINGCALC_MCP_URL || 'https://tradingcalc.io/api/mcp';
// Files that may state a count; each count must equal the live server.
const COUNT_FILES = ['README.md', 'SKILL.md', 'llms-install.md', 'lhm.plugin.json'];
// Catalog metadata: no tool, vector or exchange count at all (owner decision 2026-11-01, S0357/S0358).
// A number there goes stale at every new tool and every edit is a new catalog review.
const NO_COUNT_FILES = [
  'server.json', 'package.json', 'gemini-extension.json',
  'plugin/README.md', 'plugin/skills/tradingcalc/SKILL.md', 'plugin/.claude-plugin/plugin.json',
];

async function rpc(method, params) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json', accept: 'application/json, text/event-stream',
      ...(process.env.TRADINGCALC_API_KEY ? { authorization: `Bearer ${process.env.TRADINGCALC_API_KEY}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
  const text = await res.text();
  const body = text.trimStart().startsWith('{') ? text : text.split('\n').find((l) => l.startsWith('data:'))?.slice(5);
  if (!body) throw new Error(`${method}: empty reply`);
  return JSON.parse(body).result;
}

let tools, verify;
try {
  tools = (await rpc('tools/list')).tools;
  const call = await rpc('tools/call', { name: 'system.verify', arguments: {} });
  verify = JSON.parse(call.content[0].text);
} catch (e) {
  console.error(`could not read the live server: ${e.message}`);
  process.exit(2);
}

const problems = [];
const toolCount = tools.length;
const vectorCount = verify.total;
if (verify.status !== 'pass') problems.push(`system.verify status is ${verify.status}`);

for (const file of COUNT_FILES) {
  let text;
  try { text = readFileSync(join(ROOT, file), 'utf8'); } catch { problems.push(`${file}: file not found`); continue; }
  for (const m of text.matchAll(/\b(\d{2,3}) (?:MCP |verified |canonical |deterministic )?tools\b/g)) {
    if (Number(m[1]) !== toolCount) problems.push(`${file}: "${m[0]}" but the live server has ${toolCount} tools`);
  }
  for (const m of text.matchAll(/^#+ (?:Tools|What it covers) \((\d{2,3})\b/gm)) {
    if (Number(m[1]) !== toolCount) problems.push(`${file}: heading "${m[0]}" but the live server has ${toolCount} tools`);
  }
  for (const m of text.matchAll(/\b(\d{2,3}) (?:canonical |test |verified )*(?:test )?vectors\b/g)) {
    if (Number(m[1]) !== vectorCount) problems.push(`${file}: "${m[0]}" but system.verify runs ${vectorCount} vectors`);
  }
}

for (const file of NO_COUNT_FILES) {
  let text;
  try { text = readFileSync(join(ROOT, file), 'utf8'); } catch { problems.push(`${file}: file not found`); continue; }
  for (const m of text.matchAll(/\b\d[\d,]*\+?(?:-| )(?:[a-z-]+ ){0,3}?(?:tools?|vectors?|exchanges?|calculators?|workflows?|domains?)\b/gi)) {
    problems.push(`${file}: "${m[0]}" - catalog metadata must not state a count`);
  }
}

// The MCP registry rejects a server.json description longer than 100 characters (HTTP 422).
const registryDesc = JSON.parse(readFileSync(join(ROOT, 'server.json'), 'utf8')).description;
if (registryDesc.length > 100) problems.push(`server.json: description is ${registryDesc.length} characters, the registry allows 100`);

const manifest = JSON.parse(readFileSync(join(ROOT, 'lhm.plugin.json'), 'utf8'));
const liveByName = new Map(tools.map((t) => [t.name, t]));
for (const t of manifest.tools) {
  const l = liveByName.get(t.name);
  if (!l) { problems.push(`lhm.plugin.json: ${t.name} is not on the live server`); continue; }
  const what = [];
  if (t.description !== l.description) what.push('description');
  if (JSON.stringify(t.inputSchema) !== JSON.stringify(l.inputSchema)) what.push('inputSchema');
  if (JSON.stringify(t.annotations) !== JSON.stringify(l.annotations)) what.push('annotations');
  if (what.length) problems.push(`lhm.plugin.json: ${t.name} differs from live tools/list (${what.join(', ')})`);
}
for (const l of tools) if (!manifest.tools.some((t) => t.name === l.name)) problems.push(`lhm.plugin.json: live tool ${l.name} is missing`);

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} difference(s). Live: ${toolCount} tools, ${vectorCount} vectors.`);
  process.exit(1);
}
console.log(`ok: ${toolCount} tools, ${vectorCount} vectors, manifest matches live tools/list`);

// Run before every release: node scripts/check-counts.mjs
// Compares what this repo states (tool count, vector count, the LobeHub tools array) with the live server.
// Exit 0 when everything agrees, 1 on any difference, 2 when the server could not be read.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = process.env.TRADINGCALC_MCP_URL || 'https://tradingcalc.io/api/mcp';
const COUNT_FILES = [
  'README.md', 'SKILL.md', 'server.json', 'package.json', 'gemini-extension.json', 'lhm.plugin.json',
  'plugin/README.md', 'plugin/skills/tradingcalc/SKILL.md', 'plugin/.claude-plugin/plugin.json',
];

async function rpc(method, params) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
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
  try { text = readFileSync(join(ROOT, file), 'utf8'); } catch { continue; }
  for (const m of text.matchAll(/\b(\d{2,3}) (?:MCP |verified |canonical |deterministic )?tools\b/g)) {
    if (Number(m[1]) !== toolCount) problems.push(`${file}: "${m[0]}" but the live server has ${toolCount} tools`);
  }
  for (const m of text.matchAll(/\b(\d{2,3}) (?:canonical |test |verified )*(?:test )?vectors\b/g)) {
    if (Number(m[1]) !== vectorCount) problems.push(`${file}: "${m[0]}" but system.verify runs ${vectorCount} vectors`);
  }
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'lhm.plugin.json'), 'utf8'));
const liveByName = new Map(tools.map((t) => [t.name, t]));
for (const t of manifest.tools) {
  const l = liveByName.get(t.name);
  if (!l) { problems.push(`lhm.plugin.json: ${t.name} is not on the live server`); continue; }
  const what = [];
  if (t.description !== l.description) what.push('description');
  if (JSON.stringify(t.inputSchema) !== JSON.stringify(l.inputSchema)) what.push('inputSchema');
  if (what.length) problems.push(`lhm.plugin.json: ${t.name} differs from live tools/list (${what.join(', ')})`);
}
for (const l of tools) if (!manifest.tools.some((t) => t.name === l.name)) problems.push(`lhm.plugin.json: live tool ${l.name} is missing`);

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} difference(s). Live: ${toolCount} tools, ${vectorCount} vectors.`);
  process.exit(1);
}
console.log(`ok: ${toolCount} tools, ${vectorCount} vectors, manifest matches live tools/list`);

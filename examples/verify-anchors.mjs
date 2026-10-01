#!/usr/bin/env node
/**
 * Standalone verifier for the TradingCalc daily anchor. No dependencies, Node 18+.
 *
 *   node verify-anchors.mjs [days=30] [rpcUrl]
 *
 * For each record it checks: (1) sha256 of the exact record text equals the stated hash,
 * (2) our ECDSA signature over it, (3) the Solana Memo on chain reads "tcalc1 {date} {hash}"
 * and the fee payer is the published wallet, (4) prevHash links to the day before.
 * Nothing here trusts the server beyond fetching bytes; every check is recomputed locally.
 */
import { createHash, createVerify } from 'node:crypto';

const BASE = 'https://tradingcalc.io';
const days = Number(process.argv[2] ?? 30);
const RPC = process.argv[3] ?? 'https://api.mainnet-beta.solana.com';

const getJson = async url => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
  return res.json();
};

const rpc = async (method, params) => {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
};

const { address, records, hashFormat } = await getJson(`${BASE}/api/anchors?limit=${Math.min(days, 100)}`);
const { publicKeyPem } = await getJson(`${BASE}/api/mcp/pubkey`);
console.log(`wallet ${address}\nhash   ${hashFormat}\n`);

// Oldest first, so each record's prevHash is the hash of the one before it.
const ordered = [...records].filter(r => r.status === 'finalized').sort((a, b) => a.date.localeCompare(b.date));
let failures = 0;
let prev = null;

for (const r of ordered) {
  const checks = {};

  const hash = createHash('sha256').update('tradingcalc-anchor-v1\n' + r.recordText).digest('hex');
  checks.hash = hash === r.hash;

  checks.signature = createVerify('SHA256')
    .update(`tradingcalc-mcp-v1\nsystem.anchor\n${r.signature.signedAt}\n${r.recordText}`)
    .verify(publicKeyPem, r.signature.signature, 'base64');

  try {
    const tx = await rpc('getTransaction', [
      r.txSignature,
      { encoding: 'jsonParsed', commitment: 'finalized', maxSupportedTransactionVersion: 0 },
    ]);
    const memoIx = tx?.transaction.message.instructions.find(i => i.program === 'spl-memo');
    const payer = tx?.transaction.message.accountKeys[0]?.pubkey;
    checks.memo = memoIx?.parsed === `tcalc1 ${r.date} ${hash}`;
    checks.payer = payer === address;
    checks.noError = tx?.meta?.err === null;
  } catch (e) {
    checks.chain = false;
    console.log(`  rpc error: ${e.message}`);
  }

  const parsed = JSON.parse(r.recordText);
  checks.date = parsed.date === r.date;
  if (prev) checks.link = parsed.prevHash === prev.hash && prev.date < r.date;
  else console.log(`  (first record in the window, prevHash ${parsed.prevHash ?? 'null'} not checked against a predecessor)`);

  const bad = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (bad.length) failures += 1;
  console.log(`${r.date}  ${bad.length ? 'FAIL ' + bad.join(',') : 'ok'}  ${hash.slice(0, 16)}...  ${r.explorerUrl}`);
  prev = { hash: r.hash, date: r.date };
}

console.log(`\n${ordered.length} records, ${failures} failed`);
process.exit(failures ? 1 : 0);

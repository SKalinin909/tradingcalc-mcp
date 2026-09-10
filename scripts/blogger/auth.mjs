// One-time OAuth authorization for the Blogger API (loopback flow, RFC 8252).
// Run: node scripts/blogger/auth.mjs
// Opens a browser for consent, catches the redirect on a local port, exchanges
// the code for tokens, and saves the refresh token to .blogger-token.json.

import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CLIENT_FILE = join(ROOT, '.blogger-oauth-client.json');
const TOKEN_FILE = join(ROOT, '.blogger-token.json');
const PORT = 9004;
const REDIRECT_URI = `http://127.0.0.1:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/blogger';

const { client_id, client_secret } = JSON.parse(readFileSync(CLIENT_FILE, 'utf8'));
if (!client_id || !client_secret) {
  console.error(`Fill in client_id/client_secret in ${CLIENT_FILE} first.`);
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', client_id);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

console.log('\nOpen this URL and approve access (should open automatically):\n');
console.log(authUrl.toString());
console.log(`\nWaiting for redirect on ${REDIRECT_URI} ...\n`);

const openCmd = process.platform === 'win32' ? `start "" "${authUrl}"` : process.platform === 'darwin' ? `open "${authUrl}"` : `xdg-open "${authUrl}"`;
exec(openCmd, () => {});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400).end('No code in callback.');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' }).end('<h1>Authorized.</h1>You can close this tab and return to the terminal.');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Token exchange failed:', tokens);
    process.exit(1);
  }
  if (!tokens.refresh_token) {
    console.error('No refresh_token returned. Revoke prior access at https://myaccount.google.com/permissions and re-run (prompt=consent should force a fresh one).');
    process.exit(1);
  }
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log(`Saved tokens to ${TOKEN_FILE}`);
  server.close();
  process.exit(0);
});

server.listen(PORT);

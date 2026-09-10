// Publish (or draft) a post to skalinin.blogspot.com via the Blogger API.
// Usage:
//   node scripts/blogger/publish.mjs --title "..." --file post.html [--publish]
// Without --publish, the post is created as a draft (default) — review/edit in
// the Blogger UI, then hit Publish there once it has the personal-voice pass.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CLIENT_FILE = join(ROOT, '.blogger-oauth-client.json');
const TOKEN_FILE = join(ROOT, '.blogger-token.json');
const BLOG_URL = 'https://skalinin.blogspot.com';

function parseArgs(argv) {
  const out = { publish: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--title') out.title = argv[++i];
    else if (argv[i] === '--file') out.file = argv[++i];
    else if (argv[i] === '--publish') out.publish = true;
  }
  return out;
}

const { title, file, publish } = parseArgs(process.argv.slice(2));
if (!title || !file) {
  console.error('Usage: node scripts/blogger/publish.mjs --title "..." --file post.html [--publish]');
  process.exit(1);
}

const { client_id, client_secret } = JSON.parse(readFileSync(CLIENT_FILE, 'utf8'));
let tokens = JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));

async function refreshAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id,
      client_secret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  tokens = { ...tokens, ...data };
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

async function apiFetch(url, options = {}) {
  let res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${tokens.access_token}` } });
  if (res.status === 401) {
    await refreshAccessToken();
    res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${tokens.access_token}` } });
  }
  return res;
}

const blogRes = await apiFetch(`https://www.googleapis.com/blogger/v3/blogs/byurl?url=${encodeURIComponent(BLOG_URL)}`);
const blog = await blogRes.json();
if (!blogRes.ok) {
  console.error('Failed to resolve blog:', blog);
  process.exit(1);
}

const content = readFileSync(file, 'utf8');
const postRes = await apiFetch(
  `https://www.googleapis.com/blogger/v3/blogs/${blog.id}/posts${publish ? '' : '?isDraft=true'}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  }
);
const post = await postRes.json();
if (!postRes.ok) {
  console.error('Publish failed:', post);
  process.exit(1);
}
console.log(`${publish ? 'Published' : 'Drafted'}: ${post.url ?? '(draft, no public URL yet)'}`);
console.log(`Edit in Blogger: https://www.blogger.com/blog/post/edit/${blog.id}/${post.id}`);

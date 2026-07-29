// Safely deploy theautomationsguide's "Blog Post Engine — TAG (v3)" workflow to
// the shared HGC n8n Cloud, WITHOUT clobbering its live credential bindings.
//
// The committed blog-post-engine.json carries placeholder credential ids
// (REPLACE_WITH_*). A naive PUT would overwrite the live Notion/Anthropic/GitHub
// credential bindings and break the engine (same footgun the retired
// restaurant-outreach project hit in its Session 5). So this script:
//   1. GETs the live workflow (matched by name),
//   2. reads the REAL credential ids off it, keyed by credential name,
//   3. bakes those ids into the local JSON,
//   4. ABORTS if any referenced credential name can't be resolved (no placeholder
//      is ever sent),
//   5. PUTs only name/nodes/connections/settings; activation is left untouched.
//
// Usage (needs N8N_API_URL + N8N_API_KEY in the env — any source works; they are
// often already present in the ambient shell). The shared HGC-instance key lives
// in ../growth-engine/.env (the old restaurant-outreach/.env was retired from the
// tree — 2026-07-29). Run from the TAG repo root:
//   node --env-file=../growth-engine/.env n8n/deploy-engine.mjs         # DRY (default)
//   node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply # actually push

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WF_FILE = join(HERE, 'blog-post-engine.json');
const WF_NAME = 'Blog Post Engine — TAG (v3)';
const ALLOWED = ['name', 'nodes', 'connections', 'settings'];
const APPLY = process.argv.includes('--apply');

const BASE = (process.env.N8N_API_URL || '').replace(/\/+$/, '');
const KEY = process.env.N8N_API_KEY;
if (!BASE || !KEY) { console.error('Missing N8N_API_URL / N8N_API_KEY in env.'); process.exit(1); }

async function api(method, path, body) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function findId(name) {
  let cursor = '';
  do {
    const q = cursor ? `?limit=250&cursor=${encodeURIComponent(cursor)}` : '?limit=250';
    const res = await api('GET', `/workflows${q}`);
    if (!res.ok) throw new Error(`List failed (${res.status}): ${JSON.stringify(res.json).slice(0, 300)}`);
    for (const w of res.json?.data || []) if (w.name === name) return w.id;
    cursor = res.json?.nextCursor || '';
  } while (cursor);
  return null;
}

function credMapFromLive(liveWf) {
  const map = {};
  for (const n of liveWf.nodes || []) {
    if (!n.credentials) continue;
    for (const slot of Object.values(n.credentials)) {
      if (slot?.name && slot?.id && !String(slot.id).startsWith('REPLACE_WITH')) map[slot.name] = slot.id;
    }
  }
  return map;
}

function bakeCreds(wf, map) {
  const unresolved = new Set();
  let rewritten = 0;
  for (const n of wf.nodes || []) {
    if (!n.credentials) continue;
    for (const slot of Object.values(n.credentials)) {
      if (!slot?.name) continue;
      if (map[slot.name]) { if (slot.id !== map[slot.name]) { slot.id = map[slot.name]; rewritten++; } }
      else unresolved.add(slot.name);
    }
  }
  return { rewritten, unresolved: [...unresolved] };
}

async function main() {
  console.log(`n8n deploy -> ${BASE}  ${APPLY ? '(APPLY)' : '(DRY RUN)'}\n`);
  const local = JSON.parse(readFileSync(WF_FILE, 'utf8'));
  if (local.name !== WF_NAME) { console.error(`Local name "${local.name}" != expected "${WF_NAME}". Abort.`); process.exit(1); }

  const id = await findId(WF_NAME);
  if (!id) { console.error(`Live workflow "${WF_NAME}" not found on the instance. Abort (refusing to create a duplicate).`); process.exit(1); }

  const liveRes = await api('GET', `/workflows/${id}`);
  if (!liveRes.ok) { console.error(`GET live failed (${liveRes.status}).`); process.exit(1); }
  const live = liveRes.json;

  const map = credMapFromLive(live);
  console.log('Live credential ids resolved:', Object.keys(map).join(', ') || '(none)');
  const { rewritten, unresolved } = bakeCreds(local, map);
  console.log(`Baked ${rewritten} credential id(s) into local nodes.`);

  // Resolve non-credential placeholders (e.g. the "Config" Set node's Notion DB
  // ids + Slack webhook) by copying the matching live node's parameters. The
  // committed JSON keeps these as REPLACE_WITH_* placeholders; the live workflow
  // is the source of truth. Only nodes that actually contain a placeholder are
  // touched, so the video-removal edits elsewhere are preserved.
  const liveByName = new Map((live.nodes || []).map((n) => [n.name, n]));
  const configResolved = [];
  for (const n of local.nodes || []) {
    if (!n.parameters || !JSON.stringify(n.parameters).includes('REPLACE_WITH')) continue;
    const lv = liveByName.get(n.name);
    if (!lv) continue; // no live match -> caught by the placeholder guard below
    n.parameters = lv.parameters;
    configResolved.push(n.name);
  }
  if (configResolved.length) console.log(`Resolved config from live for node(s): ${configResolved.join(', ')}`);

  if (unresolved.length) {
    console.error(`\nABORT: these credentials have no live id to map to: ${unresolved.join(', ')}`);
    console.error('Deploying would send a placeholder and break the live binding. Fix in the n8n UI first.');
    process.exit(1);
  }
  if (JSON.stringify(local).includes('REPLACE_WITH')) {
    console.error('\nABORT: a REPLACE_WITH placeholder still remains after baking. Not deploying.');
    process.exit(1);
  }

  const liveHasVideo = (live.nodes || []).some((n) => n.name === 'Save Video Script');
  console.log(`\nLive node count: ${live.nodes.length}  ->  new: ${local.nodes.length}`);
  console.log(`Live has "Save Video Script": ${liveHasVideo}  ->  new: ${local.nodes.some(n=>n.name==='Save Video Script')}`);
  console.log(`Live active state: ${live.active} (will NOT be changed)`);

  const body = {}; for (const k of ALLOWED) if (local[k] !== undefined) body[k] = local[k];
  if (!body.settings) body.settings = {};

  if (!APPLY) { console.log('\nDRY RUN complete. Re-run with --apply to push.'); return; }

  const put = await api('PUT', `/workflows/${id}`, body);
  if (!put.ok) { console.error(`\nPUT failed (${put.status}): ${JSON.stringify(put.json).slice(0, 400)}`); process.exit(1); }
  console.log('\n~ updated. Verifying...');

  const verify = await api('GET', `/workflows/${id}`);
  const v = verify.json;
  const ok = !v.nodes.some((n) => n.name === 'Save Video Script')
    && !JSON.stringify(v).includes('REPLACE_WITH')
    && v.nodes.length === local.nodes.length;
  console.log(`Verify: Save Video Script gone=${!v.nodes.some(n=>n.name==='Save Video Script')}, no placeholder=${!JSON.stringify(v).includes('REPLACE_WITH')}, node count=${v.nodes.length}, active=${v.active}`);
  console.log(ok ? '\n✓ Deploy verified.' : '\n! Verify mismatch — inspect in n8n UI.');
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error('\nFatal:', e.message || e); process.exit(1); });

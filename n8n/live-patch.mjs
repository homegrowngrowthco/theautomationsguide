// Shared helper for patching LIVE n8n workflows in place via the public API.
//
// Why live-first: several TAG workflows have no committed JSON (Ian Queue Reminder,
// Monday Scoreboard) and the committed ones carry REPLACE_WITH_* placeholders, so
// the live workflow is the only copy with real credential bindings and webhook URLs.
// Patching live nodes in place keeps every binding untouched.
//
// Every apply:
//   1. GETs the live workflow and writes a full backup to ~/.n8n-backups/ (OUTSIDE
//      the repo: live exports contain hard-coded Slack webhook URLs; this repo is public),
//   2. runs the caller's mutate(wf) on a deep copy,
//   3. PUTs name/nodes/connections + settings filtered to the keys the API accepts
//      (it rejects unknown settings keys, and sending a partial object can drop
//      errorWorkflow/timezone),
//   4. GET-verifies node count, credential bindings and active state are unchanged.
// Revert: node n8n/live-patch.mjs --restore <backup.json> [--apply]
// (n8n Cloud also keeps workflow version history in the UI.)

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.env.N8N_API_URL || '').replace(/\/+$/, '');
const KEY = process.env.N8N_API_KEY;

// From the live instance's /api/v1/openapi.yml (workflowSettings, additionalProperties:false).
const SETTINGS_KEYS = ['saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution',
  'executionTimeout', 'errorWorkflow', 'timezone', 'executionOrder', 'callerPolicy', 'callerIds', 'timeSavedMode',
  'timeSavedPerExecution', 'redactionPolicy', 'availableInMCP', 'customTelemetryTags', 'credentialResolverId'];

export async function api(method, path, body) {
  if (!BASE || !KEY) throw new Error('Missing N8N_API_URL / N8N_API_KEY in env.');
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return json;
}

const credFingerprint = (wf) => JSON.stringify(wf.nodes.filter((n) => n.credentials).map((n) => [n.name, n.credentials]).sort());

function putBody(wf) {
  const settings = {};
  for (const k of SETTINGS_KEYS) if (wf.settings?.[k] !== undefined) settings[k] = wf.settings[k];
  return { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings };
}

// mutate(wf) edits the copy in place and returns a list of human-readable changes ([] = no-op).
export async function patchLive(id, mutate, { apply = false, label = '' } = {}) {
  const live = await api('GET', `/workflows/${id}`);
  const next = structuredClone(live);
  const changes = mutate(next) || [];
  console.log(`\n## ${live.name} (${id})${label ? ' ' + label : ''}`);
  if (!changes.length) { console.log('  no changes (already patched)'); return { live, changed: false }; }
  for (const c of changes) console.log('  ~ ' + c);
  if (!apply) { console.log('  DRY RUN, not pushed'); return { live, next, changed: true }; }

  const dir = join(homedir(), '.n8n-backups');
  mkdirSync(dir, { recursive: true });
  const bak = join(dir, `${id}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(bak, JSON.stringify(live, null, 2));
  console.log('  backup: ' + bak);

  await api('PUT', `/workflows/${id}`, putBody(next));
  const v = await api('GET', `/workflows/${id}`);
  // Compare against the INTENDED state (next), so a deliberate credential/errorWorkflow change
  // passes while anything the API silently dropped or rebound still fails.
  const credsOk = credFingerprint(v) === credFingerprint(next);
  const ok = v.nodes.length === next.nodes.length && credsOk
    && v.active === live.active && (next.settings?.errorWorkflow || null) === (v.settings?.errorWorkflow || null);
  console.log(`  verify: nodes ${v.nodes.length}/${next.nodes.length}, creds as intended=${credsOk}, active=${v.active}, errorWorkflow=${v.settings?.errorWorkflow || '-'} -> ${ok ? 'OK' : 'MISMATCH'}`);
  if (!ok) throw new Error(`verify failed for ${id}; restore with: node n8n/live-patch.mjs --restore "${bak}" --apply`);
  return { live, verified: v, changed: true, backup: bak };
}

// Set top-level fields on named nodes in a committed JSON file WITHOUT re-serializing it
// (a JSON.stringify round-trip reflows every array and buries the real change in noise).
// Inserts `"key": value,` lines right after each node's `"name": "<node>",` line, then
// proves the edit by parsing the result and deep-comparing it to the object-level patch.
export function syncLocalFields(file, fieldsByNode) {
  let text = readFileSync(file, 'utf8');
  const expected = JSON.parse(text);
  const changed = [], missing = [];
  for (const [name, fields] of Object.entries(fieldsByNode)) {
    const node = expected.nodes.find((n) => n.name === name);
    if (!node) { missing.push(name); continue; }
    const todo = Object.entries(fields).filter(([k, v]) => node[k] !== v);
    if (!todo.length) continue;
    if (todo.some(([k]) => k in node)) throw new Error(`${file}: "${name}" already has a different ${todo.map(([k]) => k)}; edit by hand`);
    Object.assign(node, fields);
    const esc = JSON.stringify(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^([ \\t]*)"name": ${esc},(\\r?\\n)`, 'gm');
    const hits = [...text.matchAll(re)];
    if (hits.length !== 1) throw new Error(`${file}: expected 1 "name" line for "${name}", found ${hits.length}`);
    const [, indent, eol] = hits[0];
    const ins = todo.map(([k, v]) => `${indent}${JSON.stringify(k)}: ${JSON.stringify(v)},${eol}`).join('');
    const at = hits[0].index + hits[0][0].length;
    text = text.slice(0, at) + ins + text.slice(at);
    changed.push(name);
  }
  if (changed.length && !deepEqual(JSON.parse(text), expected)) {
    throw new Error(`${file}: text edit does not match the intended object; not writing`);
  }
  return { text, changed, missing };
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
}

// CLI: restore a backup taken by patchLive.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf('--restore');
  if (i < 0) { console.log('Usage: node n8n/live-patch.mjs --restore <backup.json> [--apply]'); process.exit(0); }
  const bak = JSON.parse(readFileSync(process.argv[i + 1], 'utf8'));
  await patchLive(bak.id, (wf) => { wf.nodes = bak.nodes; wf.connections = bak.connections; wf.settings = bak.settings; return [`restore from ${process.argv[i + 1]}`]; },
    { apply: process.argv.includes('--apply') });
}

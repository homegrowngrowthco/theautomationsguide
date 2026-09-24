// Array/object-tolerant social-field parser for blog-post-engine.json.
//
// Why: 37 of the 38 runs from 2026-08-26 to 2026-09-24 saved a diagnostic
// placeholder for the Twitter field (one also for LinkedIn) instead of a real
// draft. Root cause: Haiku sometimes returns `"twitter": [ "1/ ...", "2/ ..." ]`
// (a JSON array) instead of a single string, and the resilient parser's
// pickField() (added by update-engine-resilient-social-parser.mjs) only ever
// accepted `typeof v === 'string'`, so a well-formed array response was treated
// as "missing" and got the placeholder. The prompt asked for "one per line" but
// never said "as one string, not an array", so Haiku's own judgment about JSON
// shape varied run to run.
//
// Changes:
// 1. Parse Social Outputs: pickField() now accepts arrays (joined into one
//    string) and single-key-wrapped objects (e.g. {tweets: [...]}), in addition
//    to strings. Everything else about the parser is unchanged: placeholder
//    diagnostics for genuinely missing fields, the deterministic post-URL
//    guarantee, and the 1900-char Notion block splitting.
// 2. Generate Social Outputs: prompt body gets one explicit line under the JSON
//    schema stating both values must be plain strings, and "Hard rules across
//    all three" (stale wording from when there was a third output) becomes
//    "Hard rules for both".
//
// Idempotent: re-running on an already-updated JSON is a no-op.
// After running: node --env-file=../growth-engine/.env n8n/deploy-engine.mjs [--apply]

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);

// ---- 1. Parse Social Outputs: array/object-tolerant pickField -------------
const pso = find('Parse Social Outputs');
const OLD_PICKFIELD = `function pickField(obj, names) {
  for (const n of names) {
    const v = obj[n];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

const fields = {
  twitter: pickField(parsed, ['twitter', 'twitter_thread', 'tweet', 'tweets', 'x', 'x_thread']),
  linkedin: pickField(parsed, ['linkedin', 'linkedin_post', 'li_post']),
};`;

const NEW_PICKFIELD = `function coerceField(v, joinWith) {
  if (typeof v === 'string' && v.trim().length > 0) return v;
  if (Array.isArray(v) && v.length > 0) {
    const strs = v
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .filter((s) => s.trim().length > 0);
    return strs.length > 0 ? strs.join(joinWith) : null;
  }
  if (v && typeof v === 'object') {
    const inner = v.tweets || v.thread || v.items;
    if (Array.isArray(inner)) return coerceField(inner, joinWith);
  }
  if (v !== undefined && v !== null && v !== '') {
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  }
  return null;
}

function pickField(obj, names, joinWith) {
  for (const n of names) {
    const coerced = coerceField(obj[n], joinWith);
    if (coerced) return coerced;
  }
  return null;
}

const fields = {
  twitter: pickField(parsed, ['twitter', 'twitter_thread', 'tweet', 'tweets', 'x', 'x_thread'], '\\n'),
  linkedin: pickField(parsed, ['linkedin', 'linkedin_post', 'li_post'], '\\n\\n'),
};`;

if (!pso.parameters.jsCode.includes('coerceField')) {
  if (!pso.parameters.jsCode.includes(OLD_PICKFIELD)) {
    throw new Error('Parse Social Outputs jsCode did not match the expected pre-patch text. Aborting without writing.');
  }
  pso.parameters.jsCode = pso.parameters.jsCode.replace(OLD_PICKFIELD, NEW_PICKFIELD);
}

// ---- 2. Generate Social Outputs: prompt clarifies string-only + rename ----
const gso = find('Generate Social Outputs');
const OLD_SCHEMA_TAIL = `}\n\nHard rules across all three:`;
const NEW_SCHEMA_TAIL = `}\n\nBoth values must be plain JSON strings, never arrays or nested objects.\n\nHard rules for both:`;

if (!gso.parameters.body.includes('Hard rules for both')) {
  if (!gso.parameters.body.includes(OLD_SCHEMA_TAIL)) {
    throw new Error('Generate Social Outputs body did not match the expected pre-patch text. Aborting without writing.');
  }
  gso.parameters.body = gso.parameters.body.replace(OLD_SCHEMA_TAIL, NEW_SCHEMA_TAIL);
}

// ---- Write back -------------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('Array/object-tolerant social-field parser updates applied (or already present).');

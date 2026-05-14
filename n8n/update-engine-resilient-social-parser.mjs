// Resilient social-parser updater for blog-post-engine.json.
//
// Why: 2026-05-14 run failed at Parse Social Outputs with "missing or empty
// field: twitter". Haiku occasionally drops a field, renames it (tweet vs
// twitter, video_script vs video), or gets truncated mid-JSON. Social drafts
// are secondary to the blog PR itself, so a flaky social response should not
// fail the whole workflow.
//
// Changes:
// 1. Generate Social Outputs: max_tokens 2048 -> 4096 (headroom against
//    truncation; Haiku output cost is ~$5/Mtok so worst-case extra is ~$0.005).
// 2. Parse Social Outputs: replaced the throw-on-missing logic with a
//    field-name-variant lookup plus a diagnostic placeholder that includes
//    Haiku's actual top-level keys and the raw response sample. Missing
//    fields no longer fail the run; they land in Notion as a clearly-marked
//    placeholder so Ian can regenerate manually.
//
// Idempotent: re-running on an already-updated JSON is a no-op.
// After running: re-import n8n/blog-post-engine.json into n8n Cloud.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);

// ---- 1. Generate Social Outputs: bump max_tokens -----------------------
const gso = find('Generate Social Outputs');
if (gso.parameters.body.includes('max_tokens: 2048')) {
  gso.parameters.body = gso.parameters.body.replace('max_tokens: 2048', 'max_tokens: 4096');
}

// ---- 2. Parse Social Outputs: resilient parser -------------------------
const newJsCode = `// Parse the Haiku JSON response and expose flat fields for the 3 Save nodes.
// Defensive: try common field-name variants, and if a field is still missing
// save a diagnostic placeholder so the workflow completes and Ian can see in
// Notion what Haiku actually returned. Social drafts are secondary to the
// blog PR itself, never block the workflow on a flaky Haiku response.
const response = $input.first().json;
const carry = $('Carry PR Info').first().json;

if (!response.content || !Array.isArray(response.content) || !response.content[0]?.text) {
  throw new Error('Generate Social Outputs returned malformed response: ' + JSON.stringify(response).substring(0, 500));
}

const raw = response.content[0].text.trim();
const jsonMatch = raw.match(/\\{[\\s\\S]*\\}/);
if (!jsonMatch) {
  throw new Error('Could not find JSON in social outputs response. Raw: ' + raw.substring(0, 500));
}

let parsed;
try {
  parsed = JSON.parse(jsonMatch[0]);
} catch (err) {
  throw new Error('Social outputs JSON parse failed: ' + err.message + '. Raw: ' + jsonMatch[0].substring(0, 500));
}

function pickField(obj, names) {
  for (const n of names) {
    const v = obj[n];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

const fields = {
  twitter: pickField(parsed, ['twitter', 'twitter_thread', 'tweet', 'tweets', 'x', 'x_thread']),
  video: pickField(parsed, ['video', 'video_script', 'short_form', 'tiktok', 'reel']),
  linkedin: pickField(parsed, ['linkedin', 'linkedin_post', 'li_post']),
};

const stopReason = response.stop_reason || 'unknown';
const truncatedNote = stopReason === 'max_tokens' ? ' (Haiku response truncated by max_tokens)' : '';
const keys = Object.keys(parsed).join(', ') || '(none)';
const sample = jsonMatch[0].substring(0, 300);

for (const f of ['twitter', 'video', 'linkedin']) {
  if (!fields[f]) {
    fields[f] = '[Generation incomplete' + truncatedNote + '. Missing field: ' + f + '. Haiku returned keys: ' + keys + '. Regenerate manually. Raw sample: ' + sample + ']';
  }
}

return [{ json: { ...carry, ...fields } }];`;

const pso = find('Parse Social Outputs');
if (!pso.parameters.jsCode.includes('pickField')) {
  pso.parameters.jsCode = newJsCode;
}

// ---- Write back ---------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('Resilient social-parser updates applied (or already present).');

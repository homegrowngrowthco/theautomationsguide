// One-shot, idempotent updater: remove short-form VIDEO SCRIPT generation from
// the Blog Post Engine. Twitter thread + LinkedIn post social outputs stay.
//
// What it changes in blog-post-engine.json:
//   1. Deletes the "Save Video Script" node.
//   2. Removes the Parse Social Outputs -> Save Video Script connection
//      (and any stray "Save Video Script" connection source key).
//   3. Generate Social Outputs prompt: "three social outputs" -> "two",
//      drops the video item from the list + the "video" JSON spec field.
//   4. Parse Social Outputs jsCode: drops the `video` pickField + the video
//      entry in the missing-field backfill loop.
//   5. Slack Notification copy: drops "+ video script" from the queued line.
//
// Same idempotent pattern as update-engine-v5.mjs. After running, RE-IMPORT
// blog-post-engine.json into n8n Cloud. No new credentials.
//
//   node n8n/remove-video-script-generation.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('./blog-post-engine.json', import.meta.url);
const wf = JSON.parse(readFileSync(path, 'utf8'));

const changes = [];
function expect(cond, msg) {
  if (!cond) throw new Error('Assertion failed: ' + msg);
}

// --- 1. Remove the Save Video Script node -----------------------------------
const beforeNodes = wf.nodes.length;
wf.nodes = wf.nodes.filter((n) => n.name !== 'Save Video Script');
if (wf.nodes.length < beforeNodes) changes.push('removed Save Video Script node');

// --- 2. Remove connections to/from Save Video Script ------------------------
delete wf.connections['Save Video Script'];
for (const src of Object.keys(wf.connections)) {
  const main = wf.connections[src].main;
  if (!Array.isArray(main)) continue;
  wf.connections[src].main = main.map((branch) => {
    if (!Array.isArray(branch)) return branch;
    const filtered = branch.filter((c) => c.node !== 'Save Video Script');
    if (filtered.length !== branch.length) changes.push(`removed ${src} -> Save Video Script connection`);
    return filtered;
  });
}

// --- 3. Generate Social Outputs prompt --------------------------------------
const gen = wf.nodes.find((n) => n.name === 'Generate Social Outputs');
expect(gen, 'Generate Social Outputs node present');
const genBefore = gen.parameters.body;

gen.parameters.body = gen.parameters.body
  .replace(
    'Generate three social outputs from the blog post below — Twitter thread, short-form video script, LinkedIn post —',
    'Generate two social outputs from the blog post below — Twitter thread, LinkedIn post —'
  )
  .replace(
    '\n  "video": "45-60 second short-form video script, 120-150 words total. Use these labels on their own lines: [HOOK], [POINT 1], [POINT 2], [POINT 3], [CTA]. Direct address. No narrator stage directions.",',
    ''
  );

if (gen.parameters.body !== genBefore) changes.push('stripped video from Generate Social Outputs prompt');
expect(!gen.parameters.body.includes('"video"'), 'no "video" field left in Generate Social Outputs prompt');
expect(!gen.parameters.body.includes('three social outputs'), 'prompt no longer says "three social outputs"');

// --- 4. Parse Social Outputs jsCode -----------------------------------------
const parse = wf.nodes.find((n) => n.name === 'Parse Social Outputs');
expect(parse, 'Parse Social Outputs node present');
const parseBefore = parse.parameters.jsCode;

parse.parameters.jsCode = parse.parameters.jsCode
  .replace("  video: pickField(parsed, ['video', 'video_script', 'short_form', 'tiktok', 'reel']),\n", '')
  .replace("for (const f of ['twitter', 'video', 'linkedin'])", "for (const f of ['twitter', 'linkedin'])");

if (parse.parameters.jsCode !== parseBefore) changes.push('stripped video from Parse Social Outputs jsCode');
expect(!parse.parameters.jsCode.includes("'video'"), "no 'video' references left in Parse Social Outputs");

// --- 5. Slack Notification copy ---------------------------------------------
const slack = wf.nodes.find((n) => n.name === 'Slack Notification');
expect(slack, 'Slack Notification node present');
const slackBefore = slack.parameters.body;
slack.parameters.body = slack.parameters.body.replace(
  'LinkedIn post + Twitter thread + video script are queued for review in Notion.',
  'LinkedIn post + Twitter thread are queued for review in Notion.'
);
if (slack.parameters.body !== slackBefore) changes.push('updated Slack Notification copy');

// --- write + report ---------------------------------------------------------
if (changes.length === 0) {
  console.log('No changes — engine already has video script generation removed (idempotent no-op).');
} else {
  writeFileSync(path, JSON.stringify(wf, null, 2) + '\n', 'utf8');
  console.log('Updated blog-post-engine.json:');
  for (const c of changes) console.log('  - ' + c);
  console.log('\nRe-import blog-post-engine.json into n8n Cloud. No new credentials.');
}

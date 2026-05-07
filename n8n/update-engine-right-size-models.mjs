// One-shot: collapses 3 social-output Anthropic calls (Twitter/Video/LinkedIn,
// each Sonnet 4.6 with the full post duplicated) into ONE Haiku 4.5 call that
// returns JSON, plus a Parse node that exposes the 3 fields. Also switches
// Topic Suggestor to Haiku and trims max_tokens caps.
//
// Run: node n8n/update-engine-right-size-models.mjs
// Backups written to *.pre-right-size.json.bak.

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

// ── 1. blog-post-engine.json ──────────────────────────────────────────────
const ENGINE = 'n8n/blog-post-engine.json';
const ENGINE_BAK = 'n8n/blog-post-engine.pre-right-size.json.bak';
copyFileSync(ENGINE, ENGINE_BAK);
console.log(`✓ Backup → ${ENGINE_BAK}`);

const engine = JSON.parse(readFileSync(ENGINE, 'utf8'));

// Trim Generate Draft + Humanize max_tokens (output never approaches 6144)
function trimMaxTokens(nodeName, oldVal, newVal) {
  const node = engine.nodes.find((n) => n.name === nodeName);
  if (!node) throw new Error(`Node ${nodeName} not found`);
  const before = node.parameters.body;
  node.parameters.body = before.replace(`max_tokens: ${oldVal}`, `max_tokens: ${newVal}`);
  if (node.parameters.body === before) {
    console.log(`! ${nodeName}: max_tokens=${oldVal} not found (already trimmed?)`);
  } else {
    console.log(`✓ ${nodeName}: max_tokens ${oldVal} → ${newVal}`);
  }
}
trimMaxTokens('Generate Draft', 6144, 4096);
trimMaxTokens('Humanize', 6144, 4096);

// ── 2. Collapse social outputs ────────────────────────────────────────────
const SOCIAL_GENERATE_NAMES = ['Generate Twitter Thread', 'Generate Video Script', 'Generate LinkedIn Post'];
const SOCIAL_SAVE_NAMES = ['Save Twitter Thread', 'Save Video Script', 'Save LinkedIn Post'];

// Capture the credential ID + http header config from one of the existing nodes
const sampleSocialNode = engine.nodes.find((n) => n.name === 'Generate Twitter Thread');
const anthropicCreds = sampleSocialNode.credentials;

// Remove the 3 social generate nodes
engine.nodes = engine.nodes.filter((n) => !SOCIAL_GENERATE_NAMES.includes(n.name));
console.log(`✓ Removed ${SOCIAL_GENERATE_NAMES.length} per-channel generate nodes`);

// Build the combined Generate Social Outputs node (Haiku 4.5, JSON output)
const COMBINED_PROMPT = `Generate three social outputs from the blog post below — Twitter thread, short-form video script, LinkedIn post — for a RevOps/GTM audience.

Output ONLY a JSON object. No surrounding prose. No markdown code fences.

{
  "twitter": "6-8 numbered tweets (1/, 2/, etc), one per line, max 260 chars each. Tweet 1 = hook (bold claim, contrarian take, or surprising stat). Tweets 2-6 = punchy specific insights. Tweet 7 = takeaway. Optional final tweet: 'Full post: ${'${siteBaseUrl}'}/blog/${'${slug}'}'. No hashtag spam. No 'thread' word.",
  "video": "45-60 second short-form video script, 120-150 words total. Use these labels on their own lines: [HOOK], [POINT 1], [POINT 2], [POINT 3], [CTA]. Direct address. No narrator stage directions.",
  "linkedin": "1200-1800 character LinkedIn post. Hook in first 210 chars (before the 'see more' fold). Line breaks every 1-2 sentences. 3-5 specific takeaways. Soft CTA at the end. Senior practitioner tone. No emojis. No 'thought-leader' clichés. Plain text — LinkedIn doesn't render markdown."
}

Hard rules across all three:
- Be specific. Reference real tool names, real numbers, real workflow steps.
- DELETE these words anywhere they appear: delve, crucial, game-changer, streamline, leverage (as a verb), robust, utilize, in conclusion, cutting-edge, seamlessly, dive into, at the end of the day, moving the needle, low-hanging fruit, in today's landscape, unlock the power.
- One concrete contrarian or experience-based claim per output.

POST_URL: ${'${siteBaseUrl}'}/blog/${'${slug}'}

BLOG POST:
${'${markdown}'}`;

// Build the body string n8n expects: ={{ JSON.stringify({ ... }) }}
// We use Haiku 4.5 here because all three outputs are structured text generation
// from a known input — exactly the task class Haiku handles well at 1/4 Sonnet cost.
const combinedBody = `={{ JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 2048, messages: [{ role: 'user', content: \`${COMBINED_PROMPT.replace(/\$\{siteBaseUrl\}/g, '${$json.siteBaseUrl}').replace(/\$\{slug\}/g, '${$json.slug}').replace(/\$\{markdown\}/g, '${$json.markdown}')}\` }] }) }}`;

const generateSocialNode = {
  parameters: {
    method: 'POST',
    url: 'https://api.anthropic.com/v1/messages',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'anthropic-version', value: '2023-06-01' },
        { name: 'content-type', value: 'application/json' },
      ],
    },
    sendBody: true,
    contentType: 'raw',
    rawContentType: 'application/json',
    body: combinedBody,
    options: { timeout: 90000 },
  },
  id: 'tag00001-0000-0000-0000-000000000020',
  name: 'Generate Social Outputs',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [3760, 600],
  credentials: anthropicCreds,
};

// Parse node — extracts JSON from the Anthropic response and exposes
// twitter / video / linkedin fields downstream.
const parseSocialNode = {
  parameters: {
    jsCode: `// Parse the Haiku JSON response and expose flat fields for the 3 Save nodes.
// Defensive: if Haiku returns prose around the JSON (rare but possible), extract
// the first top-level JSON object via regex before parsing.
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
  throw new Error('Social outputs JSON parse failed: ' + err.message + ' — raw: ' + jsonMatch[0].substring(0, 500));
}

// Validate the 3 expected fields exist
for (const f of ['twitter', 'video', 'linkedin']) {
  if (typeof parsed[f] !== 'string' || parsed[f].length === 0) {
    throw new Error(\`Social outputs missing or empty field: \${f}\`);
  }
}

return [{ json: { ...carry, twitter: parsed.twitter, video: parsed.video, linkedin: parsed.linkedin } }];`,
  },
  id: 'tag00001-0000-0000-0000-000000000021',
  name: 'Parse Social Outputs',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [3980, 600],
};

engine.nodes.push(generateSocialNode);
engine.nodes.push(parseSocialNode);
console.log('✓ Added Generate Social Outputs + Parse Social Outputs');

// ── 3. Update each Save node to read from $json.twitter / .video / .linkedin ──
function repointSave(saveName, fieldName) {
  const node = engine.nodes.find((n) => n.name === saveName);
  if (!node) throw new Error(`Save node ${saveName} not found`);
  const before = node.parameters.body;
  // The current body has $json.content[0].text — repoint to $json.<field>
  node.parameters.body = before.replace(/\$json\.content\[0\]\.text/g, `$json.${fieldName}`);
  if (node.parameters.body === before) {
    console.log(`! ${saveName}: $json.content[0].text not found (already repointed?)`);
  } else {
    console.log(`✓ ${saveName}: now reads $json.${fieldName}`);
  }
}
repointSave('Save Twitter Thread', 'twitter');
repointSave('Save Video Script', 'video');
repointSave('Save LinkedIn Post', 'linkedin');

// ── 4. Update connections graph ───────────────────────────────────────────
// Old: Carry PR Info → 3 social generate nodes (parallel branches)
//      Each social generate → its Save node
// New: Carry PR Info → Generate Social Outputs → Parse Social Outputs
//      Parse Social Outputs → 3 Save nodes (parallel)

// Remove old branches: Carry PR Info → 3 generate nodes
const carryConn = engine.connections['Carry PR Info'];
if (!carryConn?.main) throw new Error('Carry PR Info has no outbound connections');

// The first branch (main[0]) had the 3 social generates + Mark Topic In Review.
// Filter out the social generates while keeping Mark Topic In Review.
carryConn.main = carryConn.main.map((branch) =>
  (branch || []).filter((c) => !SOCIAL_GENERATE_NAMES.includes(c.node)),
);

// Add new connection: Carry PR Info → Generate Social Outputs (in addition to Mark Topic In Review)
if (!carryConn.main[0]) carryConn.main[0] = [];
carryConn.main[0].push({ node: 'Generate Social Outputs', type: 'main', index: 0 });

// Remove old: Generate X → Save X connections (the Generate X nodes are gone)
for (const name of SOCIAL_GENERATE_NAMES) {
  delete engine.connections[name];
}

// Add: Generate Social Outputs → Parse Social Outputs
engine.connections['Generate Social Outputs'] = {
  main: [[{ node: 'Parse Social Outputs', type: 'main', index: 0 }]],
};

// Add: Parse Social Outputs → 3 Save nodes (parallel)
engine.connections['Parse Social Outputs'] = {
  main: [
    [
      { node: 'Save Twitter Thread', type: 'main', index: 0 },
      { node: 'Save Video Script', type: 'main', index: 0 },
      { node: 'Save LinkedIn Post', type: 'main', index: 0 },
    ],
  ],
};

console.log('✓ Re-wired connection graph');

writeFileSync(ENGINE, JSON.stringify(engine, null, 2) + '\n');
console.log(`\n→ ${ENGINE} updated.`);

// ── 5. topic-suggestor.json — switch to Haiku 4.5 ────────────────────────
const SUGGESTOR = 'n8n/topic-suggestor.json';
const SUGGESTOR_BAK = 'n8n/topic-suggestor.pre-right-size.json.bak';
copyFileSync(SUGGESTOR, SUGGESTOR_BAK);
const sug = JSON.parse(readFileSync(SUGGESTOR, 'utf8'));
const generateNode = sug.nodes.find((n) => n.name === 'Generate Suggestions');
if (!generateNode) throw new Error('Generate Suggestions node not found in topic-suggestor');
const before = generateNode.parameters.body;
generateNode.parameters.body = before.replace(/claude-sonnet-4-6/g, 'claude-haiku-4-5');
if (generateNode.parameters.body === before) {
  console.log(`! topic-suggestor: model claude-sonnet-4-6 not found (already switched?)`);
} else {
  console.log(`✓ topic-suggestor: model claude-sonnet-4-6 → claude-haiku-4-5`);
}
writeFileSync(SUGGESTOR, JSON.stringify(sug, null, 2) + '\n');
console.log(`→ ${SUGGESTOR} updated.`);

console.log('\n✓ All right-size-models edits applied. Diff against backups to review.');

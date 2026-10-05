// Idempotent engine updater: stop the generator from inventing hands-on testing.
//
// Root cause (Session 103, 2026-10-05): the prompts themselves asked for it.
// Generate Draft's PERSONAL VOICE block listed "In my testing..." as a model phrase,
// the 2026-09-16 client-mentions fix (update-engine-client-mentions.mjs) added
// "in my testing..." and "when we ran this internally..." as the SAFE alternative to
// client anecdotes, and Humanize's marker-quota step told the editor to inject
// "In my testing..." / "We rebuilt this last quarter and found..." into any draft
// short on first-person markers. The tutorial/migration/pricing MyTake specs asked
// for claims "from running this in production" / "from experience", and Humanize's
// hard rules asked for "concrete numbers" with no source. Result: posts carrying a
// testing claim went from 13 of 134 (10%) before 9/17 to 13 of 34 (38%) after.
//
// This patch:
// 1. Generate Draft: swaps every testing/usage example phrase for opinion framing,
//    rewrites the MyTake specs as opinion, and adds a HANDS-ON CLAIMS hard rule.
// 2. Humanize: same swap in the marker-quota step, sources-only numbers, and a
//    HANDS-ON CLAIMS verify step.
// The deterministic backstop is qa/lint-content.mjs (HARD on new posts).
//
// Usage:  node n8n/update-engine-hands-on-claims.mjs --dry   (report only)
//         node n8n/update-engine-hands-on-claims.mjs         (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const DRY = process.argv.includes('--dry');
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);
const SENTINEL = 'HANDS-ON CLAIMS';

// Each pair is [exact current text, replacement]. Every anchor must match exactly once.
function applyPairs(nodeName, body, pairs) {
  for (const [from, to] of pairs) {
    const count = body.split(from).length - 1;
    if (count !== 1) {
      console.error(`${nodeName}: anchor found ${count}x (expected 1). Aborting, engine text may have drifted:\n  ${from.slice(0, 120)}`);
      process.exit(1);
    }
    body = body.replace(from, to);
  }
  return body;
}

// Guard for the n8n expression tokenizer (CLAUDE.md gotcha 2): inserted text must not
// carry backticks, template placeholders or doubled braces.
function tokenizerSafe(text) {
  return !/[`]|\$\{|\{\{|\}\}/.test(text);
}

// ---- 1. Generate Draft ---------------------------------------------------
const genRule = `HANDS-ON CLAIMS: hard rule (no invented testing):
- The engine cannot know which tools the author has actually used, so write every tool as researched, not tested. Never claim first-hand testing or use: no "in my testing", "I have tested", "I've tested", "I tested", "we tested", "hands-on testing", "after testing", "I've run this stack/migration/workflow", "I've used it to...", "I've deployed this", "I set up", "the campaigns I've run", "audits I've run", "a list I ran through X".
- Never present a number as your own measurement (hit rates, accuracy, speed, reply, bounce or open rates, time saved, lift). A figure must come from a cited source or the vendor's own docs or pricing page, or be an explicitly illustrative example ("say a 10-rep team sends 5,000 emails a month").
- Attribute instead: "per the vendor docs", "on paper", "the API reference says", "G2 reviewers report", or give your judgment: "I'd expect", "my read is", "the first thing I'd check".
- First-person voice stays for opinions, recommendations and general RevOps patterns ("I'd pick X if...", "I've seen teams get this wrong when...").

`;

const gen = find('Generate Draft');
if (!gen.parameters.body.includes(SENTINEL)) {
  gen.parameters.body = applyPairs('Generate Draft', gen.parameters.body, [
    ['- <MyTake>experience-based claim from running this in production</MyTake>',
      '- <MyTake>an opinionated claim about where this workflow breaks or what you would do differently (opinion, never a claim that you ran it)</MyTake>'],
    ['- <MyTake>experience-based take on whether the switch is worth it</MyTake>',
      '- <MyTake>a sharp opinion on whether the switch is worth it</MyTake>'],
    ['- <MyTake>where the pricing is fair vs. where it stings, from experience</MyTake>',
      '- <MyTake>where the pricing is fair vs. where it stings, argued from the published pricing</MyTake>'],
    ['- <MyTake>your contrarian/experiential angle</MyTake>',
      '- <MyTake>your contrarian angle</MyTake>'],
    ['- Contrarian or experience-based claim ONLY (not a summary, not a generic "I think...")',
      '- Contrarian or opinionated claim ONLY (not a summary, not a generic "I think...", never a claim that you tested or ran the tool)'],
    ['- Frame insights as lived experience: "I\'ve seen X fail when...", "When my last team tried Y...", "In my testing..."',
      '- Frame insights as a practitioner\'s judgment: "I\'d argue...", "My read is...", "The first thing I\'d check is...", "I\'ve seen teams get this wrong when..." (general RevOps patterns only, never a test or rollout of a specific tool, see HANDS-ON CLAIMS)'],
    ['Replace with "I\'d argue..." or "In my experience..."',
      'Replace with "I\'d argue..." or "My read is..."'],
    ['- Prefer non-client first-person framing instead: "I\'ve seen this fail when...", "in my testing...", "when we ran this internally...", "I\'d argue...".',
      '- Prefer non-client first-person framing instead: "I\'ve seen this fail when...", "my read is...", "I\'d argue...".'],
    ['EXTERNAL CITATIONS — required:', genRule + 'EXTERNAL CITATIONS — required:'],
  ]);
}

// ---- 2. Humanize ----------------------------------------------------------
const humVerify = `HANDS-ON CLAIMS verify: the author did not test or run the tools for this post. Find every sentence claiming first-hand testing or use ("in my testing", "I have tested", "I've tested", "we tested", "hands-on testing", "after testing", "I've run/used/deployed/set up/migrated X", "the campaigns, audits or lists I ran") and rewrite it: keep the underlying point but attribute it to the cited source or the vendor docs, or restate it as your opinion ("I'd expect", "my read is"). Delete any number presented as your own measurement unless a cited source supports it. Zero such claims may remain, including in FAQ answers, StatRow descriptions and MyTake.

`;

const hum = find('Humanize');
if (!hum.parameters.body.includes(SENTINEL)) {
  hum.parameters.body = applyPairs('Humanize', hum.parameters.body, [
    ['- Replace generic examples with specific tool names, real workflow steps, or concrete numbers',
      '- Replace generic examples with specific tool names, real workflow steps, or concrete numbers taken from the draft\'s cited sources or the vendor\'s docs (never invent a figure)'],
    ['instead of a contrarian/experiential claim, rewrite it as a sharp contrarian take',
      'instead of a contrarian claim, rewrite it as a sharp contrarian take (opinion, never a testing claim)'],
    ['(e.g. "I\'ve watched this stack fail when...", "We rebuilt this last quarter and found...", "In my testing..."). Do NOT reach for client-scale language to hit this count, see CLIENT MENTIONS verify below.',
      '(e.g. "I\'d argue...", "My read is...", "The first thing I\'d check is..."). Do NOT reach for client-scale language or a testing or usage claim to hit this count, see CLIENT MENTIONS verify and HANDS-ON CLAIMS verify below.'],
    ['CITATIONS verify —', humVerify + 'CITATIONS verify —'],
  ]);
}

// ---- Checks + write back ---------------------------------------------------------
for (const [name, text] of [['genRule', genRule], ['humVerify', humVerify]]) {
  if (!tokenizerSafe(text)) { console.error(`${name} is not tokenizer-safe (backtick, \${ or doubled brace). Aborting.`); process.exit(1); }
}
const leftovers = [];
for (const n of [gen, hum]) {
  for (const p of ['In my testing...', 'in my testing...', 'when we ran this internally', 'We rebuilt this last quarter', 'from running this in production', 'from experience</MyTake>']) {
    if (n.parameters.body.includes(p)) leftovers.push(`${n.name}: "${p}"`);
  }
  const b = n.parameters.body;
  console.log(`${n.name}: ${b.length} chars, sentinel=${b.includes(SENTINEL)}, braces {{=${(b.match(/\{\{/g) || []).length} }}=${(b.match(/\}\}/g) || []).length}`);
}
if (leftovers.length) { console.error('Example phrases still present:\n  ' + leftovers.join('\n  ')); process.exit(1); }

if (DRY) { console.log('DRY RUN: nothing written.'); process.exit(0); }
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('hands-on-claims updates applied (or already present).');

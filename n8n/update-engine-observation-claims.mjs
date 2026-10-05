// Idempotent engine updater: stop the generator from inventing observed results.
//
// Root cause (Session 104, 2026-10-05): the Session 103 hands-on fix
// (update-engine-hands-on-claims.mjs) kept "I've seen teams get this wrong when..." and
// "I've seen this fail when..." as the SAFE first-person phrases. Same gotcha as before
// (CLAUDE.md 11): example phrases get copied verbatim. 150 of 169 live posts carry an
// "I've seen / watched / helped / worked with / built" observation, and 105 of those
// sentences attach an invented figure ("I've watched teams cut CRM data entry time by
// 40 percent", "this exact mistake take out a $400 domain and three weeks of warm-up").
//
// This patch:
// 1. Generate Draft: drops the three "I've seen" example phrases for pattern framing and
//    adds an OBSERVED RESULTS hard rule (no figure attached to a first-person observation).
// 2. Humanize: an OBSERVED RESULTS verify step.
// Plain observations without a figure stay allowed (Ian's call, 2026-10-05).
// The deterministic backstop is qa/lint-content.mjs (OBSERVATION_FIGURE, WARN).
//
// Usage:  node n8n/update-engine-observation-claims.mjs --dry   (report only)
//         node n8n/update-engine-observation-claims.mjs         (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const DRY = process.argv.includes('--dry');
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);
const SENTINEL = 'OBSERVED RESULTS';

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

// Guard for the n8n expression tokenizer (CLAUDE.md gotcha 2).
function tokenizerSafe(text) {
  return !/[`]|\$\{|\{\{|\}\}/.test(text);
}

// ---- 1. Generate Draft ---------------------------------------------------
const genRule = `OBSERVED RESULTS: hard rule (no invented anecdotes):
- The engine has not watched any team, rollout or migration, so do not reach for "I've seen", "I've watched", "teams I've worked with" or "I've built this at..." framing. State a failure mode as a general pattern: "a common failure is...", "teams that skip X usually hit Y", "the usual trap here is...".
- Never attach a number to an anecdote: no percent changes, dollar losses, durations, counts or results presented as something that happened to a team. A figure must come from a cited source or the vendor's docs or pricing page, or be explicitly illustrative ("say a 10-rep team sends 5,000 emails a month").

`;

const gen = find('Generate Draft');
if (!gen.parameters.body.includes(SENTINEL)) {
  gen.parameters.body = applyPairs('Generate Draft', gen.parameters.body, [
    ['"The first thing I\'d check is...", "I\'ve seen teams get this wrong when..." (general RevOps patterns only, never a test or rollout of a specific tool, see HANDS-ON CLAIMS)',
      '"The first thing I\'d check is...", "The usual failure here is..." (opinion and general RevOps patterns only, never a test, rollout or observed result, see HANDS-ON CLAIMS and OBSERVED RESULTS)'],
    ['- Prefer non-client first-person framing instead: "I\'ve seen this fail when...", "my read is...", "I\'d argue...".',
      '- Prefer non-client framing instead: "my read is...", "I\'d argue...", "a common failure is...".'],
    ['- First-person voice stays for opinions, recommendations and general RevOps patterns ("I\'d pick X if...", "I\'ve seen teams get this wrong when...").\n\n',
      '- First-person voice stays for opinions, recommendations and general RevOps patterns ("I\'d pick X if...", "the usual trap here is...").\n\n' + genRule],
  ]);
}

// ---- 2. Humanize ----------------------------------------------------------
const humVerify = `OBSERVED RESULTS verify: the author did not watch any team, rollout or migration for this post. Find every sentence where a first-person observation ("I've seen", "I've watched", "I've helped", "teams I've worked with", "I've built this") carries a figure (a percent, dollar amount, duration, count or result) and rewrite it as a general pattern without the figure, or attribute the figure to a cited source. Do not add new "I've seen" sentences to meet the first-person count. Zero figure-carrying observations may remain, including in FAQ answers, StatRow descriptions and MyTake.

`;

const hum = find('Humanize');
if (!hum.parameters.body.includes(SENTINEL)) {
  hum.parameters.body = applyPairs('Humanize', hum.parameters.body, [
    ['CITATIONS verify —', humVerify + 'CITATIONS verify —'],
  ]);
}

// ---- Checks + write back ---------------------------------------------------------
for (const [name, text] of [['genRule', genRule], ['humVerify', humVerify]]) {
  if (!tokenizerSafe(text)) { console.error(`${name} is not tokenizer-safe (backtick, \${ or doubled brace). Aborting.`); process.exit(1); }
}
const leftovers = [];
for (const n of [gen, hum]) {
  for (const p of ['"I\'ve seen teams get this wrong when..."', '"I\'ve seen this fail when..."', '"I\'ve watched this stack fail when..."']) {
    if (n.parameters.body.includes(p)) leftovers.push(`${n.name}: ${p}`);
  }
  const b = n.parameters.body;
  console.log(`${n.name}: ${b.length} chars, sentinel=${b.includes(SENTINEL)}, braces {{=${(b.match(/\{\{/g) || []).length} }}=${(b.match(/\}\}/g) || []).length}`);
}
if (leftovers.length) { console.error('Example phrases still present:\n  ' + leftovers.join('\n  ')); process.exit(1); }

if (DRY) { console.log('DRY RUN: nothing written.'); process.exit(0); }
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('observation-claims updates applied (or already present).');

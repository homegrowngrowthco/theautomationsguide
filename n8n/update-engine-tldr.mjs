// Idempotent updater (same pattern as update-engine-*.mjs): switch the engine
// from an inline `<div class="quick-answer">` block to a frontmatter `tldr:`
// field, which BlogPostLayout renders as a bolded answer-first box at the very
// top of every post (GEO). Also updates the author voice-framing to the full
// name. Existing posts were backfilled separately (../backfill-tldr.mjs).
//
// Edits:
//   Generate Draft:
//     - frontmatter template gains a `tldr:` line (after description)
//     - the 3 inline quick-answer skeleton bullets are removed
//     - "QUICK ANSWER RULES" -> "TL;DR RULES" (point at the frontmatter field)
//     - "The author is Ian" -> "Ian Chamberland"
//   Humanize:
//     - preserve list keeps `tldr` intact, drops the quick-answer bullet
//     - "The author is Ian" -> "Ian Chamberland"
//
// Inserted text introduces NO backtick / `{{` / `}}` / `${` token (the prompt
// bodies are `={{ JSON.stringify({ ...template-literal... }) }}` expressions, so
// any of those would break n8n's tokenizer) and no em/en dashes. A before/after
// token-count self-check enforces this.
//
//   node n8n/update-engine-tldr.mjs            # writes blog-post-engine.json
// then deploy:
//   node --env-file=../restaurant-outreach/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const SENTINEL = 'tldr: "[one-sentence definitive answer';

const gd = wf.nodes.find((n) => n.name === 'Generate Draft');
const hum = wf.nodes.find((n) => n.name === 'Humanize');
if (!gd || !hum) throw new Error('Generate Draft / Humanize node not found.');

if (gd.parameters.body.includes(SENTINEL)) {
  console.log('Already patched (tldr rule present). No-op.');
  process.exit(0);
}

const tok = (s) => ({
  open: (s.match(/\{\{/g) || []).length,
  close: (s.match(/\}\}/g) || []).length,
  tick: (s.match(/`/g) || []).length,
  dollar: (s.match(/\$\{/g) || []).length,
});
const gdBefore = tok(gd.parameters.body);
const humBefore = tok(hum.parameters.body);

const mustReplace = (body, find, repl, label) => {
  if (!body.includes(find)) throw new Error(`Anchor not found (${label}): ${JSON.stringify(find.slice(0, 60))}`);
  return body.split(find).join(repl);
};

let g = gd.parameters.body;

// 1) Frontmatter template gains a tldr line, right after description.
g = mustReplace(
  g,
  'description: "[1-2 sentences, 140-160 chars, SEO meta]"\npubDate:',
  'description: "[1-2 sentences, 140-160 chars, SEO meta]"\ntldr: "[one-sentence definitive answer in plain language, no markdown links, no dashes]"\npubDate:',
  'GD frontmatter tldr',
);

// 2) Remove the 3 inline quick-answer skeleton bullets (COMPARISON + TUTORIAL + FRAMEWORK).
g = mustReplace(g, '\n- <div class="quick-answer"><strong>Quick answer:</strong> [TL;DR]</div>', '', 'GD COMPARISON quick-answer bullet');
const qa2 = '\n- <div class="quick-answer">...</div>';
const qa2count = g.split(qa2).length - 1;
if (qa2count !== 2) throw new Error(`Expected 2 TUTORIAL/FRAMEWORK quick-answer bullets, found ${qa2count}.`);
g = g.split(qa2).join('');

// 3) QUICK ANSWER RULES -> TL;DR RULES (point writers at the frontmatter field).
g = mustReplace(
  g,
  'QUICK ANSWER RULES:\n- Single sentence, plain language\n- Place immediately after the hook paragraph (or after PullQuote for opinion posts)\n- Exact pattern: <div class="quick-answer"><strong>Quick answer:</strong> [text].</div>',
  'TL;DR RULES:\n- Put a single-sentence, plain-language definitive answer in the frontmatter tldr field. It renders as a bolded answer box at the very top of the post.\n- Do NOT output an inline answer div in the body. The tldr frontmatter renders the answer at the top instead.\n- Plain text only inside tldr (no markdown links, no components, no dashes).',
  'GD QUICK ANSWER RULES',
);

// 4) Author voice-framing -> full name.
g = mustReplace(g, 'The author is Ian, founder', 'The author is Ian Chamberland, founder', 'GD author name');

gd.parameters.body = g;

let h = hum.parameters.body;
// 5) Preserve list: keep tldr intact, drop the quick-answer bullet.
h = mustReplace(h, 'keep title/description/pubDate/tags/faqs exactly intact.', 'keep title/description/tldr/pubDate/tags/faqs exactly intact.', 'HUM preserve list');
h = mustReplace(h, '\n- The <div class="quick-answer">...</div> block.', '', 'HUM quick-answer bullet');
// 6) Author voice-framing -> full name.
h = mustReplace(h, 'The author is Ian, RevOps consultant', 'The author is Ian Chamberland, RevOps consultant', 'HUM author name');
hum.parameters.body = h;

// ---- assertions: no quick-answer instruction remains anywhere ------------------
for (const [name, body] of [['Generate Draft', gd.parameters.body], ['Humanize', hum.parameters.body]]) {
  if (/quick-answer/i.test(body)) throw new Error(`${name} still references quick-answer.`);
}
if (!gd.parameters.body.includes(SENTINEL)) throw new Error('tldr sentinel missing after patch.');

// ---- self-check: no expression-breaking tokens introduced ---------------------
const gdAfter = tok(gd.parameters.body);
const humAfter = tok(hum.parameters.body);
for (const [name, b, a] of [['Generate Draft', gdBefore, gdAfter], ['Humanize', humBefore, humAfter]]) {
  if (b.open !== a.open || b.close !== a.close || b.tick !== a.tick || b.dollar !== a.dollar)
    throw new Error(`${name}: token counts changed (would break the n8n expression): ${JSON.stringify({ b, a })}`);
}
JSON.parse(JSON.stringify(wf)); // round-trip guard

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n', 'utf8');
console.log('Updated blog-post-engine.json:');
console.log('  - Generate Draft: tldr frontmatter + TL;DR RULES, quick-answer removed, author = Ian Chamberland');
console.log('  - Humanize: preserve tldr, quick-answer bullet removed, author = Ian Chamberland');
console.log(`Node count: ${wf.nodes.length}`);

// update-engine-content-formats.mjs — S53 (2026-07-04)
//
// Adds two new post formats + fixes the affiliate under-linking class, per the
// growth audit (audits/AUDIT-GROWTH-2026-07-03.md S-4 + the format-diversification decision):
//
//   1. Generate Draft: POST TYPE list gains "migration" + "pricing" (the site's
//      best-ranking post is its one migration guide; "aircall pricing" queries
//      already earn impressions with no pricing content).
//   2. Generate Draft: skeletons for both new types.
//   3. Generate Draft: TUTORIAL skeleton gains a CTA floor (ChooseIf/ToolBreakdown
//      + conditional BottomLine) — the 7/02 GEO post shipped ZERO /go/ links.
//   4. Generate Draft + Humanize: the stale 11-slug affiliate list becomes a
//      general "link the FIRST mention of ANY covered tool via /go/<kebab-slug>/"
//      rule (auto-register + the lint gate backstop unknown slugs).
//   5. Parse Draft sanitizer: deterministic trailing slash on /go/ links
//      (prose links were shipping /go/hubspot → a 301 hop).
//
// Idempotent: each edit checks its "already applied" token first and skips.
// Run: node n8n/update-engine-content-formats.mjs   (mutates n8n/blog-post-engine.json
// in place; deploy afterwards with deploy-engine.mjs --apply)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const node = (name) => {
  const n = wf.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`node not found: ${name}`);
  return n;
};

let applied = 0, skipped = 0;
function edit(label, obj, key, anchor, make) {
  const src = obj[key];
  const { token, next } = make(src);
  if (src.includes(token)) { console.log(`SKIP (already applied): ${label}`); skipped++; return; }
  if (anchor && !src.includes(anchor)) throw new Error(`anchor missing for ${label}: ${anchor.slice(0, 60)}...`);
  obj[key] = next;
  if (!obj[key].includes(token)) throw new Error(`self-check failed for ${label}`);
  console.log(`APPLIED: ${label}`);
  applied++;
}

const gd = node('Generate Draft').parameters;
const hm = node('Humanize').parameters;
const pd = node('Parse Draft').parameters;

// ---- 1. POST TYPE list: + migration + pricing ----
const TYPE_ANCHOR = '- tutorial: step-by-step playbooks, how-tos — 800-1100 words';
const TYPE_TOKEN = '- migration: switching guides';
edit('post types (migration + pricing)', gd, 'body', TYPE_ANCHOR, (src) => ({
  token: TYPE_TOKEN,
  next: src.replace(TYPE_ANCHOR, TYPE_ANCHOR +
    '\n- migration: switching guides ("Migrate from X to Y", "Switching from X") — 900-1200 words' +
    '\n- pricing: pricing/cost breakdowns ("X pricing explained", "What Y actually costs") — 800-1100 words'),
}));

// ---- 2. Skeletons for the new types (inserted before FRAMEWORK:) ----
const FRAME_ANCHOR = '\n\nFRAMEWORK:';
const SKELETON_TOKEN = 'MIGRATION:';
const MIGRATION_SKELETON = [
  '',
  '',
  'MIGRATION:',
  '- One-paragraph hook: the moment teams decide to switch (be specific about the trigger)',
  '- <KeyTakeaways items={[ 3-4 one-liners: what you gain, what you lose, how long it takes ]} />',
  '- One ## section "Before you migrate": the prep checklist as short prose + a bulleted list (exports, DNS/auth, sequences to pause)',
  '- <StepRow steps={[ { title, body }, ...4-6 migration steps in order ]} />',
  '- One ## section on the gotchas: what breaks, what does not transfer, with a <SideBySide> gotcha/fix pair',
  '- One short ## section "Verify it worked": 3-4 concrete checks',
  '- <ChooseIf items={[ who should switch, who should stay ]} />',
  '- <MyTake>experience-based take on whether the switch is worth it</MyTake>',
  '- <BottomLine verdict="..." pick="DestinationTool" affiliateSlug="destination-slug" ctaLabel="Try DestinationTool" />',
  "- <Sources sources={[...]} /> citing both tools' docs and pricing pages",
  '',
  'PRICING:',
  '- One-paragraph hook: the pricing question buyers actually ask (not "X has several tiers")',
  '- <KeyTakeaways items={[ 3-4 one-liners incl. the cheapest realistic config and the gotcha fee ]} />',
  '- <StatRow stats={[ 3 pricing facts: entry price, real mid-tier cost, the overage or add-on that surprises ]} />',
  '- <ComparisonTable compact> or <IntentTable> mapping tiers to what you actually get (NOT a copy of the vendor table; annotate what matters)',
  '- One ## section "The true cost": real math for a concrete team size (seats + add-ons + overages), show the arithmetic',
  '- One ## section "Which tier for which team" + <ChooseIf items={[ tier-fit by team profile ]} />',
  '- <MyTake>where the pricing is fair vs. where it stings, from experience</MyTake>',
  '- <BottomLine verdict="..." pick="ToolName" affiliateSlug="slug" ctaLabel="See ToolName pricing" />',
  '- <Sources sources={[...]} /> citing the vendor pricing page (pricing changes; cite what you checked)',
].join('\n');
edit('migration + pricing skeletons', gd, 'body', FRAME_ANCHOR, (src) => ({
  token: SKELETON_TOKEN,
  next: src.replace(FRAME_ANCHOR, MIGRATION_SKELETON + FRAME_ANCHOR),
}));

// ---- 3. TUTORIAL CTA floor ----
const TUT_ANCHOR = '- <MyTake>experience-based claim from running this in production</MyTake>';
const TUT_TOKEN = 'no way to act ships zero affiliate surface';
edit('tutorial CTA floor', gd, 'body', TUT_ANCHOR, (src) => ({
  token: TUT_TOKEN,
  next: src.replace(TUT_ANCHOR,
    '- <ChooseIf> or <ToolBreakdown> for the featured tool(s) near the end; a tutorial that names tools but gives the reader no way to act ships zero affiliate surface' +
    '\n- <BottomLine verdict="..." pick="PrimaryTool" affiliateSlug="primary-slug" ctaLabel="Try PrimaryTool" /> when the workflow centers on one primary tool' +
    '\n' + TUT_ANCHOR),
}));

// ---- 4. Affiliate rule: general first-mention /go/ links (both prompts) ----
const AFF_TOKEN = 'kebab-case the tool name';
edit('Generate Draft affiliate rule', gd, 'body', null, (src) => {
  if (src.includes(AFF_TOKEN)) return { token: AFF_TOKEN, next: src };
  const startMarker = 'AFFILIATE LINKS — on the FIRST mention of any of these tools';
  const endMarker = 'just say "Make".';
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error('Generate Draft affiliate section not found');
  const end = src.indexOf(endMarker, start);
  if (end < 0) throw new Error('Generate Draft affiliate section end not found');
  const replacement =
    'AFFILIATE LINKS — on the FIRST mention of ANY SaaS tool the post covers, link its /go/ redirect: [ToolName](/go/<tool-slug>/), where the slug is the kebab-case the tool name maps to (reply-io, cal-com, linkedin-sales-navigator) and the path ALWAYS ends with a trailing slash. Do not repeat the link on later mentions, and do not skip a tool because it seems obscure: the QA pipeline auto-registers unknown slugs.\n' +
    'Example: "[Make](/go/make/) shines when..." → after that, just say "Make".';
  return { token: AFF_TOKEN, next: src.slice(0, start) + replacement + src.slice(end + endMarker.length) };
});

const HM_AFF_OLD = 'If first mention of an affiliate tool (hubspot, make, n8n, apollo, clay, beehiiv, smartlead, pipedrive, lemlist, kit, substack) is missing its /go link, add it.';
const HM_AFF_TOKEN = 'missing its /go/<kebab-slug>/ link';
edit('Humanize affiliate rule', hm, 'body', null, (src) => {
  if (src.includes(HM_AFF_TOKEN)) return { token: HM_AFF_TOKEN, next: src };
  if (!src.includes(HM_AFF_OLD)) throw new Error('Humanize affiliate line not found');
  return {
    token: HM_AFF_TOKEN,
    next: src.replace(HM_AFF_OLD,
      'If the first mention of any SaaS tool the post covers is missing its /go/<kebab-slug>/ link (trailing slash included), add it.'),
  };
});

// ---- 5. Parse Draft: deterministic trailing slash on /go/ links ----
const PD_ANCHOR = '  // Strip per-post <style> blocks';
const PD_TOKEN = '/go/ links: enforce trailing slash';
edit('sanitizer trailing slash', pd, 'jsCode', PD_ANCHOR, (src) => ({
  token: PD_TOKEN,
  next: src.replace(PD_ANCHOR,
    '  // /go/ links: enforce trailing slash (prose links were shipping /go/x -> a 301 hop).\n' +
    "  out = out.replace(/\\((\\/go\\/[a-z0-9-]+)\\)/g, '($1/)');\n" +
    '  out = out.replace(/href="(\\/go\\/[a-z0-9-]+)"/g, \'href="$1/"\');\n' +
    PD_ANCHOR),
}));

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n');
console.log(`\nDone: ${applied} applied, ${skipped} skipped. Wrote ${FILE}`);
console.log('Next: node n8n/deploy-engine.mjs --apply (with N8N env), then GET-verify.');

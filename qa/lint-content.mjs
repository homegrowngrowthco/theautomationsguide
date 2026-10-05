// Deterministic content linter for blog MDX — the proactive gate that catches the
// structural defects that used to reach Ian on the live preview (squished
// components, broken /go links, em dashes, hallucinated component tags, etc.).
//
// It encodes every formatting issue we've hit as a check. Runs in CI on each
// content PR (hard-fails the PR so a bad post can't auto-merge) and locally:
//
//   node qa/lint-content.mjs --post src/content/blog/<file>.mdx   # one file (CI)
//   node qa/lint-content.mjs --slug <slug>                        # one file by slug
//   node qa/lint-content.mjs --all                                # every post
//   node qa/lint-content.mjs --all --fix                          # auto-fix the safe class in place
//
// Exit 1 if any HARD violation remains. Prevention of the auto-fixable class also
// happens upstream in the engine's sanitizeMdx(); this is the backstop + hard gate
// for the class that needs a human/engine (bad slugs, bad props, hallucinated tags).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadLogoRegistry, loadAffiliateStatus, refdLogoSlugs, parseToolTaxonomy, taxonomyProblems, taxonomySelftest } from './registry.mjs';
import { loadLiveTools, planLinks } from './link-live-mentions.mjs';

const BLOG_DIR = 'src/content/blog';
const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

// ---- registries (read as text; no TS loader needed) ----------------------
const readSlugs = () => {
  const al = readFileSync('src/data/affiliate-links.ts', 'utf-8');
  const block = al.slice(al.indexOf('affiliateLinks'), al.indexOf('\nexport function') >= 0 ? al.indexOf('\nexport function') : al.length);
  // Keys can be bare (zapier:) OR quoted when hyphenated ('reply-io': / "cal-com":).
  // The optional quotes matter: 4 quoted keys were silently absent from this set before.
  const affiliate = new Set([...block.matchAll(/^\s{2}['"]?([a-z0-9-]+)['"]?:\s*\{/gm)].map((m) => m[1]));
  const tools = readFileSync('src/data/tools.ts', 'utf-8');
  // Quote-agnostic: LP-builder entries are emitted via JSON.stringify (double
  // quotes), so a single-quote-only regex silently missed attio/fillout/etc. and
  // would 404-flag valid /tools/<slug> links. Same class as the affiliate fix above.
  const toolSlugs = new Set([...tools.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)].map((m) => m[1]));
  return { affiliate, toolSlugs };
};
const { affiliate, toolSlugs } = readSlugs();

// Valid /blog/ target slugs = every post filename (sans extension). A /blog/<slug>/
// link to a nonexistent post is a 404 (same class as a bad /tools/ slug) but was
// previously unchecked — both the S-1a mesh backfill and the S-1b engine slug feed
// emit in-body /blog/ links, so validate them here as the CI backstop.
const validPostSlugs = new Set(
  readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')),
);

// A3 — logo registry: which tools carry a logo, each tool's affiliate status, and
// integrity of the logo paths themselves.
const { entries: toolEntries, logoByKey } = loadLogoRegistry();
const affiliateStatus = loadAffiliateStatus();

// R6 (conversion audit 2026-10-01, F4): live-program tools named in prose with no
// /go/ link anywhere in the post. Same matcher as qa/link-live-mentions.mjs, so the
// warning fires on exactly what `npm run qa:live-links -- --write` would link.
const liveTools = loadLiveTools();

// S-4 CTA floor (tutorial/workflow under-linking): single-word tool names that are
// also common English words. We only count these as "mentioned" when the tool is
// actually referenced by slug (a /go/, /tools/, or affiliateSlug), so prose like
// "make sure" or "close the deal" can't inflate the mention count and false-warn.
const AMBIGUOUS_NAMES = new Set(['make', 'close', 'motion', 'clay', 'warmly', 'instantly', 'vector', 'surfer', 'otter', 'lindy']);

// Distinct registered tools a post names (by tool name / distinctive alias), with the
// ambiguous-word guard above. `referenced` = slugs the post links by /go//tools//prop.
function mentionedTools(body, referenced) {
  const hits = new Set();
  for (const e of toolEntries) {
    const names = [e.name, ...(e.aliases || [])].filter(Boolean);
    const ambiguous = AMBIGUOUS_NAMES.has(e.slug) || names.some((n) => AMBIGUOUS_NAMES.has(n.toLowerCase()));
    if (ambiguous) { if (referenced.has(e.slug)) hits.add(e.slug); continue; }
    for (const n of names) {
      if (n.length < 3) continue;
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(body)) { hits.add(e.slug); break; }
    }
  }
  return hits;
}

// Components readers may use; a capitalized <Tag> not in here and not imported is suspicious.
const KNOWN = new Set([
  'SideBySide', 'StatRow', 'ComparisonTable', 'PullQuote', 'MyTake', 'StepRow', 'Figure',
  'DecisionTree', 'ToolBreakdown', 'ChooseIf', 'IntentTable', 'SpectrumBar',
  'KeyTakeaways', 'Sources', 'BottomLine', 'Fragment',
]);

// DecisionTree is RETIRED for NEW posts (Session 37): its nested
// tree={{branches:[{result:{...}}]}} prop shape was the top source of render/QA
// errors. The engine no longer emits it (decision graphic is now <ChooseIf>). These
// 15 posts shipped a valid tree before the retirement and still render fine, so they
// are grandfathered; any OTHER post containing <DecisionTree> hard-fails. (CI lints
// only the changed post, so this never touches the grandfathered set unless one is
// edited — at which point migrate it to <ChooseIf>.)
const DECISIONTREE_GRANDFATHERED = new Set([
  '2026-05-07-apollo-alternatives-for-mid-market-outbound-teams-in-2026.mdx',
  '2026-05-13-beehiiv-vs-substack-vs-hubspot-email-newsletter-for-b2b.mdx',
  '2026-05-14-gong-vs-outreach-vs-salesloft-which-wins-in-2026.mdx',
  '2026-05-15-clay-vs-zapier-for-b2b-lead-enrichment-workflows.mdx',
  '2026-05-18-lemlist-vs-apollo-for-b2b-outbound-2026-pick.mdx',
  '2026-05-19-why-revops-teams-are-abandoning-outreach-in-2026.mdx',
  '2026-05-25-n8n-vs-make-for-cold-outbound-clay-webhooks-compared.mdx',
  '2026-05-27-lemlist-vs-smartlead-vs-instantly-2026-cold-email-showdown.mdx',
  '2026-05-28-outreach-alternatives-for-mid-market-revops-in-2026.mdx',
  '2026-05-29-best-salesforce-automation-tools-no-make-or-n8n.mdx',
  '2026-06-01-pipedrive-vs-apollo-outbound-which-wins-in-2026.mdx',
  '2026-06-10-instantly-alternatives-2026-when-youve-hit-the-limits.mdx',
  '2026-06-12-gong-alternatives-for-revenue-intelligence-that-actually-fit.mdx',
  // Merged 2026-06-15 (PR #92), same day as the retirement, so it missed the
  // initial scan. Valid nested tree, renders fine (render-acceptance 0 hard).
  '2026-06-15-kit-vs-beehiiv-2026-which-newsletter-platform-wins.mdx',
]);

const CAMEL_SVG = /(textAnchor|fontWeight|fontSize|fontFamily|strokeWidth|strokeDasharray|strokeLinecap|strokeLinejoin|markerEnd|markerStart|clipPath|fillOpacity|strokeOpacity)=/;
const STYLE_BLOCK = /<style>[\s\S]*?<\/style>/g;
const EN_EM_DASH = /[–—]/;
// Scrubbed 2026-09-16: the engine used to encourage "my clients", "clients I've worked
// with" as personal-voice filler, which drifted into fabricated-scale claims ("half a
// dozen clients", "several clients") across the archive. Anchored to "client(s)" as the
// head noun (0-2 filler words allowed) so generic usage like "multiple client domains"
// doesn't false-fire — "domains", not "clients", is the head noun there.
// Requires plural "clients" (not "client") so compound nouns like "client domains" or
// "client accounts", where singular "client" modifies a different head noun, don't match.
const CLIENT_SCALE = /\b(?:dozens?(?:\s+of)?|half\s+a\s+dozen|scores\s+of|hundreds\s+of|countless|numerous|several|multiple|many)\s+(?:[a-z0-9-]+\s+){0,2}clients\b/i;

// Invented hands-on testing (Session 103, 2026-10-05): the engine prompts modelled
// "In my testing..." as the personal-voice phrase, so posts claimed tests nobody ran
// ("I have tested it on three different HubSpot portals"). update-engine-hands-on-claims.mjs
// fixed the prompts; this is the backstop. HANDS_ON_TEST (unambiguous testing claims) is
// HARD on posts dated HANDS_ON_CUTOFF or later and WARN on the archive, which Ian has not
// yet decided to scrub. HANDS_ON_USE ("I've run / used / deployed X") is WARN only: some
// first-person usage is true ("I ran RevOps at a 40-person SaaS company").
const HANDS_ON_CUTOFF = '2026-10-05';
const HANDS_ON_TEST = /\b(?:I|we)(?:'ve|’ve|'m|’m|\s+have|\s+am|\s+are)?(?:\s+been)?\s+(?:test(?:ed|ing)|benchmarked)\b|\b(?:in|from|during|after)\s+(?:my|our)\s+(?:own\s+)?(?:hands-on\s+)?test(?:ing|s)\b|\bmy\s+(?:own\s+)?testing\b|\bhands-on\s+(?:\S+\s+){0,2}?(?:test(?:ing|s|ed)?|reviews?|comparisons?|evaluations?)\b/gi;
const HANDS_ON_USE = /\b(?:I|we)(?:(?:'ve|’ve|\s+have)\s+run|(?:'ve|’ve|\s+have)?\s+(?:ran|used(?!\s+to\b)|deployed|set\s+up|migrated|piloted|trial(?:l)?ed|tried|rolled\s+out|implemented))\b|(?:^|[.!?]\s+)After testing\b/gim;

// Frozen fixtures for the two patterns above (run by --selftest).
function handsOnSelftest() {
  const cases = [
    [HANDS_ON_TEST, 'In my testing, bounce rates average 4 to 6%.', true],
    [HANDS_ON_TEST, 'I have tested it on three different HubSpot portals.', true],
    [HANDS_ON_TEST, "I've been testing Fireflies against Fathom.", true],
    [HANDS_ON_TEST, 'We tested both platforms extensively.', true],
    [HANDS_ON_TEST, 'Here is what I know after hands-on testing.', true],
    [HANDS_ON_TEST, 'My testing over the past year puts Brevo ahead.', true],
    [HANDS_ON_TEST, 'the most complete single-tool answer I have tested.', true],
    [HANDS_ON_TEST, 'Test the webhook on a staging list first.', false],
    [HANDS_ON_TEST, "I'd test a small list before scaling.", false],
    [HANDS_ON_TEST, 'Run an A/B test on subject lines.', false],
    [HANDS_ON_TEST, 'The vendor says it was tested on 10,000 records.', false],
    [HANDS_ON_TEST, 'Hands-on Vapi review for RevOps teams in 2026.', true],
    [HANDS_ON_TEST, 'Hands-on review of Profound, the GEO platform.', true],
    [HANDS_ON_TEST, 'A hands-on RevOps playbook for Warmly and Make.', false],
    [HANDS_ON_TEST, 'The actual hands-on time is four to six hours.', false],
    [HANDS_ON_USE, "I've run this migration for B2B SaaS teams.", true],
    [HANDS_ON_USE, 'I ran a 2,000-record list through both tools.', true],
    [HANDS_ON_USE, "I've used it as a first-pass enrichment step.", true],
    [HANDS_ON_USE, 'After testing a few configurations, here is the setup.', true],
    [HANDS_ON_USE, 'I used to think sequences mattered most.', false],
    [HANDS_ON_USE, "I'd run this check before every send.", false],
    [HANDS_ON_USE, 'Before I run a list through any verifier, I dedupe it.', false],
  ];
  let fail = 0;
  for (const [rx, text, want] of cases) {
    const got = new RegExp(rx.source, rx.flags.replace('g', '')).test(text);
    if (got !== want) { fail++; console.error(`hands-on selftest FAIL: ${rx === HANDS_ON_TEST ? 'TEST' : 'USE'} "${text}" expected ${want}`); }
  }
  console.log(`hands-on selftest: ${cases.length - fail}/${cases.length} pass`);
  return fail;
}

// Invented observed results (Session 104, 2026-10-05): the hands-on fix still modelled
// "I've seen teams get this wrong when...", and 105 archive sentences hung an invented
// figure on such an observation ("I've watched teams cut data entry by 40 percent").
// update-engine-observation-claims.mjs fixed the prompt. A plain observation stays
// allowed (Ian's call); only an observation sentence that also carries a figure warns.
const OBSERVATION = /\b(?:I|we)(?:'ve|’ve|\s+have)\s+(?:seen|watched|witnessed|helped|worked\s+with|built)\b/i;
const FIGURE = /\d|\bpercent\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|twelve|a\s+dozen|dozens\s+of|hundreds\s+of|thousands\s+of)\s+(?:\S+\s+)?(?:hours?|days?|weeks?|months?|quarters?|years?|reps?|domains?|teams?|clients?|records|contacts|leads|accounts|campaigns|percent)\b/i;
function observationFigureHits(text) {
  return text.split(/(?<=[.!?])\s+|\n+/).filter((s) => OBSERVATION.test(s) && FIGURE.test(s)).map((s) => s.trim());
}

function observationSelftest() {
  const cases = [
    ["I've watched teams cut CRM data entry time by 40 percent after rolling Surfe out.", true],
    ['I have seen this exact mistake take out a $400 domain and three weeks of warm-up.', true],
    ['I have seen teams burn through three months of Smartlead warm-up work.', true],
    ["A client I've worked with replaced their provider after seeing a 30% lift.", true],
    ["I've seen teams get this wrong when they skip dedupe.", false],
    ["I've seen it happen more times than I can count.", false],
    ["I've built this workflow repeatedly at Homegrown Growth Co.", false],
    ['Teams that skip dedupe often lose 20% of the list.', false],
    ["I'd expect a 10-rep team to spend $500 a month.", false],
  ];
  let fail = 0;
  for (const [text, want] of cases) {
    const got = observationFigureHits(text).length > 0;
    if (got !== want) { fail++; console.error(`observation selftest FAIL: "${text}" expected ${want}`); }
  }
  console.log(`observation selftest: ${cases.length - fail}/${cases.length} pass`);
  return fail;
}

// The squish bug (PR #51) is a MULTI-COLUMN grid/flex wrapper around components.
// width:100% / overflow / single-column 1fr are harmless full-width wrappers — don't flag those.
function inlineLayoutHits(body) {
  const hits = [];
  for (const m of body.matchAll(/style="([^"]*)"/gi)) {
    const v = m[1];
    if (/display:\s*flex/i.test(v) && !/flex-direction:\s*column/i.test(v)) { hits.push(v); continue; }
    const gtc = v.match(/grid-template-columns:\s*([^;"]+)/i);
    if (gtc) {
      const tracks = gtc[1].trim();
      const repeatN = tracks.match(/repeat\(\s*(\d+)/i);
      const multi = (repeatN && +repeatN[1] >= 2) || tracks.split(/\s+/).filter(Boolean).length >= 2;
      if (multi) hits.push(v);
    }
  }
  return hits;
}

function splitFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: src };
}

function autofix(src) {
  let out = src;
  out = out.replace(STYLE_BLOCK, '');                                       // drop per-post <style>
  // drop multi-column grid/flex wrapper styles (the squish vector); leave width/single-col alone
  out = out.replace(/ ?style="[^"]*(grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;"]*\s+[^;"]+)|display:\s*flex(?![^"]*flex-direction:\s*column))[^"]*"/gi, '');
  out = out.replace(/(\$?\d[\d,.]*)[ \t]*[–—][ \t]*(\$?\d)/g, '$1-$2');     // numeric ranges → hyphen
  out = out.replace(/[ \t]*[–—][ \t]*/g, ', ');                            // remaining em/en dashes → comma
  return out;
}

function lintFile(file) {
  let raw = readFileSync(file, 'utf-8');                  // original (CRLF preserved for write-back)
  if (FIX) {
    const fixed = autofix(raw);
    if (fixed !== raw) { writeFileSync(file, fixed, 'utf-8'); raw = fixed; }
  }
  const src = raw.replace(/\r\n/g, '\n');                 // normalize CRLF so ^anchors + frontmatter split work
  const { fm, body } = splitFrontmatter(src);
  const hard = [];
  const warn = [];

  // HARD — render/correctness breakers
  if (/<DecisionTree[\s/>]/.test(body) && !DECISIONTREE_GRANDFATHERED.has(path.basename(file)))
    hard.push('<DecisionTree> is retired (Session 37) — it was the top source of render/QA errors. Use <ChooseIf> ("Choose X if" cards) for the decision graphic, or <IntentTable> for a job-to-be-done matrix.');
  if (CAMEL_SVG.test(body)) hard.push('camelCase SVG attribute(s) (Astro drops them → broken layout). Use kebab-case.');
  if (EN_EM_DASH.test(body) || EN_EM_DASH.test(fm)) hard.push('em/en dash present (— or –). Use commas/periods.');
  for (const v of inlineLayoutHits(body)) hard.push(`inline multi-column layout wrapper (style="${v}") squishes components. Remove it; components are full-width.`);

  for (const m of body.matchAll(/\/go\/([a-z0-9-]+)/g)) {
    if (!affiliate.has(m[1])) hard.push(`/go/${m[1]} → "${m[1]}" is not in affiliate-links.ts (would 404). Add it or fix the slug.`);
  }
  // Component-prop affiliate slugs (ComparisonTable/ToolBreakdown rows) — both the
  // object form `affiliateSlug: "zapier"` and the JSX-attr form `affiliateSlug="zapier"`.
  // These have no `/go/` prefix so the matcher above can't see them; an unregistered slug
  // here renders a CTA that 404s at click time (audit 2026-06-17, C-1). Empty "" / null
  // don't capture, so they're safely skipped.
  for (const m of body.matchAll(/affiliateSlug\s*[:=]\s*['"]([a-z0-9-]+)['"]/g)) {
    if (!affiliate.has(m[1])) hard.push(`affiliateSlug "${m[1]}" is not in affiliate-links.ts → its /go/${m[1]} CTA would 404. Add it or fix the slug.`);
  }
  for (const m of body.matchAll(/\/tools\/([a-z0-9-]+)/g)) {
    if (!toolSlugs.has(m[1])) hard.push(`/tools/${m[1]} → "${m[1]}" is not a tool slug (would 404).`);
  }
  // /blog/<slug>/ internal links must point at a real post (the mesh + engine feed
  // emit these; a hallucinated sibling slug 404s). Anchored to internal-link context
  // (markdown ](/blog/ or href="/blog/) so a /blog/ path INSIDE an external URL cited
  // in a <Sources> block (e.g. emailtooltester.com/en/blog/...) can't false-fire.
  for (const m of body.matchAll(/(?:\]\(|href=["'])\/blog\/([a-z0-9-]+)/g)) {
    if (!validPostSlugs.has(m[1])) hard.push(`/blog/${m[1]} → no post with that slug exists (would 404). Fix or drop the link.`);
  }

  // Client-scale claims: "half a dozen clients", "several clients" etc. imply a large,
  // unverifiable client roster (2026-09-16 scrub, see docs/SESSION_LOG.md). WARN, not
  // hard: it's a judgment call whether a given sentence needs rewording or is a rare
  // legitimate exception, so a human reviews the PR diff rather than the gate autofixing.
  for (const phrase of new Set([...body.matchAll(new RegExp(CLIENT_SCALE, 'gi'))].map((m) => m[0]))) {
    warn.push(`client-scale claim ("${phrase}") implies a large client roster. Reword to at most one modest reference ("a client I worked with") or drop it, per the 2026-09-16 client-mentions scrub.`);
  }

  // Invented hands-on testing (Session 103). Frontmatter included: FAQ answers carried it too.
  const pub = (fm.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m) || [])[1] || '';
  const testHits = new Set([...`${fm}\n${body}`.matchAll(HANDS_ON_TEST)].map((m) => m[0]));
  for (const phrase of testHits) {
    const msg = `first-person testing claim ("${phrase}"): the engine tests nothing. Attribute the point to a cited source or the vendor docs, or restate it as opinion ("my read is"), and drop any figure presented as a personal measurement.`;
    (pub >= HANDS_ON_CUTOFF ? hard : warn).push(msg);
  }
  const useHits = new Set([...`${fm}\n${body}`.matchAll(HANDS_ON_USE)].map((m) => m[0].replace(/^[.!?]\s+/, '').trim()));
  for (const phrase of useHits) {
    warn.push(`first-person usage claim ("${phrase}"): keep it only if Ian actually did this; otherwise attribute or restate as opinion.`);
  }
  for (const s of new Set(observationFigureHits(`${fm}\n${body}`))) {
    warn.push(`observation with a figure ("${s.slice(0, 110)}"): state it as a general pattern without the number, or cite the source for the figure.`);
  }

  // S-4 CTA floor: a post that names >=2 registered tools but exposes <2 affiliate
  // CTAs (/go/ links + component affiliateSlug props) is under-monetized — the class
  // the 2026-07-02 GEO tutorial hit (zero /go/ links). WARN, not hard: comparison
  // posts naturally clear it via ToolBreakdown, so this only nudges prose tutorials.
  const goSurface = new Set([...body.matchAll(/\/go\/([a-z0-9-]+)/g)].map((m) => m[1]));
  const propSurface = new Set([...body.matchAll(/affiliateSlug\s*[:=]\s*['"]([a-z0-9-]+)['"]/g)].map((m) => m[1]));
  const affSurface = new Set([...goSurface, ...propSurface]);
  const referenced = new Set([...affSurface, ...[...body.matchAll(/\/tools\/([a-z0-9-]+)/g)].map((m) => m[1])]);
  const named = mentionedTools(body, referenced);
  if (named.size >= 2 && affSurface.size < 2) {
    warn.push(`names ${named.size} registered tools but exposes only ${affSurface.size} affiliate CTA(s) (/go/ + affiliateSlug) — S-4 CTA floor. Link the first mention of the primary tool(s) via /go/<slug>/ or add a <ChooseIf>/<BottomLine>.`);
  }

  // R6: a live-program tool mentioned in prose with no /go/ link for it (or any of its
  // deep-link variants / component affiliateSlug CTAs). WARN, not hard: an unlinked
  // mention costs a click, not a render, so it must never wedge the engine's auto-merge.
  for (const l of planLinks(raw, liveTools).links) {
    warn.push(`live-program tool "${l.name}" is mentioned in prose (line ${l.line}) but the post has no /go/${l.slug}/ link. Link its first prose mention as [${l.name}](/go/${l.slug}/), or run: node qa/link-live-mentions.mjs --post ${file} --write`);
  }

  // A3 — registry completeness: a tool compared in a logo-bearing component
  // (ToolBreakdown/ChooseIf) with no logo in the registry renders logo-less (the
  // PR #65 Lemlist/Reply.io gap). WARN, not hard: the engine compares many tools
  // that legitimately have no brand asset, so a hard gate would wedge the daily
  // auto-merge pipeline. The warn is loud (CI log + the manual-review ping) so a
  // gap gets a logo sourced before it ships. The unambiguous case (a logo: path
  // pointing at a missing file) is the HARD registry-integrity check below.
  for (const slug of new Set(refdLogoSlugs(body))) {
    if (logoByKey.has(slug)) continue;
    const status = affiliateStatus.get(slug) || 'unknown';
    warn.push(`tool "${slug}" is compared in a ToolBreakdown/ChooseIf block but has no logo in tools.ts → it renders without a brand logo (affiliate status: ${status}). Source a logo + add a logo: field.`);
  }

  // component usage vs imports
  const imported = new Set([...body.matchAll(/import\s+([A-Za-z0-9]+)\s+from/g)].map((m) => m[1]));
  const used = new Set([...body.matchAll(/<([A-Z][A-Za-z0-9]+)/g)].map((m) => m[1]));
  for (const tag of used) {
    if (tag === 'Fragment') continue;
    if (KNOWN.has(tag) && !imported.has(tag)) hard.push(`<${tag}> used but not imported.`);
    if (!KNOWN.has(tag) && !imported.has(tag)) hard.push(`<${tag}> is not a known component and is not imported (hallucinated tag?).`);
  }

  // HARD — a <style> block in a post is never wanted: components are self-styled, the
  // engine sanitizer strips them, and they're the vehicle the QA auto-fixer used to
  // sneak grid/flex squish wrappers back in. Block them outright.
  if (/<style[\s>]/i.test(body)) hard.push('contains a <style> block. Components are self-styled and responsive; per-post CSS (esp. grid/flex column overrides) squishes them. Remove it.');
  const desc = (fm.match(/^description:\s*["']?(.*?)["']?\s*$/m) || [])[1] || '';
  if (desc && (desc.length < 70 || desc.length > 165)) warn.push(`meta description is ${desc.length} chars (aim 70-165).`);
  // Title length (audit M-3): BaseLayout appends " | The Automations Guide" (+24),
  // so a frontmatter title over ~60 chars truncates in the SERP and Google clips the
  // differentiating end. Warn (engine-side prompt should target ~55).
  const ttl = (fm.match(/^title:\s*["']?(.*?)["']?\s*$/m) || [])[1] || '';
  if (ttl.length > 60) warn.push(`title is ${ttl.length} chars (>60 truncates in SERP once the " | The Automations Guide" suffix is added; aim <=60).`);
  if (!/^faqs:/m.test(fm)) warn.push('no faqs in frontmatter (misses the visible FAQ + FAQPage schema).');
  if (!/^title:/m.test(fm)) hard.push('frontmatter missing title.');
  if (!/^description:/m.test(fm)) hard.push('frontmatter missing description.');

  return { file, hard, warn };
}

// ---- target selection ----------------------------------------------------
// --selftest: run the A3c taxonomy checker and the hands-on patterns against frozen fixtures, then exit.
if (args.includes('--selftest')) process.exit(taxonomySelftest() + handsOnSelftest() + observationSelftest() > 0 ? 1 : 0);
let files = [];
if (getArg('--post')) files = [getArg('--post')];
else if (getArg('--slug')) files = [path.join(BLOG_DIR, getArg('--slug') + '.mdx')];
else if (args.includes('--all')) files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => path.join(BLOG_DIR, f));
else if (args.includes('--registry-only')) files = []; // registry checks (A3/A3b/A3c) only, no posts
else { console.error('Usage: --post <path> | --slug <slug> | --all | --registry-only [--fix] | --selftest'); process.exit(2); }

let hardTotal = 0, warnTotal = 0;

// A3 — registry integrity (global, runs once): every tools.ts `logo:` path must
// point at a real file under public/. A dangling path renders a broken <img>.
const registryHard = [];
for (const e of toolEntries) {
  if (e.logo && !existsSync(path.join('public', e.logo))) {
    registryHard.push(`tools.ts "${e.slug}" logo: ${e.logo} → file missing at public${e.logo}.`);
  }
}
// A3b — the em/en dash rule applies to tools.ts too. Hub pages render `blurb`,
// `bestFor`, `body`, and FAQ text as published content, but this gate only ever
// scanned blog MDX, so vendor copy pasted into the registry shipped dashes
// straight to production (found 2026-08-20: a Zapier blurb, and a MoltSets one).
// Comment lines are exempt; only reader-visible strings are flagged.
{
  const raw = readFileSync('src/data/tools.ts', 'utf-8').split(/\r?\n/);
  raw.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // code comment, not content
    if (EN_EM_DASH.test(line)) {
      registryHard.push(`tools.ts:${i + 1} em/en dash in reader-visible copy: ${line.trim().slice(0, 80)}`);
    }
  });
}
// A3c: every tool's category must be a rendered /tools section, the header
// dropdown may only link to real sections, and each section needs its intro line.
const taxonomy = taxonomyProblems(parseToolTaxonomy(readFileSync('src/data/tools.ts', 'utf-8')));
registryHard.push(...taxonomy.hard);
if (taxonomy.warn.length) {
  console.log('\nsrc/data/tools.ts (category taxonomy)');
  taxonomy.warn.forEach((w) => console.log(`  ! warn: ${w}`));
  warnTotal += taxonomy.warn.length;
}
if (registryHard.length) {
  console.log('\nsrc/data/tools.ts (registry)');
  registryHard.forEach((h) => console.log(`  ✗ HARD: ${h}`));
  hardTotal += registryHard.length;
}

for (const file of files) {
  const { hard, warn } = lintFile(file);
  if (hard.length || warn.length) {
    console.log(`\n${file}`);
    hard.forEach((h) => { console.log(`  ✗ HARD: ${h}`); });
    warn.forEach((w) => { console.log(`  ! warn: ${w}`); });
  }
  hardTotal += hard.length;
  warnTotal += warn.length;
}
console.log(`\nLinted ${files.length} file(s): ${hardTotal} hard, ${warnTotal} warnings.${FIX ? ' (--fix applied safe auto-corrections)' : ''}`);
process.exit(hardTotal > 0 ? 1 : 0);

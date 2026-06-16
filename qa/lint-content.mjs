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
import { loadLogoRegistry, loadAffiliateStatus, refdLogoSlugs } from './registry.mjs';

const BLOG_DIR = 'src/content/blog';
const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

// ---- registries (read as text; no TS loader needed) ----------------------
const readSlugs = () => {
  const al = readFileSync('src/data/affiliate-links.ts', 'utf-8');
  const block = al.slice(al.indexOf('affiliateLinks'), al.indexOf('\nexport function') >= 0 ? al.indexOf('\nexport function') : al.length);
  const affiliate = new Set([...block.matchAll(/^\s{2}([a-z0-9-]+):\s*\{/gm)].map((m) => m[1]));
  const tools = readFileSync('src/data/tools.ts', 'utf-8');
  const toolSlugs = new Set([...tools.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]));
  return { affiliate, toolSlugs };
};
const { affiliate, toolSlugs } = readSlugs();

// A3 — logo registry: which tools carry a logo, each tool's affiliate status, and
// integrity of the logo paths themselves.
const { entries: toolEntries, logoByKey } = loadLogoRegistry();
const affiliateStatus = loadAffiliateStatus();

// Components readers may use; a capitalized <Tag> not in here and not imported is suspicious.
const KNOWN = new Set([
  'SideBySide', 'StatRow', 'ComparisonTable', 'PullQuote', 'MyTake', 'StepRow', 'Figure',
  'DecisionTree', 'ToolBreakdown', 'ChooseIf', 'IntentTable', 'SpectrumBar',
  'KeyTakeaways', 'Sources', 'BottomLine', 'Fragment',
]);

// DecisionTree is RETIRED for NEW posts (Session 37): its nested
// tree={{branches:[{result:{...}}]}} prop shape was the top source of render/QA
// errors. The engine no longer emits it (decision graphic is now <ChooseIf>). These
// 14 posts shipped a valid tree before the retirement and still render fine, so they
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
  '2026-06-02-instantly-alternatives-2026-what-to-use-when-you-outgrow-it.mdx',
  '2026-06-10-instantly-alternatives-2026-when-youve-hit-the-limits.mdx',
  '2026-06-12-gong-alternatives-for-revenue-intelligence-that-actually-fit.mdx',
]);

const CAMEL_SVG = /(textAnchor|fontWeight|fontSize|fontFamily|strokeWidth|strokeDasharray|strokeLinecap|strokeLinejoin|markerEnd|markerStart|clipPath|fillOpacity|strokeOpacity)=/;
const STYLE_BLOCK = /<style>[\s\S]*?<\/style>/g;
const EN_EM_DASH = /[–—]/;

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
  for (const m of body.matchAll(/\/tools\/([a-z0-9-]+)/g)) {
    if (!toolSlugs.has(m[1])) hard.push(`/tools/${m[1]} → "${m[1]}" is not a tool slug (would 404).`);
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
  if (!/^faqs:/m.test(fm)) warn.push('no faqs in frontmatter (misses the visible FAQ + FAQPage schema).');
  if (!/^title:/m.test(fm)) hard.push('frontmatter missing title.');
  if (!/^description:/m.test(fm)) hard.push('frontmatter missing description.');

  return { file, hard, warn };
}

// ---- target selection ----------------------------------------------------
let files = [];
if (getArg('--post')) files = [getArg('--post')];
else if (getArg('--slug')) files = [path.join(BLOG_DIR, getArg('--slug') + '.mdx')];
else if (args.includes('--all')) files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => path.join(BLOG_DIR, f));
else { console.error('Usage: --post <path> | --slug <slug> | --all [--fix]'); process.exit(2); }

let hardTotal = 0, warnTotal = 0;

// A3 — registry integrity (global, runs once): every tools.ts `logo:` path must
// point at a real file under public/. A dangling path renders a broken <img>.
const registryHard = [];
for (const e of toolEntries) {
  if (e.logo && !existsSync(path.join('public', e.logo))) {
    registryHard.push(`tools.ts "${e.slug}" logo: ${e.logo} → file missing at public${e.logo}.`);
  }
}
if (registryHard.length) {
  console.log('\nsrc/data/tools.ts (logo registry)');
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

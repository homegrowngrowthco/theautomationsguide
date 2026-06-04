// Engine v5 updater — applies all v5 changes to blog-post-engine.json.
//
// v5 changes:
// 1. Generate Draft prompt: PERSONAL VOICE / EXTERNAL CITATIONS / NO EM-EN DASHES sections added.
//    Substack added to the affiliate slug list so first-mention linkification works.
// 2. Humanize prompt: NO DASHES scrub, PERSONAL VOICE verify, CITATIONS verify added.
//    Substack added to the slug list (parity with Generate Draft).
// 3. Parse Draft jsCode: prepends a deterministic sanitizer that
//    - converts camelCase SVG attrs to kebab-case (Astro renders SVG as raw HTML
//      and silently drops camelCase, which broke PR #24's decision tree at launch)
//    - replaces em (U+2014) and en (U+2013) dashes with ", "
//
// Idempotent: re-running on a v5-state JSON is a no-op.
//
// After running: re-import n8n/blog-post-engine.json into n8n Cloud.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);

// ---- 1. Generate Draft ---------------------------------------------------
const gen = find('Generate Draft');
let genBody = gen.parameters.body;

const oldSlugs = 'hubspot, make, n8n, apollo, clay, beehiiv, smartlead, pipedrive, lemlist, kit';
const newSlugs = `${oldSlugs}, substack`;
if (!genBody.includes(newSlugs)) {
  genBody = genBody.split(oldSlugs).join(newSlugs);
}

const personalAndCitations = `PERSONAL VOICE — required:
- Write in first person. Use "I", "me", "my", "we", "our team", "my clients", "clients I've worked with" naturally. Aim for 3-5 personal-voice markers per post, spread across sections.
- Frame insights as lived experience: "I've seen X fail when...", "We've run this stack at clients who...", "When my last team tried Y..."
- Avoid impersonal academic voice ("It can be argued that...", "One should consider..."). Replace with "I'd argue..." or "In my experience..."
- The author is Ian, founder of Homegrown Growth Co., who consults on RevOps for B2B SaaS teams. Speak from that vantage point. Do not name-drop the company more than once per post.

EXTERNAL CITATIONS — required:
- Include 2-4 inline markdown links to external credible sources within the body (NOT in frontmatter, NOT inside JSX component props).
- Cite to: original vendor docs (e.g. docs.hubspot.com, beehiiv.com/help), recognized industry research (Gartner, Forrester, G2, HubSpot Research, Salesforce State of Sales reports), peer-reviewed operator publications (Lenny's Newsletter, Reforge, Common Room, First Round Review), or first-party benchmark data.
- Format: [publisher: short title](https://url) or [study title](https://url). Surface the source's name in the link text so readers see who said it.
- Do NOT invent URLs. If you do not know a real URL for a claim, omit the citation rather than fabricate one. Hallucinated links destroy SEO/GEO credibility and are worse than no citation.

NO EM/EN DASHES — hard rule:
- Do not use em dashes (—) or en dashes (–) anywhere: body, frontmatter description, FAQ answers, JSX prop strings, image captions.
- Use commas, periods, parentheses, or restructure the sentence. "X, which Y" / "X. Then Y" / "X (Y)" all work.
- A post-process sanitizer strips remaining dashes by replacing with ", " — that may produce awkward grammar, so do not rely on it.

`;

if (!genBody.includes('PERSONAL VOICE')) {
  genBody = genBody.replace('QUICK ANSWER RULES:', personalAndCitations + 'QUICK ANSWER RULES:');
}
gen.parameters.body = genBody;

// ---- 2. Humanize --------------------------------------------------------
const hum = find('Humanize');
let humBody = hum.parameters.body;

if (!humBody.includes(newSlugs)) {
  humBody = humBody.split(oldSlugs).join(newSlugs);
}

const humAdditions = `NO DASHES — strip every em dash (—) and en dash (–) from the draft. Replace with comma, period, or parentheses, restructuring the sentence as needed. This rule applies to body content, frontmatter description, FAQ answers, JSX prop strings, image captions, MyTake blocks — every character of the post.

PERSONAL VOICE verify — confirm the draft contains 3+ first-person markers (I, me, my, we, our team, my clients, clients I've worked with). If fewer than 3, inject natural first-person framing in 2-3 sections (e.g. "I've watched this stack fail at clients who...", "We rebuilt this last quarter for a SaaS team that..."). The author is Ian, RevOps consultant at Homegrown Growth Co.

CITATIONS verify — confirm the draft has 2+ inline markdown links to external credible sources (vendor docs, Gartner/Forrester/HubSpot Research/etc., peer operator publications). If fewer than 2, add citations you know exist. Do NOT invent URLs.

`;

if (!humBody.includes('NO DASHES')) {
  humBody = humBody.replace('Output only the rewritten MDX', humAdditions + 'Output only the rewritten MDX');
}
hum.parameters.body = humBody;

// ---- 3. Parse Draft sanitizer -------------------------------------------
const pd = find('Parse Draft');
let pdCode = pd.parameters.jsCode;

const sanitizerFn = `// Deterministic sanitizer — catches LLM slop the prompt rules missed.
function sanitizeMdx(input) {
  let out = input;
  const svgAttrFixes = [
    [/textAnchor=/g, 'text-anchor='],
    [/fontWeight=/g, 'font-weight='],
    [/fontSize=/g, 'font-size='],
    [/fontFamily=/g, 'font-family='],
    [/strokeWidth=/g, 'stroke-width='],
    [/strokeDasharray=/g, 'stroke-dasharray='],
    [/strokeLinecap=/g, 'stroke-linecap='],
    [/strokeLinejoin=/g, 'stroke-linejoin='],
    [/markerEnd=/g, 'marker-end='],
    [/markerStart=/g, 'marker-start='],
    [/clipPath=/g, 'clip-path='],
    [/fillOpacity=/g, 'fill-opacity='],
    [/strokeOpacity=/g, 'stroke-opacity='],
  ];
  for (const [pattern, replacement] of svgAttrFixes) {
    out = out.replace(pattern, replacement);
  }
  // Em dash (U+2014) and en dash (U+2013) → comma+space (preserves sentence flow).
  out = out.replace(/ \\u2014 /g, ', ').replace(/\\u2014/g, ', ');
  out = out.replace(/ \\u2013 /g, ', ').replace(/\\u2013/g, ', ');
  return out;
}

`;

if (!pdCode.includes('function sanitizeMdx')) {
  pdCode = sanitizerFn + pdCode.replace(
    'const markdown = response.content[0].text.trim();',
    'const markdown = sanitizeMdx(response.content[0].text.trim());',
  );
}
pd.parameters.jsCode = pdCode;

// ---- Write back ---------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('v5 updates applied (or already present).');

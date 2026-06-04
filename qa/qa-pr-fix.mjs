// QA PR fix — given an MDX post + JSON issues from qa-pr-review, asks
// Claude to produce a corrected version of the .mdx and writes it back
// in place. Designed for the GitHub Action auto-fix pipeline.
//
// USAGE:
//   node qa/qa-pr-fix.mjs --post <path-to-mdx> --review <path-to-review.json>
//
// On success: rewrites the .mdx file in place.
// On failure: exits non-zero, leaves the file untouched.

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const postPath = args.post;
const reviewPath = args.review;

if (!postPath || !reviewPath) {
  console.error('Usage: node qa/qa-pr-fix.mjs --post <mdx-path> --review <json-path>');
  process.exit(1);
}

if (!existsSync(postPath) || !existsSync(reviewPath)) {
  console.error(`Missing input file: post=${postPath} review=${reviewPath}`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set.');
  process.exit(1);
}

const post = readFileSync(postPath, 'utf8');
const review = JSON.parse(readFileSync(reviewPath, 'utf8'));

const issues = (review.issues || []).filter((i) => i.severity === 'blocker' || i.severity === 'major');
if (issues.length === 0) {
  console.error('No blocker/major issues to fix in review JSON. Exiting without changes.');
  process.exit(2);
}

const PROMPT = `You are editing an MDX blog post on theautomationsguide.com to fix specific layout issues identified by a Claude Vision review.

The post uses a fixed component library — DO NOT invent new components. Available:
- <SideBySide> with <Fragment slot="left"> and <Fragment slot="right">
- <StatRow stats={[{ number, label, description? }, ...]} />
- <ComparisonTable title="..." tools={[{ name, tagline, pros: [], cons: [], pricing, affiliateSlug?, ctaLabel?, highlight? }, ...]} />
- <PullQuote attribution?="...">body</PullQuote>
- <MyTake>body</MyTake>
- <StepRow steps={[{ title, body }, ...]} />
- <Figure caption="..." src? alt? width? height?>body or img</Figure>
- <div class="quick-answer"><strong>Quick answer:</strong> ...</div>

PRESERVE:
- Frontmatter exactly (title, description, pubDate, tags, faqs, author, updatedDate)
- The 7-line import block at the top
- All existing /go/<slug> affiliate links
- The voice / opinions of the post — only fix LAYOUT/STRUCTURE, not the writing

SCOPE — you may ONLY fix things expressible in this post's own MDX content:
- Reordering or removing components, fixing a malformed/missing prop, splitting an overlong StatRow into two, correcting bad content, removing a stray inline-style or wrapper div that someone added by hand.
- You CANNOT change how a component looks internally — its column count, padding, gaps, max-height, overflow, responsive breakpoints, or grid/flex layout all live in the component's own .astro file, which you are NOT editing. Injecting CSS to override them does not work (and historically reintroduced squish bugs).
- If a review item is about a component's internal layout/styling/responsiveness (e.g. "TableOfContents wraps awkwardly on tablet", "ToolBreakdown columns unequal", "card padding too large", "accordion gap too loose"), you CANNOT fix it here. Leave it for manual review. If EVERY issue is component-internal or width-related, output the post COMPLETELY UNCHANGED.

NEVER (these reintroduce the exact bugs we're trying to prevent):
- NEVER add a \`<style>\` block of ANY kind, for ANY selector (global OR a post-unique class). Zero \`<style>\` blocks. The deterministic lint gate hard-fails on them.
- NEVER add an inline \`style="..."\` attribute, especially one with \`display:grid\`, \`display:flex\`, \`grid-template-columns\`, \`width\`, \`max-width\`, or \`height\`.
- NEVER wrap a component in a new \`<div>\` (with a class OR a style) to re-grid, re-flex, equalize columns, constrain, or otherwise restyle it. Components are full-width and self-responsive; a wrapper only squishes them.
- NEVER use \`!important\`.
- NEVER introduce em dashes (—) or en dashes (–) anywhere, including number ranges (write "$800-$1,200" or "$800 to $1,200", not "$800–$1,200"). Use hyphens, commas, or "to".
- NEVER change the content or container width, line length, or "readability width". The site's wide, full-container desktop layout is a deliberate design choice. Wide body text is NOT a bug.
- IGNORE any review item about "prose too wide", "content too wide", "text column too wide", "line length", or content-width — these are not issues. If every issue is width-related, output the post UNCHANGED.

ISSUES TO FIX:
${issues.map((i, n) => `${n + 1}. [${i.severity}] (${i.viewport}) ${i.description}\n   → Suggested fix: ${i.suggestedFix}`).join('\n')}

Fix ONLY these issues. Make the smallest possible change that resolves them. Do not refactor unrelated content.

CRITICAL MDX RULES:
- HTML comments \`<!-- -->\` break MDX inside JSX/SVG. Use \`{/* */}\` if a comment is needed.
- Backslash-escape literal curly braces in prose if they appear: \`\\{\` and \`\\}\`. Code spans (backticks) handle braces literally.
- Component imports MUST stay at the top, between frontmatter and the first paragraph.

Output ONLY the rewritten MDX file content. No commentary. No code fences around the whole file. Begin with the frontmatter \`---\`.

ORIGINAL POST:
${post}`;

const client = new Anthropic();

let res;
try {
  res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{ role: 'user', content: PROMPT }],
  });
} catch (err) {
  console.error('Anthropic API call failed:', err.message);
  process.exit(1);
}

let fixed = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';

if (!fixed.startsWith('---')) {
  console.error('Fix output missing frontmatter. First 300 chars:', fixed.substring(0, 300));
  process.exit(1);
}
if (!fixed.includes("import SideBySide from '@/components/post/SideBySide.astro'")) {
  console.error('Fix output missing required import block.');
  process.exit(1);
}

// Deterministic guardrail: the fixer's LLM cannot be trusted to honor the hard
// invariants (it has, in the past, reintroduced en-dashes in number ranges and
// injected <style>/grid wrappers). Strip them here so the fixer can NEVER regress
// what qa/lint-content.mjs + the engine sanitizer enforce. Mirrors sanitizeMdx().
function sanitizeFix(s) {
  let out = s;
  out = out.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');                                // no per-post <style>
  out = out.replace(/ ?style="[^"]*(?:grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;"]*\s+[^;"]+)|display:\s*flex(?![^"]*flex-direction:\s*column))[^"]*"/gi, ''); // no multi-col inline wrappers
  out = out.replace(/(\$?\d[\d,.]*)[ \t]*[–—][ \t]*(\$?\d)/g, '$1-$2');          // numeric ranges -> hyphen
  out = out.replace(/[ \t]*[–—][ \t]*/g, ', ');                                  // other em/en dashes -> comma
  return out;
}
fixed = sanitizeFix(fixed);

writeFileSync(postPath, fixed);
console.error(`✓ Wrote fix to ${postPath} (${fixed.length} chars)`);

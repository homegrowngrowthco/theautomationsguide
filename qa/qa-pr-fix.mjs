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
- Fixing genuinely broken MDX: a malformed/missing prop VALUE, a typo in prose, a stray hand-added inline-style or wrapper div, reordering two adjacent blocks. That is the whole safe surface.
- You CANNOT change how a component looks internally — its column count, padding, gaps, max-height, overflow, responsive breakpoints, or grid/flex layout all live in the component's own .astro file, which you are NOT editing. Injecting CSS to override them does not work (and historically reintroduced squish bugs).
- You CANNOT restructure a component's prop ARRAY to change its visual density. Do NOT split one <StatRow> into two (its stats stack one-per-row on mobile BY DESIGN). Do NOT split, merge, add, or drop items in StatRow/ChooseIf/ComparisonTable/SideBySide/StepRow/ToolBreakdown/IntentTable/SpectrumBar/DecisionTree to change how many show per row. "Cramped/narrow on mobile or tablet" for these is the component's own responsive behavior, NOT a content bug.
- If a review item is about a component's internal layout/styling/responsiveness/density (e.g. "TableOfContents wraps awkwardly on tablet", "ToolBreakdown columns unequal", "StatRow cramped on mobile", "ChooseIf narrow on tablet", "card padding too large"), you CANNOT fix it here. Leave it for manual review. If EVERY issue is component-internal, density, or width-related, output the post COMPLETELY UNCHANGED.

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

// The prompt tells the model to return the post UNCHANGED when every flagged
// issue is component-internal (CSS the MDX fixer can't touch). In practice it
// often returns a short prose decline instead ("All three issues are about
// component-internal layout...") rather than echoing the whole file. That is a
// correct "nothing to fix in MDX" outcome, NOT a failure — treat it exactly like
// the band-aid path below: no write, exit 0, let the Vision-issues comment route
// it to a human. Exiting non-zero here used to fail the whole job on a verdict
// the fixer was right to decline (e.g. PR #85 / run 27414522866).
if (!fixed.startsWith('---') || !fixed.includes("import SideBySide from '@/components/post/SideBySide.astro'")) {
  console.error(
    'Fixer did not return an editable MDX document (no frontmatter / import block) — ' +
    'the model declined, which means the flagged issues are component-internal or otherwise ' +
    'not MDX-expressible. Leaving the post UNCHANGED for manual review. First 300 chars:',
    fixed.substring(0, 300),
  );
  process.exit(0); // no write: "Commit and push" sees no diff and routes to a human.
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

// Deterministic structural guard (prompt rules alone are not trusted — the fixer
// has repeatedly split a fine 3-up <StatRow> into 2-up + 1-up to chase a Vision
// "cramped on mobile" flag, which is the component's own responsive behavior, not
// an MDX bug). If the count of ANY structural component tag changed, the "fix" is
// a band-aid: discard it and leave the post UNCHANGED for manual review.
const STRUCT_TAGS = ['StatRow', 'ChooseIf', 'ComparisonTable', 'SideBySide', 'StepRow', 'ToolBreakdown', 'IntentTable', 'SpectrumBar', 'DecisionTree'];
const tagCounts = (s) => Object.fromEntries(STRUCT_TAGS.map((t) => [t, (s.match(new RegExp('<' + t + '[\\s/>]', 'g')) || []).length]));
const before = tagCounts(post);
const after = tagCounts(fixed);
const structChanged = STRUCT_TAGS.filter((t) => before[t] !== after[t]);
if (structChanged.length) {
  console.error(
    `Blocked a structural component change (${structChanged.map((t) => `${t} ${before[t]}->${after[t]}`).join(', ')}). ` +
    `That is a band-aid for component-responsive behavior, not an MDX fix. Leaving the post UNCHANGED for manual review.`,
  );
  process.exit(0); // no write: "Commit and push" sees no diff and skips; the Vision issues comment routes it to a human.
}

writeFileSync(postPath, fixed);
console.error(`✓ Wrote fix to ${postPath} (${fixed.length} chars)`);

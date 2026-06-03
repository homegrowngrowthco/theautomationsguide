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

NEVER (the content width is intentional and approved — do NOT "fix" it):
- NEVER change the content or container width, line length, or "readability width". The site's wide, full-container desktop layout is a deliberate design choice. Wide body text is NOT a bug.
- NEVER add or change \`max-width\`, \`width\`, \`margin: auto\` centering, on \`article\`, \`.prose\`, \`.post-body\`, \`.container\`, \`.container--wide\`, or any global/page-level selector.
- NEVER add a \`<style>\` block (or inline style) that targets a global selector (article, .prose, .post-body, body, etc.). Only ever style a class that is unique to this post.
- NEVER use \`!important\`.
- NEVER wrap a component in a new \`<div>\` to restyle or constrain its width.
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

const fixed = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';

if (!fixed.startsWith('---')) {
  console.error('Fix output missing frontmatter. First 300 chars:', fixed.substring(0, 300));
  process.exit(1);
}
if (!fixed.includes("import SideBySide from '@/components/post/SideBySide.astro'")) {
  console.error('Fix output missing required import block.');
  process.exit(1);
}

writeFileSync(postPath, fixed);
console.error(`✓ Wrote fix to ${postPath} (${fixed.length} chars)`);

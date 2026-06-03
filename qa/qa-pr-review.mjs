// QA PR review — sends a single page's 4 breakpoint screenshots to Claude
// Vision and outputs a STRUCTURED JSON verdict to stdout. Designed for
// the GitHub Action auto-fix pipeline (different from qa-claude-review.mjs,
// which writes a markdown report for human consumption).
//
// USAGE:
//   node qa/qa-pr-review.mjs --slug <post-slug>
//   (reads qa-screenshots/<slug>/{mobile,tablet,desktop,wide}.png)
//
// OUTPUTS to stdout (JSON):
//   {
//     "shouldFix": true|false,
//     "confidence": "high" | "medium" | "low",
//     "issues": [
//       { "severity": "blocker|major|minor", "viewport": "mobile|...|all",
//         "description": "...", "suggestedFix": "..." }
//     ],
//     "summary": "one-line human-readable"
//   }
//
// Exit codes:
//   0 = review completed (regardless of issues found)
//   1 = review failed (auth, missing screenshots, malformed model output)

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const slug = args.slug;
if (!slug) {
  console.error('Usage: node qa/qa-pr-review.mjs --slug <post-slug>');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set.');
  process.exit(1);
}

const SCREENSHOT_DIR = path.join('./qa-screenshots', `blog_${slug}`);
const VIEWPORTS = ['mobile', 'tablet', 'desktop', 'wide'];

const images = VIEWPORTS
  .map((vp) => ({ vp, p: path.join(SCREENSHOT_DIR, `${vp}.png`) }))
  .filter((img) => existsSync(img.p));

if (images.length === 0) {
  console.error(`No screenshots found in ${SCREENSHOT_DIR}`);
  process.exit(1);
}

const PROMPT = `You are a senior front-end designer reviewing the layout of a blog post on theautomationsguide.com (Astro + MDX, Forbes-style 1280px container, dark theme, components: SideBySide, StatRow, ComparisonTable, PullQuote, MyTake, StepRow, Figure).

Review these 4 screenshots of /${slug.replace(/_/g, '/')} (mobile 375px, tablet 768px, desktop 1280px, wide 1440px).

Identify ONLY visible layout problems that look unprofessional or sloppy:
- Width inconsistencies (e.g. header at one width, content below at another)
- Components overflowing or wrapping awkwardly (3-card row that wraps to 2+1, etc)
- Vertical spacing too loose / too tight between sections
- Mobile cards inflated with excessive whitespace
- Misalignment between text and adjacent visuals (SideBySide top alignment)
- Anything that breaks visual rhythm

Do NOT critique:
- Copy quality, factual claims, SEO
- Design style choices that are intentional (dark theme, teal accent, etc)
- Anything that's a feature of the design system, not a bug
- CONTENT WIDTH / LINE LENGTH. The body text intentionally spans the full ~1232px container to match the components and use the full desktop width. Wide reading lines are a DELIBERATE design choice, not a bug. NEVER flag "prose too wide", "content too wide", "lines too long/wide", or suggest a max-width / narrower text column / centering the text. The content column and the components are meant to be the same full width.

Output ONLY a JSON object, no surrounding prose, no markdown fences. Schema:
{
  "shouldFix": <true if any blocker or major issue exists, else false>,
  "confidence": <"high" if you're certain, "medium" if reasonable, "low" if you're guessing>,
  "issues": [
    {
      "severity": "blocker" | "major" | "minor",
      "viewport": "mobile" | "tablet" | "desktop" | "wide" | "all",
      "description": "what you see, in 1 sentence",
      "suggestedFix": "specific MDX/CSS change to make, in 1 sentence"
    }
  ],
  "summary": "one-line verdict, e.g. 'No issues' or 'StatRow wraps 3+1 on tablet'"
}

If everything looks fine, return: {"shouldFix": false, "confidence": "high", "issues": [], "summary": "No issues."}`;

const client = new Anthropic();

const content = [
  { type: 'text', text: `Page: /${slug.replace(/_/g, '/')}` },
  ...images.flatMap((img) => [
    { type: 'text', text: `${img.vp} (${({mobile:375,tablet:768,desktop:1280,wide:1440})[img.vp]}px wide):` },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: readFileSync(img.p).toString('base64'),
      },
    },
  ]),
  { type: 'text', text: PROMPT },
];

let res;
try {
  res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content }],
  });
} catch (err) {
  console.error('Anthropic API call failed:', err.message);
  process.exit(1);
}

const raw = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
const jsonMatch = raw.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  console.error('Model did not return JSON. Raw:', raw.substring(0, 500));
  process.exit(1);
}

let verdict;
try {
  verdict = JSON.parse(jsonMatch[0]);
} catch (err) {
  console.error('Failed to parse model JSON:', err.message);
  console.error('Raw:', raw.substring(0, 500));
  process.exit(1);
}

// Output to stdout for the GHA to capture
process.stdout.write(JSON.stringify(verdict, null, 2) + '\n');

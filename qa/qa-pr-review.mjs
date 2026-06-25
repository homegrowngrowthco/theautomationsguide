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

const PROMPT = `You are a senior front-end designer reviewing the layout of a blog post on theautomationsguide.com (Astro + MDX, Forbes-style 1280px container, LIGHT theme: cream/off-white background, dark slate text, teal accent). The post may use any of these self-styled components: SideBySide, StatRow, ComparisonTable, PullQuote, MyTake, StepRow, Figure, DecisionTree, ChooseIf, IntentTable, SpectrumBar, ToolBreakdown, KeyTakeaways, Sources, BottomLine, PostFaqs, TableOfContents, RelatedPosts.

Review these 4 screenshots of /${slug.replace(/_/g, '/')} (mobile 375px, tablet 768px, desktop 1280px, wide 1440px).

Identify ONLY visible layout problems that look unprofessional or sloppy. Pay particular attention to these recurring defects:
- SQUISHED / CRAMPED COMPONENTS: a row that REMAINS multi-column at a width too narrow to hold it, so columns sit side-by-side and touch, with text wrapping mid-word or numbers/labels visibly colliding or overlapping. A component that has collapsed to ONE full-width card/stat per row is NOT cramped, that is the correct stacked layout (see the "correct by design" carve-outs below). Never flag a single-column stack.
- TOOL BREAKDOWN HEADER SQUEEZE: in a ToolBreakdown component, each tool card has a green tagline beneath the tool name. If that tagline wraps to 3 or more lines on desktop (1280px), the header is being squeezed by a long pricing string beside it — flag as major.
- EMPTY COLUMN GAPS: a grid/row with a blank or near-empty column, or large dead whitespace beside a component (e.g. a 3-col grid holding only 2 cards leaving an empty third slot).
- AWKWARD DECISION TREES: a DecisionTree whose branches genuinely overlap, whose connector lines cross through text, or whose nodes are clipped/cut off. Do NOT flag the vertical labeled-list form (a left guide-line with each branch on its own full-width row and no horizontal connectors), that is its correct, legible layout, especially on mobile.
- OVERSIZED EMBEDS / IMAGES: a Figure, screenshot, or embed that's blown up far larger than the content column or that dwarfs surrounding text.
- Width inconsistencies (header at one width, content below at another).
- Components overflowing the container or wrapping awkwardly (3-card row that wraps to 2+1).
- Vertical spacing too loose / too tight between sections; mobile cards inflated with excessive whitespace.
- Misalignment between text and adjacent visuals (SideBySide top alignment).
- Anything that breaks visual rhythm.

Do NOT critique:
- Copy quality, factual claims, SEO.
- Design style choices that are intentional (the light cream theme, teal accent, full-width components).
- Anything that's a feature of the design system, not a bug.
- CONTENT WIDTH / LINE LENGTH. The body text intentionally spans the full ~1232px container to match the components and use the full desktop width. Wide reading lines are a DELIBERATE design choice, not a bug. NEVER flag "prose too wide", "content too wide", "lines too long/wide", or suggest a max-width / narrower text column / centering the text. The content column and the components are meant to be the same full width.
- STACKED / SINGLE-COLUMN MOBILE LAYOUTS ARE CORRECT. On the mobile (375px) and often the tablet screenshot, the card components (StatRow, ChooseIf, ComparisonTable, ToolBreakdown, IntentTable, SideBySide) DELIBERATELY collapse to a single full-width column, one card/stat per row (they switch to side-by-side columns only at >=640px). NEVER flag a one-card-per-row mobile stack as "cramped", "squished", "too narrow", "wasted/empty space", "should be multi-column", or "unbalanced". A tall stack of full-width cards on a phone is correct, not a defect. Likewise, these same components sitting 2 to 4 across at tablet (768px) or wider is the intended grid; only flag it if the column text genuinely overlaps or collides, NOT merely because the columns "feel narrow" or "could use more breathing room".
- THE DECISIONTREE VERTICAL LIST IS CORRECT AND LEGIBLE. A DecisionTree shown as a vertical labeled-list (teal guide-line down the left, each branch on its own row, [LABEL] above or beside its text, no horizontal connector lines) is its intended layout, not a broken or "illegible flowchart". On mobile the connectors are intentionally hidden and branches go full-width. Do not invent "orphaned branches", "overlapping connectors", or an "illegible flowchart" for this form.

Real overflow and clipping are already caught by separate deterministic gates. For the stacked-card and DecisionTree-vertical-list cases above, when in doubt, do NOT raise an issue, prefer a false negative over re-flagging an intentional responsive layout.

CRITICAL shouldFix RULE: set "shouldFix" to true ONLY when at least one issue is severity "blocker" or "major" (a genuinely broken, unprofessional layout that must be fixed before publishing). If you find only "minor" issues, or no issues at all, "shouldFix" MUST be false. Minor polish nitpicks (slightly loose spacing, a callout that "could fill space better", columns that "feel a touch narrow") never trigger a fix. Do NOT inflate a minor nitpick to major to justify shouldFix.

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

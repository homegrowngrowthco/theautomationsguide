// QA Claude vision review — sends each page's 4 breakpoint screenshots to
// Claude Sonnet and saves a markdown report flagging layout issues.
//
// USAGE:
//   1. Run qa-screenshots.mjs first to populate qa-screenshots/.
//   2. Set ANTHROPIC_API_KEY in .env (or environment).
//   3. npm run qa:review
//
// Output: qa-review.md at project root.

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = './qa-screenshots';
const OUT_FILE = './qa-review.md';
const MODEL = 'claude-sonnet-4-6';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set. Add it to .env or your environment.');
  process.exit(1);
}

if (!existsSync(SCREENSHOT_DIR)) {
  console.error(`No screenshots found at ${SCREENSHOT_DIR}. Run qa:screenshots first.`);
  process.exit(1);
}

const client = new Anthropic();

const PROMPT = `Review the four screenshots of this page (mobile 375px, tablet 768px, desktop 1280px, wide 1440px).

Focus on layout issues that would look unprofessional or sloppy:
- Width inconsistencies (e.g. a header at one width and the content below it at another)
- Components that overflow their container or wrap awkwardly (e.g. a 3-card row that wraps to 2+1)
- Vertical spacing that's too loose or too tight between sections
- Mobile cards that feel inflated/wasteful
- Misalignment between text and adjacent visuals
- Text that runs too wide to read comfortably
- Anything that breaks the visual rhythm of the page

If everything looks fine across all four breakpoints, say "No issues."
Otherwise, output a concise bullet list. Each bullet should be one specific, actionable issue.
Skip generic compliments — only call out problems.`;

async function reviewPage(slug) {
  const dir = path.join(SCREENSHOT_DIR, slug);
  const viewports = ['mobile', 'tablet', 'desktop', 'wide'];

  const images = viewports
    .map((vp) => ({ vp, p: path.join(dir, `${vp}.png`) }))
    .filter((i) => existsSync(i.p));

  if (images.length === 0) return null;

  const content = [
    { type: 'text', text: `Page: /${slug.replace(/_/g, '/')}` },
    ...images.flatMap((img) => [
      { type: 'text', text: `${img.vp} (${getVpWidth(img.vp)}px wide):` },
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

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content }],
  });

  return res.content[0].type === 'text' ? res.content[0].text : '(no response)';
}

function getVpWidth(name) {
  return { mobile: 375, tablet: 768, desktop: 1280, wide: 1440 }[name] || '?';
}

async function run() {
  const slugs = readdirSync(SCREENSHOT_DIR)
    .filter((s) => statSync(path.join(SCREENSHOT_DIR, s)).isDirectory())
    .sort();

  console.log(`→ Reviewing ${slugs.length} pages with ${MODEL}`);

  const lines = [
    `# QA Review`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Pages reviewed: ${slugs.length}`,
    ``,
    `---`,
    ``,
  ];

  for (const slug of slugs) {
    const url = '/' + slug.replace(/_/g, '/');
    process.stdout.write(`  reviewing ${url} ... `);

    try {
      const review = await reviewPage(slug);
      lines.push(`## \`${url}\``);
      lines.push('');
      lines.push(review || '(no review)');
      lines.push('');
      console.log('✓');
    } catch (err) {
      lines.push(`## \`${url}\``);
      lines.push('');
      lines.push(`_Review failed: ${err.message}_`);
      lines.push('');
      console.log('✗', err.message);
    }
  }

  writeFileSync(OUT_FILE, lines.join('\n'));
  console.log(`\n→ Wrote ${OUT_FILE}`);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

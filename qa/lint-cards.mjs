// Deterministic gate for the build-time /cards/<slug>.png output (Design de-AI
// Phase 2 — src/pages/cards/[...route].ts). Nothing checked generated OG/card
// images before this (confirmed: qa/lint-logos.mjs only validates SOURCE logo
// files in public/brand/tools/, never generated output). This closes that gap
// for the new 118-image batch:
//   1. EVERY non-draft post has a corresponding dist/cards/<slug>.png (HARD).
//   2. Dimensions are exactly the card size (HARD) — a mismatch means the
//      generator's canvas size drifted from what templates will expect.
//   3. The image isn't a flat, blank rectangle (HARD) — a crude but real
//      catch for "the font/logo compositing silently produced nothing,"
//      which a mere existence + dimension check would miss.
//
// Must run AFTER `npm run build` (needs dist/cards/ populated) — unlike
// lint-logos.mjs, which checks source assets and can run any time.
//
// Usage: node qa/lint-cards.mjs [--dist dist] [--blog src/content/blog]

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : fallback;
};
const DIST_DIR = join(flag('--dist', 'dist'), 'cards');
const BLOG_DIR = flag('--blog', 'src/content/blog');

const CARD_W = 1200;
const CARD_H = 675;
// Cream background fill — a pixel within this distance (per channel) of it
// counts as "background," not rendered content.
const BG = { r: 253, g: 252, b: 248 };
const BG_TOLERANCE = 6;

// Quote-agnostic + CRLF-aware frontmatter scan (registry-parser bug class —
// same technique astro.config.mjs's BLOG_LASTMOD scanner already uses).
function frontmatterField(src, field) {
  const m = src.match(new RegExp(`^${field}:\\s*["']?([^"'\\r\\n]+)`, 'm'));
  return m ? m[1].trim() : undefined;
}

const files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));
const slugs = [];
for (const file of files) {
  const src = readFileSync(join(BLOG_DIR, file), 'utf8');
  if (frontmatterField(src, 'draft') === 'true') continue;
  slugs.push(file.replace(/\.mdx?$/, ''));
}

async function inspect(pngPath) {
  const img = sharp(pngPath);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x, y) => {
    const i = (y * width + x) * channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };
  const isBg = (p) =>
    Math.abs(p.r - BG.r) <= BG_TOLERANCE &&
    Math.abs(p.g - BG.g) <= BG_TOLERANCE &&
    Math.abs(p.b - BG.b) <= BG_TOLERANCE;
  // Coarse 12x12 sample grid — enough to catch "nothing rendered" without
  // decoding the whole image pixel-by-pixel.
  let nonBg = 0;
  for (let gy = 0; gy < 12; gy++) {
    for (let gx = 0; gx < 12; gx++) {
      const x = Math.min(width - 1, Math.floor((gx / 11) * width));
      const y = Math.min(height - 1, Math.floor((gy / 11) * height));
      if (!isBg(at(x, y))) nonBg++;
    }
  }
  return { width, height, format: meta.format, nonBg };
}

const hard = [];
let checked = 0;

for (const slug of slugs) {
  const pngPath = join(DIST_DIR, `${slug}.png`);
  if (!existsSync(pngPath)) {
    hard.push(`${slug}: no dist/cards/${slug}.png — post has no generated card.`);
    continue;
  }
  let r;
  try {
    r = await inspect(pngPath);
  } catch (e) {
    hard.push(`${slug}: could not read generated card (${e.message})`);
    continue;
  }
  checked++;
  if (r.width !== CARD_W || r.height !== CARD_H) {
    hard.push(`${slug}: card is ${r.width}x${r.height}, expected ${CARD_W}x${CARD_H}.`);
  }
  if (r.nonBg === 0) {
    hard.push(`${slug}: card is a flat cream rectangle — no text or logos rendered.`);
  }
}

for (const h of hard) console.log(`HARD  ${h}`);

console.log(`\nlint-cards: ${checked}/${slugs.length} card(s) checked, ${hard.length} hard.`);
if (hard.length) {
  console.error(`\n✗ ${hard.length} card(s) failed the gate.`);
  process.exit(1);
}
console.log('✓ all cards clean.');

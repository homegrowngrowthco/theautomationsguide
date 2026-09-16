// Per-post build-time card image (Design de-AI Phase 2, audit item 7 —
// audits/AUDIT-DESIGN-2026-08-29.md §3; visual redesign Session 91, "Direction D"
// picked from mockups researched against blog.n8n.io / zapier.com/blog /
// blog.hubspot.com — none of the three use stock photography, all lean on
// bigger logos/icons than this card originally did). Produces /cards/<slug>.png:
// dot-grid-textured cream ground, a teal section tab, the headline, a
// description sub-header filling the space a logo-less card would otherwise
// leave empty, and up to 3 tilted "sticker" tool-logo badges with a flat
// drop shadow. Distinct from /og/<slug>.png (src/pages/og/[...route].ts, a
// simpler astro-og-canvas card used for social-share previews) — this route
// is the card-grid thumbnail, wired into PostCard.astro (PR #261/263).
//
// Rendered with `sharp` directly rather than astro-og-canvas: that library can
// only place a single logo and can't decode the SVG-format tool logos at all,
// neither of which works for a multi-logo tilted layout. Everything — text,
// dot-grid pattern, badge shadows, AND the logo images themselves (embedded as
// base64 <image> data URIs) — renders in ONE SVG string, rasterized once by
// sharp's bundled librsvg; this lets SVG's own `transform="rotate(...)"` tilt
// each logo's badge, which a post-hoc sharp `.composite()` step (the old
// approach) can't do per-element. Both brand fonts are embedded the same way,
// as base64 WOFF1 data URIs read straight from the already-installed
// @fontsource packages — no network fetch at build time (unlike astro-og-canvas's
// default, which silently fetches Noto Sans from api.fontsource.org on every build).
import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIContext } from 'astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { tools, type Tool } from '../../data/tools';
import { classifySection, selectCardLogos, wrapHeadline } from '../../lib/post-cards';

const CARD_W = 1200;
const CARD_H = 675;
const PADDING = 64;
const TAB_H = 56;

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const readFontBase64 = (relFromFontsource: string) =>
  readFileSync(path.join(ROOT, 'node_modules', '@fontsource', relFromFontsource)).toString('base64');

// Read once per build, not once per post.
const SERIF_FONT_B64 = readFontBase64('source-serif-4/files/source-serif-4-latin-700-normal.woff');
const SANS_FONT_B64 = readFontBase64('inter/files/inter-latin-600-normal.woff');

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Badge layout per logo count — hand-tuned so the tilted cluster never
// crosses into the text column (headlineCharsPerLine/summaryCharsPerLine
// below wrap text to stay clear of it), cascading down-right so later badges
// overlap earlier ones like a scattered sticker pile (the Zapier-blog
// reference this direction is drawn from). Rotation values are a fixed
// pattern, not randomized, so a given post's card is pixel-identical across
// rebuilds.
type BadgeSpot = { x: number; y: number; size: number; rot: number };
const BADGE_LAYOUTS: Record<1 | 2 | 3, BadgeSpot[]> = {
  1: [{ x: 916, y: 228, size: 180, rot: -8 }],
  2: [
    { x: 854, y: 96, size: 152, rot: -9 },
    { x: 964, y: 190, size: 152, rot: 7 },
  ],
  3: [
    { x: 858, y: 66, size: 128, rot: -7 },
    { x: 774, y: 208, size: 128, rot: 6 },
    { x: 984, y: 226, size: 128, rot: -5 },
  ],
};
// Leftmost badge edge across all layouts above (774px, the 3-logo case) minus
// a breathing gap: headlineCharsPerLine/summaryCharsPerLine below are tuned
// by hand to wrap text short enough to stay clear of that line.
const BADGE_INNER_PAD = 20;
const BADGE_RADIUS = 22;

// Rasterized logos are reused across posts (e.g. HubSpot appears on dozens of
// cards) — cache by tool slug so each source file is only decoded once. Each
// entry is pre-fit to a square box so it can be centered in any badge size
// without per-post recomputation; badges above use 3 sizes, so we cache by
// (slug, boxSize).
const logoCache = new Map<string, Buffer | null>();
async function rasterLogoSquare(tool: Tool, box: number): Promise<{ buf: Buffer; w: number; h: number } | null> {
  if (!tool.logo) return null;
  const key = `${tool.slug}:${box}`;
  if (logoCache.has(key)) {
    const cached = logoCache.get(key);
    if (!cached) return null;
    const meta = await sharp(cached).metadata();
    return { buf: cached, w: meta.width ?? box, h: meta.height ?? box };
  }
  const filePath = path.join(ROOT, 'public', tool.logo.replace(/^\//, ''));
  try {
    const buf = await sharp(filePath)
      .resize({ width: box, height: box, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    logoCache.set(key, buf);
    const meta = await sharp(buf).metadata();
    return { buf, w: meta.width ?? box, h: meta.height ?? box };
  } catch {
    // Missing/corrupt source file — card simply omits this logo rather than failing the build.
    logoCache.set(key, null);
    return null;
  }
}

// One tilted "sticker" badge: a flat (unblurred, librsvg-filter-safe) drop
// shadow, a white rounded-square card, and the logo centered inside —
// rotated together as a group so the shadow and border tilt with the logo.
function badgeSvg(spot: BadgeSpot, logo: { buf: Buffer; w: number; h: number }): string {
  const { x, y, size, rot } = spot;
  const cx = x + size / 2;
  const cy = y + size / 2;
  // logo was pre-fit to a square box via rasterLogoSquare (size - 2*BADGE_INNER_PAD), so centering by w/h is enough
  const imgX = x + (size - logo.w) / 2;
  const imgY = y + (size - logo.h) / 2;
  return `
  <g transform="rotate(${rot} ${cx} ${cy})">
    <rect x="${x + 5}" y="${y + 7}" width="${size}" height="${size}" rx="${BADGE_RADIUS}" fill="#0d1117" opacity="0.16"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${BADGE_RADIUS}" fill="#ffffff" stroke="#e5e1d4" stroke-width="1.5"/>
    <image x="${imgX}" y="${imgY}" width="${logo.w}" height="${logo.h}" href="data:image/png;base64,${logo.buf.toString('base64')}" xlink:href="data:image/png;base64,${logo.buf.toString('base64')}"/>
  </g>`;
}

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { route: `${post.slug}.png` }, props: { post } }));
}

export async function GET({ props }: APIContext) {
  const post = (props as { post: CollectionEntry<'blog'> }).post;

  const section = classifySection(post);
  // Only tools with a registered logo asset can appear on the card — a text
  // wordmark fallback would look inconsistent mixed with real logos at this size.
  const candidateTools = selectCardLogos(post, tools).filter((t) => !!t.logo);
  const logoCount = Math.min(candidateTools.length, 3) as 0 | 1 | 2 | 3;
  const layout = logoCount > 0 ? BADGE_LAYOUTS[logoCount as 1 | 2 | 3] : [];
  const rastered = logoCount > 0
    ? await Promise.all(
        candidateTools
          .slice(0, logoCount)
          .map((tool, i) => rasterLogoSquare(tool, layout[i].size - BADGE_INNER_PAD * 2)),
      )
    : [];
  const badges = layout
    .map((spot, i) => (rastered[i] ? badgeSvg(spot, rastered[i]!) : ''))
    .join('\n  ');
  const hasLogos = rastered.some((r) => r !== null);

  const tabLabel = section.toUpperCase();
  const tabWidth = Math.min(CARD_W - PADDING, 40 + tabLabel.length * 15);

  // Wider wrap + more allowed lines when there's no logo cluster to dodge —
  // this is exactly the empty-card case the redesign targets, so it gets the
  // most room to fill.
  const headlineCharsPerLine = hasLogos ? 23 : 30;
  const headlineLines = wrapHeadline(post.data.title, headlineCharsPerLine, 3);
  const headlineLineHeight = 62;

  const summaryCharsPerLine = hasLogos ? 36 : 48;
  const summaryMaxLines = hasLogos ? 3 : 4;
  const summaryLines = wrapHeadline(post.data.description, summaryCharsPerLine, summaryMaxLines);
  const summaryLineHeight = 36;
  const blockGap = 34;

  // Center the headline+summary block in the space below the tab instead of
  // top-anchoring it, so a short (or logo-less) card distributes its extra
  // room above and below the text rather than pooling it all underneath.
  const regionTop = TAB_H + 34;
  const regionBottom = CARD_H - 40;
  const blockHeight = headlineLines.length * headlineLineHeight + blockGap + summaryLines.length * summaryLineHeight;
  const blockTop = regionTop + Math.max(0, (regionBottom - regionTop - blockHeight) / 2);
  const headlineStartY = blockTop + headlineLineHeight * 0.72;
  const summaryStartY = headlineStartY + headlineLines.length * headlineLineHeight + blockGap;

  const svg = `
<svg width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    @font-face { font-family: 'CardSerif'; src: url(data:font/woff;base64,${SERIF_FONT_B64}) format('woff'); font-weight: 700; }
    @font-face { font-family: 'CardSans'; src: url(data:font/woff;base64,${SANS_FONT_B64}) format('woff'); font-weight: 600; }
    .tab-label { font-family: 'CardSans'; font-weight: 600; font-size: 22px; fill: #ffffff; letter-spacing: 1.5px; }
    .headline { font-family: 'CardSerif'; font-weight: 700; font-size: 54px; fill: #262b32; }
    .summary { font-family: 'CardSans'; font-weight: 600; font-size: 25px; fill: #5e6671; }
  </style>
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1.4" cy="1.4" r="1.4" fill="#e5e1d4"/>
    </pattern>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" fill="#fdfcf8"/>
  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#dots)"/>
  <rect x="0" y="0" width="${tabWidth}" height="${TAB_H}" fill="#14a890"/>
  <text x="24" y="${TAB_H / 2 + 8}" class="tab-label">${escapeXml(tabLabel)}</text>
  ${headlineLines
    .map(
      (line, i) =>
        `<text x="${PADDING}" y="${headlineStartY + i * headlineLineHeight}" class="headline">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  ${summaryLines
    .map(
      (line, i) =>
        `<text x="${PADDING}" y="${summaryStartY + i * summaryLineHeight}" class="summary">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  ${badges}
</svg>`.trim();

  const final = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(final, { headers: { 'Content-Type': 'image/png' } });
}

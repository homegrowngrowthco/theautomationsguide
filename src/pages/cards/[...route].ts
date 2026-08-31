// Per-post build-time card image (Design de-AI Phase 2, audit item 7 —
// audits/AUDIT-DESIGN-2026-08-29.md §3). Produces /cards/<slug>.png: cream
// ground, a teal section tab, up to 3 tool logos (a "VS" divider when exactly
// 2), and the headline. Distinct from /og/<slug>.png (src/pages/og/[...route].ts,
// which stays the social-share card) — this route is the future card-thumbnail
// image for post listings. NOT YET WIRED into any template (generate + verify
// only this pass; see TODO.md).
//
// Rendered with `sharp` directly rather than astro-og-canvas: that library can
// only place a single logo and can't decode the SVG-format tool logos at all,
// neither of which works for a multi-logo "vs" layout. Text is drawn via one
// SVG (rasterized by sharp's bundled librsvg) with both brand fonts embedded as
// base64 WOFF1 data URIs read straight from the already-installed @fontsource
// packages — no network fetch at build time (unlike astro-og-canvas's default,
// which silently fetches Noto Sans from api.fontsource.org on every build).
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
const LOGO_H = 64;
const LOGO_GAP = 28;
const VS_GAP = 64;

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const readFontBase64 = (relFromFontsource: string) =>
  readFileSync(path.join(ROOT, 'node_modules', '@fontsource', relFromFontsource)).toString('base64');

// Read once per build, not once per post.
const SERIF_FONT_B64 = readFontBase64('source-serif-4/files/source-serif-4-latin-700-normal.woff');
const SANS_FONT_B64 = readFontBase64('inter/files/inter-latin-600-normal.woff');

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Rasterized logos are reused across posts (e.g. HubSpot appears on dozens of
// cards) — cache by tool slug so each source file is only decoded once.
const logoCache = new Map<string, Buffer | null>();
async function rasterLogo(tool: Tool): Promise<Buffer | null> {
  if (!tool.logo) return null;
  if (logoCache.has(tool.slug)) return logoCache.get(tool.slug)!;
  const filePath = path.join(ROOT, 'public', tool.logo.replace(/^\//, ''));
  try {
    const buf = await sharp(filePath).resize({ height: LOGO_H, fit: 'contain' }).png().toBuffer();
    logoCache.set(tool.slug, buf);
    return buf;
  } catch {
    // Missing/corrupt source file — card simply omits this logo rather than failing the build.
    logoCache.set(tool.slug, null);
    return null;
  }
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
  const logoBuffers = (await Promise.all(candidateTools.map(rasterLogo))).filter(
    (b): b is Buffer => b !== null,
  );
  const logoMetas = await Promise.all(logoBuffers.map((b) => sharp(b).metadata()));

  // Lay out the logo row left-to-right, reserving extra room for a "VS" label
  // between exactly two logos (the comparison-post case the audit calls out).
  const showVs = logoBuffers.length === 2;
  const logoY = CARD_H - PADDING - LOGO_H;
  const positions: { left: number; width: number }[] = [];
  let cursorX = PADDING;
  logoMetas.forEach((m, i) => {
    const width = m.width ?? LOGO_H;
    positions.push({ left: cursorX, width });
    cursorX += width + (showVs && i === 0 ? VS_GAP : LOGO_GAP);
  });
  const vsCenterX = showVs ? positions[0].left + positions[0].width + VS_GAP / 2 : 0;

  const tabLabel = section.toUpperCase();
  const tabWidth = Math.min(CARD_W - PADDING, 40 + tabLabel.length * 15);

  const headlineLines = wrapHeadline(post.data.title, 24, 3);
  const headlineStartY = 210;
  const lineHeight = 68;

  const svg = `
<svg width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @font-face { font-family: 'CardSerif'; src: url(data:font/woff;base64,${SERIF_FONT_B64}) format('woff'); font-weight: 700; }
    @font-face { font-family: 'CardSans'; src: url(data:font/woff;base64,${SANS_FONT_B64}) format('woff'); font-weight: 600; }
    .tab-label { font-family: 'CardSans'; font-weight: 600; font-size: 22px; fill: #ffffff; letter-spacing: 1.5px; }
    .headline { font-family: 'CardSerif'; font-weight: 700; font-size: 56px; fill: #262b32; }
    .vs { font-family: 'CardSans'; font-weight: 600; font-size: 20px; fill: #8a8f98; letter-spacing: 1px; }
  </style>
  <rect width="${CARD_W}" height="${CARD_H}" fill="#fdfcf8"/>
  <rect x="0" y="0" width="${tabWidth}" height="${TAB_H}" fill="#14a890"/>
  <text x="24" y="${TAB_H / 2 + 8}" class="tab-label">${escapeXml(tabLabel)}</text>
  ${headlineLines
    .map(
      (line, i) =>
        `<text x="${PADDING}" y="${headlineStartY + i * lineHeight}" class="headline">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  ${showVs ? `<text x="${vsCenterX}" y="${logoY + LOGO_H / 2 + 7}" class="vs" text-anchor="middle">VS</text>` : ''}
</svg>`.trim();

  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const final = logoBuffers.length
    ? await sharp(base)
        .composite(logoBuffers.map((input, i) => ({ input, left: positions[i].left, top: logoY })))
        .png()
        .toBuffer()
    : base;

  return new Response(final, { headers: { 'Content-Type': 'image/png' } });
}

// Deterministic logo-asset gate. Catches the class of homepage "logo strip looks
// like trash" defects that the post-scoped gates (lint-content / render-acceptance
// / mobile-overflow) can't see, because they check post structure + horizontal
// overflow, never the brand image assets themselves.
//
// What it checks, for every raster logo in public/brand/tools/ (png/webp/jpg —
// jpg carries no alpha channel, so any .jpg logo is opaque by construction and
// fails check 1; calendly.jpg slipped through when only png/webp were scanned):
//   1. OPAQUE BACKGROUND (HARD) — a logo shipped with a baked-in solid rectangle
//      (e.g. beehiiv.png was pure-white, so it sat in a white box on the cream
//      page while every other logo was transparent). Detected by sampling the
//      four corners: a transparent logo has fully-transparent corners; an opaque
//      background makes them opaque.
//   2. ASPECT-RATIO OUTLIER (WARN) — a logo far wider/taller than its peers will
//      render at an odd visual weight in the equal-cell strip; worth an eyeball.
//
// SVGs are skipped (vector wordmarks in this set are transparent by construction;
// a white <rect> bg would be a different, rarer check).
//
// Usage: node qa/lint-logos.mjs [--dir public/brand/tools]
// Exit 1 on any HARD failure. Matches the standalone qa/*.mjs convention.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const dirArg = args.indexOf('--dir');
const DIR = dirArg !== -1 ? args[dirArg + 1] : 'public/brand/tools';

// A corner is "opaque" if it's not see-through. Transparent logos read ~0 here.
const OPAQUE_ALPHA = 250;
// Aspect ratio (width/height) sanity band for a wordmark/icon logo.
const AR_MIN = 0.4; // taller than this-ratio is unusual
const AR_MAX = 9.0; // wider than this renders as a sliver at capped height

async function inspect(file) {
  const path = join(DIR, file);
  const img = sharp(path);
  const meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (x, y) => {
    const i = (y * width + x) * channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
  const opaqueCorners = corners.filter((c) => c.a >= OPAQUE_ALPHA).length;
  const ar = width / height;
  return { file, width, height, ar, opaqueCorners, hasAlpha: meta.hasAlpha };
}

const files = readdirSync(DIR).filter((f) => /\.(png|webp|jpe?g)$/i.test(f));
const hard = [];
const warn = [];

for (const file of files) {
  let r;
  try {
    r = await inspect(file);
  } catch (e) {
    hard.push(`${file}: could not read image (${e.message})`);
    continue;
  }
  // All four corners opaque => the logo carries a solid background rectangle.
  if (r.opaqueCorners === 4) {
    hard.push(
      `${file}: opaque background (all 4 corners solid` +
        `${r.hasAlpha ? '' : ', no alpha channel'}) — logos must be transparent so ` +
        `they don't render in a box on the page. Trim/knock out the background.`
    );
  } else if (r.opaqueCorners >= 2) {
    warn.push(`${file}: ${r.opaqueCorners}/4 corners opaque — check it isn't sitting on a partial background.`);
  }
  if (r.ar < AR_MIN || r.ar > AR_MAX) {
    warn.push(`${file}: aspect ratio ${r.ar.toFixed(2)} (${r.width}x${r.height}) is an outlier — may read oddly in the logo strip.`);
  }
}

for (const w of warn) console.log(`WARN  ${w}`);
for (const h of hard) console.log(`HARD  ${h}`);

console.log(`\nlint-logos: ${files.length} raster logo(s) checked, ${hard.length} hard, ${warn.length} warn.`);
if (hard.length) {
  console.error(`\n✗ ${hard.length} logo asset(s) failed the gate.`);
  process.exit(1);
}
console.log('✓ all logo assets clean.');

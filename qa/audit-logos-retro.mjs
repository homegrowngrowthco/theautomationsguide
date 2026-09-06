// qa/audit-logos-retro.mjs
//
// Retro audit of every logo in public/brand/tools/ against the reject rules that
// auto-register-tools.mjs applies to a NEWLY sourced logo (validateRasterLogo),
// plus the lint-logos CI gate rules. The auto-register guard only runs at
// sourcing time, so a logo registered before a rule existed (attio.png, a
// 1200x630 OG banner, predated the 2026-08-20 banner rule) is never re-checked
// by CI. This script re-derives the verdict for the whole population.
//
// Rules (kept byte-for-byte in sync with the two sources; do not "improve" here):
//   guard.banner   width >= 600 AND width/height > 1.5       (validateRasterLogo)
//   guard.corners  any corner alpha < 8 -> passes as-is       (validateRasterLogo)
//   guard.knockout all 4 corners opaque -> key out corner[0] colour (dist < 40),
//                  reject if kept < 2% of pixels or mean luminance of kept > 215
//   gate.opaque    all 4 corners alpha >= 250 -> HARD          (lint-logos)
//   gate.aspect    width/height outside [0.4, 9.0] -> WARN     (lint-logos)
//
// Informational only (NOT a rule in either source): mean luminance of the
// visible pixels (alpha >= 8) of a transparent-corner logo. The guard never
// measures this because it trusts a transparent-corner candidate as-is, which is
// exactly how a near-white mark on a transparent canvas ships invisible on the
// cream cards. Reported so a human can eyeball the pale ones; not a verdict.
//
// Usage: node qa/audit-logos-retro.mjs [--dir public/brand/tools] [--json out.json]
// Exit 0 always (audit, not a gate). Prints a markdown table to stdout.

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const dirArg = args.indexOf('--dir');
const DIR = dirArg !== -1 ? args[dirArg + 1] : 'public/brand/tools';
const jsonArg = args.indexOf('--json');
const JSON_OUT = jsonArg !== -1 ? args[jsonArg + 1] : null;

const BANNER_MIN_W = 600;
const BANNER_AR = 1.5;
const TRANSPARENT_ALPHA = 8;
const KNOCKOUT_DIST = 40;
const KNOCKOUT_MIN_KEPT = 0.02;
const LUM_MAX = 215;
const GATE_OPAQUE_ALPHA = 250;
const GATE_AR_MIN = 0.4;
const GATE_AR_MAX = 9.0;

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

async function inspectRaster(file) {
  const p = join(DIR, file);
  const bytes = statSync(p).size;
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const ar = width / height;
  const px = (x, y) => { const i = (y * width + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const corners = [px(0, 0), px(width - 1, 0), px(0, height - 1), px(width - 1, height - 1)];

  const fails = [];
  const warns = [];

  // guard.banner
  if (width >= BANNER_MIN_W && ar > BANNER_AR) fails.push('guard.banner');

  // guard.corners / guard.knockout
  const transparentCorner = corners.some((c) => c[3] < TRANSPARENT_ALPHA);
  let knockout = null;
  if (!transparentCorner) {
    const bg = corners[0];
    let kept = 0, lumSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
      if (d >= KNOCKOUT_DIST) { kept++; lumSum += lum(data[i], data[i + 1], data[i + 2]); }
    }
    knockout = { keptFrac: kept / (width * height), meanLum: kept ? lumSum / kept : null };
    if (knockout.keptFrac < KNOCKOUT_MIN_KEPT) fails.push('guard.knockout.kept<2%');
    else if (knockout.meanLum > LUM_MAX) fails.push('guard.knockout.lum>215');
  }

  // gate.opaque / gate.aspect
  const opaqueCorners = corners.filter((c) => c[3] >= GATE_OPAQUE_ALPHA).length;
  if (opaqueCorners === 4) fails.push('gate.opaque');
  else if (opaqueCorners >= 2) warns.push(`gate.corners ${opaqueCorners}/4`);
  if (ar < GATE_AR_MIN || ar > GATE_AR_MAX) warns.push('gate.aspect');

  // informational: visible-pixel luminance
  let vis = 0, visLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= TRANSPARENT_ALPHA) { vis++; visLum += lum(data[i], data[i + 1], data[i + 2]); }
  }
  const visibleFrac = vis / (width * height);
  const visibleLum = vis ? visLum / vis : null;
  if (transparentCorner && visibleLum !== null && visibleLum > LUM_MAX) warns.push('info.pale-mark');

  return { file, kind: 'raster', bytes, width, height, ar: +ar.toFixed(2), transparentCorner, opaqueCorners,
    knockout, visibleFrac: +visibleFrac.toFixed(3), visibleLum: visibleLum === null ? null : Math.round(visibleLum),
    fails, warns };
}

function inspectSvg(file) {
  const p = join(DIR, file);
  return { file, kind: 'svg', bytes: statSync(p).size, width: null, height: null, ar: null,
    transparentCorner: null, opaqueCorners: null, knockout: null, visibleFrac: null, visibleLum: null,
    fails: [], warns: ['skipped (vector; neither guard nor gate inspects SVG)'] };
}

const files = readdirSync(DIR).filter((f) => /\.(png|webp|jpe?g|svg)$/i.test(f)).sort();
const rows = [];
for (const f of files) {
  try {
    rows.push(/\.svg$/i.test(f) ? inspectSvg(f) : await inspectRaster(f));
  } catch (e) {
    rows.push({ file: f, kind: 'raster', fails: [`unreadable: ${e.message}`], warns: [] });
  }
}

const fmt = (v) => (v === null || v === undefined ? '' : String(v));
console.log('| file | WxH | aspect | bytes | corners | knockout kept / lum | visible lum (info) | verdict |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  const dims = r.width ? `${r.width}x${r.height}` : 'svg';
  const corners = r.kind === 'svg' ? '' : (r.transparentCorner ? 'transparent' : `opaque ${r.opaqueCorners}/4`);
  const ko = r.knockout ? `${(r.knockout.keptFrac * 100).toFixed(1)}% / ${r.knockout.meanLum === null ? '' : Math.round(r.knockout.meanLum)}` : '';
  const verdict = r.fails.length ? `FAIL ${r.fails.join(', ')}` : (r.warns.length ? `pass (${r.warns.join('; ')})` : 'pass');
  console.log(`| ${r.file} | ${dims} | ${fmt(r.ar)} | ${r.bytes} | ${corners} | ${ko} | ${fmt(r.visibleLum)} | ${verdict} |`);
}
const rasters = rows.filter((r) => r.kind === 'raster');
const failed = rasters.filter((r) => r.fails.length);
console.log(`\naudit-logos-retro: ${rows.length} file(s), ${rasters.length} raster, ${rows.length - rasters.length} svg; ${failed.length} raster FAIL, ${rasters.filter((r) => r.warns.length).length} raster with warnings/info.`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(rows, null, 2));

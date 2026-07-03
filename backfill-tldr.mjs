#!/usr/bin/env node
// One-off backfill: lift each post's inline `<div class="quick-answer">` into a
// frontmatter `tldr:` field (rendered at the top of the post by BlogPostLayout),
// then remove the now-duplicate inline quick-answer block. Posts with no
// quick-answer fall back to their `<BottomLine verdict="...">` or description.
//
// Dry-run by default (prints the proposed tldr per post, changes nothing).
// Pass --write to modify files in place. Idempotent: skips deriving a tldr when
// one already exists, and still removes a leftover quick-answer div on re-runs.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(HERE, 'src', 'content', 'blog');
const WRITE = process.argv.includes('--write');

const DASHES = /[—–]/g; // em / en dash, banned in Ian's content

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, ', ')
    .replace(/&ndash;/g, ', ');
}

function toPlain(html) {
  let t = html;
  t = t.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1'); // links -> link text
  t = t.replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  t = t.replace(/<[^>]+>/g, ''); // any remaining tags
  t = decodeEntities(t);
  t = t.replace(DASHES, ', ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

const QA_RE = /<div class=["']quick-answer["'][^>]*>([\s\S]*?)<\/div>/i;

function extractQuickAnswer(body) {
  const m = body.match(QA_RE);
  if (!m) return null;
  return toPlain(m[1]).replace(/^quick answer:?\s*/i, '').trim();
}

function extractVerdict(body) {
  const m = body.match(/verdict="([\s\S]*?)"/i);
  return m ? toPlain(m[1]) : null;
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return null;
  const fence = raw.indexOf('\n---', 3);
  if (fence === -1) return null;
  const fmEnd = raw.indexOf('\n', fence + 1); // newline ending the closing --- line
  if (fmEnd === -1) return null;
  return { fm: raw.slice(0, fmEnd + 1), body: raw.slice(fmEnd + 1) };
}

const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
let changed = 0, skipped = 0, noSource = 0;

for (const file of files) {
  const path = join(BLOG_DIR, file);
  const raw = readFileSync(path, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts) { console.log(`!! ${file}: no frontmatter, skipped`); continue; }
  const { fm, body } = parts;
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';

  const hasTldr = /\n\s*tldr:\s*/.test('\n' + fm);
  const qa = extractQuickAnswer(body);

  let tldr = null;
  if (!hasTldr) {
    tldr = qa || extractVerdict(body);
    if (!tldr) {
      const dm = fm.match(/\ndescription:\s*"([\s\S]*?)"\s*\n/);
      tldr = dm ? toPlain(dm[1]) : null;
    }
  }

  // Remove the inline quick-answer block, then collapse the leftover blank-line
  // run to a single blank line (EOL-agnostic: these files are CRLF).
  let newBody = body;
  if (qa !== null) {
    newBody = newBody.replace(new RegExp(`[ \\t]*${QA_RE.source}[ \\t]*`, 'i'), '');
    newBody = newBody.replace(/(?:\r?\n){3,}/g, eol + eol);
  }

  // Insert tldr right after the description: line in frontmatter. Use function
  // replacers so a `$` in the tldr text (e.g. "$30/month") is written literally
  // instead of being parsed as a replacement-string backreference token.
  let newFm = fm;
  if (!hasTldr && tldr) {
    const yaml = `tldr: ${JSON.stringify(tldr)}`;
    newFm = /\ndescription:\s/.test(fm)
      ? fm.replace(/(\ndescription:[^\n]*\n)/, (m) => m + yaml + eol)
      : fm.replace(/^---\r?\n/, (m) => m + yaml + eol);
  }

  const updated = newFm + newBody;

  if (hasTldr && qa === null) { skipped++; console.log(`== ${file}: already has tldr, nothing to move`); continue; }
  if (!tldr && qa === null) { noSource++; console.log(`?? ${file}: no quick-answer / verdict / description`); continue; }

  console.log(`\n-- ${file}`);
  if (tldr) console.log(`   tldr: ${tldr.slice(0, 170)}${tldr.length > 170 ? '...' : ''}`);
  if (qa !== null) console.log('   removed inline quick-answer div');

  if (updated !== raw) {
    changed++;
    if (WRITE) writeFileSync(path, updated, 'utf8');
  }
}

console.log(`\n${WRITE ? 'WROTE' : 'DRY-RUN'}: ${changed} changed, ${skipped} skipped, ${noSource} no-source (of ${files.length}).`);
if (!WRITE) console.log('Re-run with --write to apply.');

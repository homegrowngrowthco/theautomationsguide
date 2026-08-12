// Freshness gate (growth audit S-3): a substantive edit to an EXISTING post must
// bump its `updatedDate`, so the freshness signal doesn't silently decay.
//
// Why this exists: PR #180 bootstrapped updatedDate across the corpus and PR #226
// bumped a handful by hand, but nothing enforced it. Every later edit that skipped
// the bump left the post claiming a stale last-reviewed date — the signal degrades
// exactly as the corpus grows, which is when it matters most.
//
// Scope, deliberately narrow so it can't wedge the daily engine:
//   - NEW posts are exempt (pubDate is the freshness signal on day one). The
//     engine's content PRs only ever add a post, so this gate is inert for them,
//     including the `[qa-fix-N]` auto-fixer commits that preserve frontmatter.
//   - Frontmatter-only edits are exempt (a title/description tweak is metadata,
//     not a content refresh — and bumping on those would confound title tests).
//   - Whitespace/reflow-only edits are exempt (comparison normalizes whitespace).
//
// So it fires on exactly one thing: prose/component changes to a post that already
// shipped. That is the class the audit flagged.
//
// Usage:
//   node qa/lint-freshness.mjs                 # changed posts vs origin/master
//   node qa/lint-freshness.mjs --base <ref>    # compare against an explicit ref
//   node qa/lint-freshness.mjs --list          # report only, always exit 0
//
// Escape hatch: put [skip-freshness] in the HEAD commit subject (for a deliberate
// no-bump edit, e.g. reverting a title experiment).

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const LIST_ONLY = args.includes('--list');
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const BLOG_PREFIX = 'src/content/blog/';

// stderr is ignored on purpose: `git show <base>:<new-file>` legitimately fails
// for every newly-added post, and letting git's "fatal: path ... exists on disk,
// but not in <sha>" reach the CI log makes a healthy run look broken.
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const gitQuiet = (...a) => { try { return git(...a); } catch { return null; } };

// ---- base ref ------------------------------------------------------------
// Prefer the merge-base with origin/master so posts merged to master while this
// branch sat open aren't mis-read as this branch's edits (same three-dot logic
// the content QA workflow uses to pick the changed post).
function resolveBase() {
  const explicit = getArg('--base');
  if (explicit) return explicit;
  for (const ref of ['origin/master', 'master']) {
    const mb = gitQuiet('merge-base', 'HEAD', ref);
    if (mb) return mb;
  }
  return null;
}

const BASE = resolveBase();
if (!BASE) {
  console.log('[freshness] no origin/master or master to compare against; skipping.');
  process.exit(0);
}

// ---- skip token ----------------------------------------------------------
const headSubject = gitQuiet('log', '-1', '--pretty=%s') || '';
if (/\[skip-freshness\]/i.test(headSubject)) {
  console.log('[freshness] [skip-freshness] in HEAD commit subject; skipping.');
  process.exit(0);
}

// ---- changed posts -------------------------------------------------------
// --diff-filter=d drops deletions so we never stat a path that isn't checked out.
const changed = (gitQuiet('diff', '--name-only', '--diff-filter=d', `${BASE}...HEAD`, '--', `${BLOG_PREFIX}*.mdx`) || '')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

if (!changed.length) {
  console.log('[freshness] no blog posts changed; nothing to check.');
  process.exit(0);
}

// ---- helpers -------------------------------------------------------------
// Strip a leading UTF-8 BOM before anything else: with a BOM the ^--- anchor
// misses, frontmatter parses as empty, and a post with a perfectly good
// updatedDate reports as having none. Same quote/CRLF-fragility class the
// registry parsers already guard against (CLAUDE.md gotcha 9).
function splitFrontmatter(src) {
  const clean = src.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const m = clean.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: clean };
}

// Substantive == differs after whitespace normalization. A reflow, a trailing-space
// cleanup, or a CRLF flip is not a content refresh and must not demand a bump.
const normalize = (s) => s.replace(/\s+/g, ' ').trim();

const updatedDateOf = (fm) => {
  const m = fm.match(/^updatedDate:\s*['"]?([0-9]{4}-[0-9]{2}-[0-9]{2})['"]?/m);
  return m ? m[1] : null;
};

const today = new Date().toISOString().slice(0, 10);

// ---- check ---------------------------------------------------------------
const violations = [];
const ok = [];

for (const file of changed) {
  if (!existsSync(file)) continue;

  const before = gitQuiet('show', `${BASE}:${file}`);
  if (before === null) { ok.push(`${file}: new post (exempt)`); continue; }

  const oldSide = splitFrontmatter(before);
  const newSide = splitFrontmatter(readFileSync(file, 'utf8'));

  if (normalize(oldSide.body) === normalize(newSide.body)) {
    ok.push(`${file}: no substantive body change (exempt)`);
    continue;
  }

  const oldDate = updatedDateOf(oldSide.fm);
  const newDate = updatedDateOf(newSide.fm);

  if (!newDate) {
    violations.push(`${file}\n    body changed but frontmatter has no updatedDate. Add:  updatedDate: ${today}`);
  } else if (oldDate === newDate) {
    violations.push(`${file}\n    body changed but updatedDate is still ${newDate}. Bump it to ${today} (or the date you actually reviewed the post).`);
  } else {
    ok.push(`${file}: updatedDate ${oldDate || '(none)'} -> ${newDate}`);
  }
}

for (const line of ok) console.log(`  ok   ${line}`);
for (const v of violations) console.log(`  FAIL ${v}`);

console.log(`\n[freshness] ${changed.length} changed post(s): ${violations.length} violation(s).`);

if (violations.length && !LIST_ONLY) {
  console.log('\nA substantive edit to a published post should move its last-reviewed date,');
  console.log('or the freshness signal decays. Bump updatedDate, or add [skip-freshness]');
  console.log('to the commit subject if the edit genuinely is not a content refresh.');
  process.exit(1);
}
process.exit(0);

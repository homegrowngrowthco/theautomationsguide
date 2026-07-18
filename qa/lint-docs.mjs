#!/usr/bin/env node
// Docs-hygiene guardrail (added 2026-07-17 docs cleanup). Deterministic, no deps.
//
// Enforces:
//   1. CLAUDE.md stays lean (auto-injected into every Claude session): HARD fail > MAX_CLAUDE_LINES.
//   2. TODO.md holds OPEN tasks only: HARD fail on any "- [x]" line (delete items when done;
//      history lives in docs/SESSION_LOG.md).
//   3. TODO.md items stay scannable: WARN when a single item line exceeds MAX_ITEM_CHARS.
//   4. CLAUDE.md "current state" stays fresh: HARD fail when its dated heading is >14 days
//      behind the latest non-docs commit; WARN when the dated heading is missing.
//
// Usage: node qa/lint-docs.mjs   (npm run qa:docs). Exit 1 on any HARD failure.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_CLAUDE_LINES = 400;
const MAX_ITEM_CHARS = 400;

let hard = 0;
let warn = 0;

const claude = readFileSync(resolve(root, 'CLAUDE.md'), 'utf8');
const claudeLines = claude.split(/\r?\n/).length;
if (claudeLines > MAX_CLAUDE_LINES) {
  hard++;
  console.error(`HARD  CLAUDE.md is ${claudeLines} lines (max ${MAX_CLAUDE_LINES}). It is auto-injected every session; move history to docs/SESSION_LOG.md.`);
}

const todo = readFileSync(resolve(root, 'TODO.md'), 'utf8');
todo.split(/\r?\n/).forEach((line, i) => {
  if (/^\s*-\s*\[x\]/i.test(line)) {
    hard++;
    console.error(`HARD  TODO.md:${i + 1} contains a done item. Delete it (history lives in docs/SESSION_LOG.md).`);
  }
  if (/^\s*-\s*\[ \]/.test(line) && line.length > MAX_ITEM_CHARS) {
    warn++;
    console.warn(`WARN  TODO.md:${i + 1} item is ${line.length} chars (target <= ${MAX_ITEM_CHARS}). Move detail to the linked doc.`);
  }
});

// 4. Stale current-state check: the dated "current state" heading in CLAUDE.md must not
//    lag the newest non-docs commit by more than 14 days.
const stateMatch = claude
  .split(/\r?\n/)
  .filter((l) => /^#{1,6}\s/.test(l))
  .map((l) => l.match(/current.*state.*\((\d{4}-\d{2}-\d{2})\)/i))
  .find(Boolean);
const stateDate = stateMatch ? stateMatch[1] : null;
let codeDate = '';
try {
  codeDate = execFileSync(
    'git',
    ['log', '-1', '--format=%cs', '--', '.', ':(exclude)*.md', ':(exclude)docs/', ':(exclude)audits/'],
    { cwd: root, encoding: 'utf8' },
  ).trim();
} catch {
  // git unavailable or not a repo; skip the staleness comparison
}
if (!stateDate) {
  warn++;
  console.warn('WARN  CLAUDE.md has no dated current-state heading (expected e.g. "## Current strategic state (YYYY-MM-DD)").');
} else if (codeDate) {
  const lagDays = (Date.parse(codeDate) - Date.parse(stateDate)) / 86400000;
  if (lagDays > 14) {
    hard++;
    console.error(`HARD  CLAUDE.md current-state header (${stateDate}) is >14 days behind the latest code change (${codeDate}). Update the section and its date.`);
  }
}

console.log(`lint-docs: ${hard} hard, ${warn} warnings (CLAUDE.md ${claudeLines} lines, state ${stateDate ?? 'missing'})`);
process.exit(hard ? 1 : 0);

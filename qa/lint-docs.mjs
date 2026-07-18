#!/usr/bin/env node
// Docs-hygiene guardrail (added 2026-07-17 docs cleanup). Deterministic, no deps.
//
// Enforces:
//   1. CLAUDE.md stays lean (auto-injected into every Claude session): HARD fail > MAX_CLAUDE_LINES.
//   2. TODO.md holds OPEN tasks only: HARD fail on any "- [x]" line (delete items when done;
//      history lives in docs/SESSION_LOG.md).
//   3. TODO.md items stay scannable: WARN when a single item line exceeds MAX_ITEM_CHARS.
//
// Usage: node qa/lint-docs.mjs   (npm run qa:docs). Exit 1 on any HARD failure.

import { readFileSync } from 'node:fs';
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

console.log(`lint-docs: ${hard} hard, ${warn} warnings (CLAUDE.md ${claudeLines} lines)`);
process.exit(hard ? 1 : 0);

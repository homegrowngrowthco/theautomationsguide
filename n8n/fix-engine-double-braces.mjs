// HOTFIX — the Generate Draft prompt's DecisionTree schema examples contained
// literal `tree={{ ... }}`. The node body is an n8n expression `={{ JSON.stringify(...) }}`,
// and n8n's expression parser treats `{{`/`}}` as the expression delimiters — so the
// FIRST inner `}}` (inside the prompt text) prematurely closed the expression and the
// 2026-06-04 08:00 run failed at Generate Draft with "invalid syntax". (Same class as
// the Session 10 backtick break: my `new Function` compile-test passed because the JS is
// valid; it's n8n's expression tokenizer that breaks. See
// feedback_no_backticks_in_template_literal_prompts — now also covers {{ }}.)
//
// Fix: in Generate Draft + Humanize, keep ONLY the outer ={{ ... }} delimiters and
// space every INNER `{{`->`{ {` and `}}`->`} }`. Spaced braces are still valid JSX in
// the generated MDX (tree={ {...} } renders identically to tree={{...}}), and single
// braces (tools={[...]}) were never a problem.
//
// Idempotent: after the fix there are no inner double-braces, so re-running is a no-op.
// After running: deploy with n8n/deploy-engine.mjs --apply.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const changes = [];

for (const name of ['Generate Draft', 'Humanize']) {
  const node = doc.nodes.find((n) => n.name === name);
  const b = node.parameters.body;
  const start = b.indexOf('{{');        // outer open: '={{'
  const end = b.lastIndexOf('}}');      // outer close: '}) }}'
  if (start < 0 || end <= start) continue;
  const head = b.slice(0, start + 2);   // '={{'
  let mid = b.slice(start + 2, end);    // expression interior (incl. the prompt template literal)
  const tail = b.slice(end);            // '}}'
  const before = mid;
  mid = mid.replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }');
  if (mid !== before) {
    node.parameters.body = head + mid + tail;
    changes.push(`${name}: spaced ${(before.match(/\{\{|\}\}/g) || []).length} inner double-brace token(s)`);
  }
}

writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log(changes.length ? 'Applied:\n' + changes.map((c) => '  - ' + c).join('\n') : 'No inner double-braces — already clean.');

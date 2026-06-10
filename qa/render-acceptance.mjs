// Deterministic RENDERED-RESULT acceptance test — the layer that was missing.
// lint-content.mjs checks syntax and `npm run build` checks compilation, but
// nothing checked what the page actually rendered to. This parses the BUILT
// dist/blog/<slug>/index.html and hard-fails on rendered-result invariants,
// catching the CLASS of defect (not the instance) that reached Ian on PR #65.
//
//   node qa/render-acceptance.mjs --post src/content/blog/<file>.mdx   # one file (CI)
//   node qa/render-acceptance.mjs --slug <slug>                        # one file by slug
//   node qa/render-acceptance.mjs --all                                # every built post
//
// Requires `npm run build` to have run first (reads dist/). Exit 1 on any HARD
// violation. Pairs with the registry-completeness check in lint-content.mjs (A3):
// that one is source-side ("a compared tool has no logo in the registry"); this
// one is render-side ("the registry says there's a logo but it didn't render").

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { loadLogoRegistry, extractTagBlocks, refdLogoSlugs, splitFrontmatter } from './registry.mjs';

const BLOG_DIR = 'src/content/blog';
const DIST_DIR = 'dist/blog';
const args = process.argv.slice(2);
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

const { logoByKey } = loadLogoRegistry();

function checkPost(file) {
  const slug = path.basename(file).replace(/\.mdx?$/, '');
  const raw = readFileSync(file, 'utf-8');
  const { fm, body } = splitFrontmatter(raw);
  const isDraft = /^draft:\s*true\s*$/m.test(fm);
  const distHtml = path.join(DIST_DIR, slug, 'index.html');
  const hard = [];

  if (!existsSync(distHtml)) {
    // Drafts are intentionally not built — skip rather than fail.
    if (isDraft) return { slug, hard, skipped: true };
    hard.push(`${distHtml} does not exist — the post failed to render (build degraded/crashed for this slug).`);
    return { slug, hard };
  }

  const html = readFileSync(distHtml, 'utf-8');
  const { document } = parseHTML(html);

  // 1) Post rendered — non-trivial content (turns an array-prop build degradation
  //    or an empty render into a NAMED content failure instead of a silent pass).
  const h1 = document.querySelector('h1');
  const textLen = (document.querySelector('body')?.textContent || '').trim().length;
  if (!h1) hard.push('rendered page has no <h1> (post body did not render).');
  if (textLen < 800) hard.push(`rendered page is near-empty (${textLen} chars of text) — likely a degraded render.`);

  // 2) DecisionTree integrity — every source branch must render. A leaf branch
  //    renders a .dtree-leaf; a nested branch renders another .dtree-q. So
  //    rendered leaves must equal source `result:` count, and rendered questions
  //    must equal source `question:` count. A mismatch = a dropped/cramped branch.
  const dtBlocks = extractTagBlocks(body, 'DecisionTree');
  if (dtBlocks.length) {
    let srcResults = 0, srcQuestions = 0;
    for (const blk of dtBlocks) {
      srcResults += (blk.match(/\bresult:/g) || []).length;
      srcQuestions += (blk.match(/\bquestion:/g) || []).length;
    }
    const renderedLeaves = document.querySelectorAll('.dtree-leaf').length;
    const renderedQuestions = document.querySelectorAll('.dtree-q').length;
    if (renderedLeaves < srcResults)
      hard.push(`DecisionTree: ${srcResults} leaf result(s) in source but only ${renderedLeaves} rendered (dropped branch).`);
    if (renderedQuestions < srcQuestions)
      hard.push(`DecisionTree: ${srcQuestions} question node(s) in source but only ${renderedQuestions} rendered (dropped sub-decision).`);
  }

  // 3) Logo render integrity — every ToolBreakdown/ChooseIf tool that resolves to
  //    a registry logo MUST render its <img>. Lenient: only counts slugs the
  //    registry has a logo for, and asserts rendered >= expected (a name-resolved
  //    logo we didn't count only ever raises the rendered total). Catches the
  //    PR #65 class where the logo silently dropped out.
  const expectedLogos = refdLogoSlugs(body).filter((s) => logoByKey.has(s)).length;
  const renderedLogos = document.querySelectorAll('.tbd-logo, .ci-logo').length;
  if (renderedLogos < expectedLogos)
    hard.push(`logos: expected at least ${expectedLogos} tool logo(s) from the registry but ${renderedLogos} rendered (a compared tool lost its logo).`);

  return { slug, hard };
}

// ---- target selection (mirrors lint-content.mjs) -------------------------
let files = [];
if (getArg('--post')) files = [getArg('--post')];
else if (getArg('--slug')) files = [path.join(BLOG_DIR, getArg('--slug') + '.mdx')];
else if (args.includes('--all')) files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => path.join(BLOG_DIR, f));
else { console.error('Usage: --post <path> | --slug <slug> | --all   (run `npm run build` first)'); process.exit(2); }

let hardTotal = 0, skipped = 0;
for (const file of files) {
  const { slug, hard, skipped: sk } = checkPost(file);
  if (sk) { skipped++; continue; }
  if (hard.length) {
    console.log(`\n${slug}`);
    hard.forEach((h) => console.log(`  ✗ HARD: ${h}`));
  }
  hardTotal += hard.length;
}
console.log(`\nrender-acceptance: ${files.length - skipped} post(s) checked, ${skipped} skipped (draft/unbuilt): ${hardTotal} hard.`);
process.exit(hardTotal > 0 ? 1 : 0);

// One-shot script: rewrites blog-post-engine.json to produce MDX with components.
// Usage:  node n8n/update-engine-for-mdx.mjs
//
// What it does:
//   - Replaces Generate Draft prompt with per-post-type MDX skeleton + affiliate-link rules
//   - Adds verification rules to Humanize prompt (imports preserved, MyTake check, /go links)
//   - Updates Parse Draft to emit .mdx filename and a sibling filePathMd for legacy lookup
//   - Updates Check Idempotency to look at .mdx
//   - Adds Check Idempotency MD node before Confirm Not Exists, wires it in the connections graph
//   - Updates Confirm Not Exists to abort if EITHER .mdx or .md exists
//
// After running: review the JSON diff, re-import to n8n, smoke test on one queued topic.

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('n8n/blog-post-engine.json');
const BACKUP = path.resolve('n8n/blog-post-engine.pre-mdx.json.bak');

// Backup the current version.
copyFileSync(FILE, BACKUP);
console.log(`→ Backup written to ${BACKUP}`);

const json = JSON.parse(readFileSync(FILE, 'utf8'));

// ── New Generate Draft prompt ─────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior RevOps practitioner writing for theautomationsguide.com. The audience is RevOps and GTM operators evaluating sales/marketing automation tools (HubSpot, Salesforce, Clay, Apollo, n8n, Zapier, Outreach, Gong, Make, Smartlead, Instantly, Lemlist, Pipedrive, Beehiiv, Kit, etc).

Write for peers, not beginners. Be specific. Reference real tool names, real workflow steps, real numbers. Have opinions.

You write MDX (Markdown + JSX) for an Astro static site. The site has a visual component library you must use to make posts engaging — not walls of text.`;

const USER_PROMPT_TEMPLATE = `Write a blog post in MDX for theautomationsguide.com.

TOPIC: \${$('Parse Topic').first().json.blogTopic}
NOTES: \${$('Parse Topic').first().json.topicNotes || '(none)'}
TARGET KEYWORD: \${$('Parse Topic').first().json.targetKeyword || '(use your judgment)'}
PRIMARY TAG: \${$('Parse Topic').first().json.primaryTag || 'revops'}

POST TYPE — pick one based on tag/topic:
- comparison: head-to-head tool reviews ("X vs Y", "best [tool] for [use case]") — 1100-1400 words
- tutorial: step-by-step playbooks, how-tos — 800-1100 words
- framework: opinionated strategy/framework pieces ("The X Stack in 2026") — 900-1200 words
- opinion: short takes, news commentary, contrarian arguments — 600-900 words
Default to framework if unclear.

REQUIRED IMPORTS — paste this exact block right after the frontmatter ---:

import SideBySide from '@/components/post/SideBySide.astro';
import StatRow from '@/components/post/StatRow.astro';
import PullQuote from '@/components/post/PullQuote.astro';
import MyTake from '@/components/post/MyTake.astro';
import StepRow from '@/components/post/StepRow.astro';
import Figure from '@/components/post/Figure.astro';
import ComparisonTable from '@/components/ComparisonTable.astro';

POST SKELETON BY TYPE:

COMPARISON:
- One-paragraph hook
- <div class="quick-answer"><strong>Quick answer:</strong> [TL;DR]</div>
- <StatRow stats={[ { number, label, description }, ...3 facts ]} />
- <ComparisonTable title="..." tools={[ { name, tagline, pros: [...], cons: [...], pricing, affiliateSlug, ctaLabel, highlight: true|false }, ...2-4 tools ]} />
- One ## section "How to choose" with 1-2 paragraphs
- <SideBySide><Fragment slot="left">decision criteria text — 2-3 short paragraphs</Fragment><Fragment slot="right"><Figure caption="..."><svg viewBox="0 0 360 260" xmlns="http://www.w3.org/2000/svg">{/* simple decision tree, 3-4 boxes */}</svg></Figure></Fragment></SideBySide>
- <MyTake>contrarian or experiential claim, 2-3 sentences</MyTake>
- One ## section, single takeaway paragraph (no "in conclusion")

TUTORIAL:
- One-paragraph hook
- <div class="quick-answer">...</div>
- One ## section setting up the workflow + ~150 words context
- <StepRow steps={[ { title, body }, ...3-5 steps ]} />
- <SideBySide><Fragment slot="left">gotcha or trap text</Fragment><Fragment slot="right">code/config example in a fenced markdown block</Fragment></SideBySide>
- <MyTake>experience-based claim from running this in production</MyTake>
- One ## section, single takeaway paragraph

FRAMEWORK:
- One-paragraph hook
- <div class="quick-answer">...</div>
- <PullQuote>thesis statement, 1-2 sentences, no attribution unless quoting someone real</PullQuote>
- <StatRow stats={[...3 evidence facts]} />
- 2 ## sections, each with one paragraph + ONE component (SideBySide, ComparisonTable, or Figure)
- <MyTake>contrarian claim about the framework</MyTake>
- One ## section, single takeaway paragraph

OPINION:
- <PullQuote>opening thesis</PullQuote>
- 2-3 ## sections — pure prose, can include 1-2 components total (one SideBySide max)
- <MyTake>your contrarian/experiential angle</MyTake>
- No takeaway section needed — let MyTake be the close

AFFILIATE LINKS — on the FIRST mention of any of these tools, link /go/<slug>. Don't repeat the link on later mentions:
hubspot, make, n8n, apollo, clay, beehiiv, smartlead, pipedrive, lemlist, kit
Example: "[Make](/go/make) shines when..." → after that, just say "Make".

MyTake RULES:
- Contrarian or experience-based claim ONLY (not a summary, not a generic "I think...")
- 2-3 sentences max
- If you don't have a real opinion, omit the block entirely
- Maximum one MyTake per post

SVG / MDX SYNTAX RULE:
- This is MDX, not HTML. Inside any inline <svg> (or any JSX context), do NOT use HTML <!-- comments -->. They will break the build.
- If you need a comment inside SVG, use JSX comments: {/* comment text */}.
- Better: omit comments entirely. SVG element names already document themselves.

QUICK ANSWER RULES:
- Single sentence, plain language
- Place immediately after the hook paragraph (or after PullQuote for opinion posts)
- Exact pattern: <div class="quick-answer"><strong>Quick answer:</strong> [text].</div>

FAQS RULES:
- Frontmatter must include 3-5 faqs
- Each FAQ answers something a reader would type into Google
- Answers 1-2 sentences, factually consistent with body

OUTPUT FORMAT — exactly this, no commentary, no code fences around the whole thing:

---
title: "[specific, search-friendly, under 65 chars]"
description: "[1-2 sentences, 140-160 chars, SEO meta]"
pubDate: \${new Date().toISOString().split('T')[0]}
tags: ["\${$('Parse Topic').first().json.primaryTag || 'revops'}", "automation", "[third tag]"]
faqs:
  - question: "[searchable question]"
    answer: "[1-2 sentences, factually consistent with body]"
  - question: "..."
    answer: "..."
  - question: "..."
    answer: "..."
---

import SideBySide from '@/components/post/SideBySide.astro';
import StatRow from '@/components/post/StatRow.astro';
import PullQuote from '@/components/post/PullQuote.astro';
import MyTake from '@/components/post/MyTake.astro';
import StepRow from '@/components/post/StepRow.astro';
import Figure from '@/components/post/Figure.astro';
import ComparisonTable from '@/components/ComparisonTable.astro';

[skeleton content matching the post type you selected]`;

// Build the HTTP body string the same way n8n expects: ={{ JSON.stringify({...}) }}
// We construct the JS source, n8n evaluates it at runtime per-execution.
function jsTemplateLiteral(text) {
  // Escape backticks (none expected) and embed as a JS template literal so that
  // \${...} interpolations stay live for n8n at runtime.
  return '`' + text.replace(/`/g, '\\`') + '`';
}

const generateDraftBody = `={{ JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 6144, system: [{ type: 'text', text: ${jsTemplateLiteral(SYSTEM_PROMPT)}, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: ${jsTemplateLiteral(USER_PROMPT_TEMPLATE)} }] }) }}`;

// ── New Humanize prompt ───────────────────────────────────────────
const HUMANIZE_SYSTEM = `You are an editor for a RevOps practitioner's blog. Rewrite AI-generated MDX draft content so it sounds like a senior operator wrote it — opinionated, specific, varied cadence.

Hard rules:
- DELETE these words/phrases anywhere they appear: delve, crucial, game-changer, streamline, leverage (as a verb), robust, utilize, it's worth noting, in conclusion, in today's landscape, cutting-edge, seamlessly, navigating the, unlock the power, dive into, at the end of the day, moving the needle, low-hanging fruit
- Vary sentence length deliberately. Mix short punchy sentences with longer ones.
- Add at least one specific opinionated claim per major section (contrarian take, "don't bother with X — use Y instead", concrete recommendation)
- Replace generic examples with specific tool names, real workflow steps, or concrete numbers

PRESERVATION rules — DO NOT MODIFY:
- The frontmatter block (--- ... ---) including faqs array — keep title/description/pubDate/tags/faqs exactly intact.
- The import block (the seven import lines starting with 'import SideBySide'). Verify all 7 imports are present and in order.
- The <div class="quick-answer">...</div> block.
- All JSX components: <StatRow>, <ComparisonTable>, <SideBySide>, <PullQuote>, <StepRow>, <Figure>, <MyTake>. You may rewrite their text props/slot content for voice but never change tag names, prop names, or remove components.
- /go/<slug> affiliate links — keep them. If first mention of an affiliate tool (hubspot, make, n8n, apollo, clay, beehiiv, smartlead, pipedrive, lemlist, kit) is missing its /go link, add it.

VERIFY before output:
- Exactly one <MyTake> block exists (or zero — never more). If the existing MyTake reads as a generic summary instead of a contrarian/experiential claim, rewrite it as a sharp contrarian take. If you can't make it sharp, delete the block entirely.

Output only the rewritten MDX, no commentary, no code fences around the whole thing.`;

const humanizeBody = `={{ JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 6144, system: [{ type: 'text', text: ${jsTemplateLiteral(HUMANIZE_SYSTEM)}, cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: \`Rewrite this MDX draft:\\n\\n\${$json.content[0].text}\` }] }) }}`;

// ── New Parse Draft jsCode ────────────────────────────────────────
const parseDraftCode = `// Take the humanized MDX draft, extract the title, build a slug + filename + branch name.
// Outputs both filePath (.mdx, canonical) and filePathMd (.md, legacy idempotency check).
const response = $input.first().json;
const topic = $('Parse Topic').first().json;

if (!response.content || !Array.isArray(response.content) || !response.content[0]?.text) {
  throw new Error('Humanize response malformed: ' + JSON.stringify(response).substring(0, 500));
}

const markdown = response.content[0].text.trim();

if (!markdown.startsWith('---')) {
  throw new Error('Generated MDX missing frontmatter block. First 200 chars: ' + markdown.substring(0, 200));
}

const titleMatch = markdown.match(/^---[\\s\\S]*?^title:\\s*[\"']?(.+?)[\"']?\\s*$/m);
if (!titleMatch) {
  throw new Error('Could not parse title from frontmatter.');
}
const title = titleMatch[1].trim().replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');

// Sanity check: import block must be present.
if (!markdown.includes(\"import SideBySide from '@/components/post/SideBySide.astro'\")) {
  throw new Error('MDX missing required component imports. Engine prompt may be drifting — review Generate Draft output.');
}

const slug = title.toLowerCase()
  .replace(/[^a-z0-9\\s-]/g, '')
  .trim()
  .replace(/\\s+/g, '-')
  .replace(/-+/g, '-')
  .substring(0, 60)
  .replace(/-$/, '');

const today = new Date().toISOString().split('T')[0];
const filename = \`\${today}-\${slug}.mdx\`;
const filePath = \`src/content/blog/\${filename}\`;
const filePathMd = \`src/content/blog/\${today}-\${slug}.md\`; // legacy collision check

const branchName = \`content/\${today}-\${slug}\`;
const encodedContent = Buffer.from(markdown).toString('base64');

return [{ json: {
  ...topic,
  markdown,
  title,
  slug,
  filename,
  filePath,
  filePathMd,
  branchName,
  encodedContent,
  pubDate: today,
}}];`;

// ── New Confirm Not Exists jsCode (now checks both .mdx and .md) ──
const confirmCode = `// Verify BOTH the .mdx and the legacy .md path don't already exist on master.
// If either returns 200, abort — we already published this slug.
const draft = $('Parse Draft').first().json;
const mdxResp = $('Check Idempotency MDX').first().json;
const mdResp = $input.first().json; // most recent: Check Idempotency MD

if (mdxResp.statusCode === 200) {
  throw new Error(\`Post already exists at .mdx path: \${draft.filePath}. Skipping to avoid overwrite.\`);
}
if (mdResp.statusCode === 200) {
  throw new Error(\`Post already exists at legacy .md path: \${draft.filePathMd}. Skipping to avoid overwrite.\`);
}
if (mdxResp.statusCode !== 404) {
  throw new Error(\`Unexpected GitHub status \${mdxResp.statusCode} on .mdx idempotency check. Body: \${JSON.stringify(mdxResp.body).substring(0, 300)}\`);
}
if (mdResp.statusCode !== 404) {
  throw new Error(\`Unexpected GitHub status \${mdResp.statusCode} on .md idempotency check. Body: \${JSON.stringify(mdResp.body).substring(0, 300)}\`);
}

console.log(\`Both \${draft.filePath} and \${draft.filePathMd} are absent on \${draft.githubBaseBranch} — safe to commit.\`);
return [{ json: draft }];`;

// ── Apply changes ─────────────────────────────────────────────────
const nodes = json.nodes;

function findNode(name) {
  const n = nodes.find((nd) => nd.name === name);
  if (!n) throw new Error(`Node '${name}' not found in workflow.`);
  return n;
}

// Generate Draft
findNode('Generate Draft').parameters.body = generateDraftBody;
console.log('✓ Updated Generate Draft prompt');

// Humanize
findNode('Humanize').parameters.body = humanizeBody;
console.log('✓ Updated Humanize prompt');

// Parse Draft
findNode('Parse Draft').parameters.jsCode = parseDraftCode;
console.log('✓ Updated Parse Draft (filename → .mdx, added filePathMd)');

// Rename existing Check Idempotency → Check Idempotency MDX
const existingCheck = findNode('Check Idempotency');
existingCheck.name = 'Check Idempotency MDX';
console.log('✓ Renamed Check Idempotency → Check Idempotency MDX');

// Add Check Idempotency MD node
const newCheckMd = {
  parameters: {
    method: 'GET',
    url: '=https://api.github.com/repos/{{ $json.githubOwner }}/{{ $json.githubRepo }}/contents/{{ $json.filePathMd }}?ref={{ $json.githubBaseBranch }}',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'X-GitHub-Api-Version', value: '2022-11-28' },
        { name: 'Accept', value: 'application/vnd.github+json' },
      ],
    },
    options: {
      timeout: 30000,
      response: { response: { neverError: true, fullResponse: true } },
    },
  },
  id: 'tag00001-0000-0000-0000-00000000001a',
  name: 'Check Idempotency MD',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [2110, 300], // between MDX (2000) and Confirm Not Exists (2220)
  credentials: existingCheck.credentials, // reuse the same GitHub PAT credential
};

// Insert into nodes array right after Check Idempotency MDX
const checkMdxIdx = nodes.findIndex((nd) => nd.name === 'Check Idempotency MDX');
nodes.splice(checkMdxIdx + 1, 0, newCheckMd);
console.log('✓ Added Check Idempotency MD node');

// Update Confirm Not Exists code
findNode('Confirm Not Exists').parameters.jsCode = confirmCode;
console.log('✓ Updated Confirm Not Exists logic (checks both .mdx and .md)');

// Update connections graph: rename "Check Idempotency" → "Check Idempotency MDX",
// and inject "Check Idempotency MD" between MDX and Confirm Not Exists.
const conn = json.connections;

// Rename the source key if it was the old name.
if (conn['Check Idempotency']) {
  conn['Check Idempotency MDX'] = conn['Check Idempotency'];
  delete conn['Check Idempotency'];
}

// Re-wire: Check Idempotency MDX → Check Idempotency MD → Confirm Not Exists
// Old: Check Idempotency MDX → Confirm Not Exists
const mdxOut = conn['Check Idempotency MDX'];
if (!mdxOut) throw new Error('Check Idempotency MDX has no outbound connections after rename.');

// Replace the destination
mdxOut.main = [
  [{ node: 'Check Idempotency MD', type: 'main', index: 0 }],
];

// New connection: Check Idempotency MD → Confirm Not Exists
conn['Check Idempotency MD'] = {
  main: [
    [{ node: 'Confirm Not Exists', type: 'main', index: 0 }],
  ],
};

console.log('✓ Re-wired connections graph');

// ── Write back ────────────────────────────────────────────────────
writeFileSync(FILE, JSON.stringify(json, null, 2) + '\n');
console.log(`\n→ ${FILE} updated. Diff against ${BACKUP} to review.`);

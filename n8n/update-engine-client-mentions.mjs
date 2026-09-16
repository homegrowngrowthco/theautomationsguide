// Idempotent engine updater: stop the generator from manufacturing fake-authority
// "client" anecdotes.
//
// Root cause (found during the 2026-09-16 client-mention scrub): update-engine-v5.mjs
// explicitly told Generate Draft to use "my clients" / "clients I've worked with" as
// personal-voice markers, and told Humanize to *inject* lines like "clients who..." /
// "a SaaS team that..." whenever a draft fell short of its first-person-marker quota.
// That is exactly what produced the recurring "I've seen this at half a dozen clients"
// / "my clients who skip this" pattern across ~116 published posts.
//
// This patch:
// 1. Generate Draft: drops "my clients"/"clients I've worked with" from the encouraged
//    first-person markers, and adds a CLIENT MENTIONS hard cap (no scale language, at
//    most 1-2 singular client references per post, most posts should have zero).
// 2. Humanize: same cap as a verify step, and tells the humanizer NOT to reach for
//    client-scale language to pad out the first-person-marker quota.
//
// Usage:  node n8n/update-engine-client-mentions.mjs          (writes blog-post-engine.json)
// Re-running is a no-op. Deploy after with: node n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'n8n/blog-post-engine.json';
const doc = JSON.parse(readFileSync(path, 'utf-8'));
const find = (name) => doc.nodes.find((n) => n.name === name);

const SENTINEL = 'CLIENT MENTIONS';

// ---- 1. Generate Draft ---------------------------------------------------
const gen = find('Generate Draft');
let genBody = gen.parameters.body;

const oldMarkersLine = `- Write in first person. Use "I", "me", "my", "we", "our team", "my clients", "clients I've worked with" naturally. Aim for 3-5 personal-voice markers per post, spread across sections.`;
const newMarkersLine = `- Write in first person. Use "I", "me", "my", "we", "our team" naturally. Aim for 3-5 personal-voice markers per post, spread across sections.`;

const oldFrameLine = `- Frame insights as lived experience: "I've seen X fail when...", "We've run this stack at clients who...", "When my last team tried Y..."`;
const newFrameLine = `- Frame insights as lived experience: "I've seen X fail when...", "When my last team tried Y...", "In my testing..."`;

const clientCapBlock = `CLIENT MENTIONS — hard cap:
- Do not imply a large client roster. Never use scale language like "dozens of clients", "half a dozen clients", "several clients", "multiple clients", "many clients", "clients I've worked with", or "every client engagement".
- At most 1-2 client references per post, total, each singular and specific in feel: "a client I worked with", "one client team", "a SaaS client last quarter." Most posts should have zero.
- Prefer non-client first-person framing instead: "I've seen this fail when...", "in my testing...", "when we ran this internally...", "I'd argue...".

`;

if (!genBody.includes(SENTINEL)) {
  if (!genBody.includes(oldMarkersLine) || !genBody.includes(oldFrameLine)) {
    console.error('Generate Draft: expected PERSONAL VOICE lines not found verbatim. Aborting (engine text may have drifted).');
    process.exit(1);
  }
  genBody = genBody.replace(oldMarkersLine, newMarkersLine).replace(oldFrameLine, newFrameLine);
  genBody = genBody.replace('EXTERNAL CITATIONS — required:', clientCapBlock + 'EXTERNAL CITATIONS — required:');
  gen.parameters.body = genBody;
}

// ---- 2. Humanize ----------------------------------------------------------
const hum = find('Humanize');
let humBody = hum.parameters.body;

const oldVerifyLine = `PERSONAL VOICE verify — confirm the draft contains 3+ first-person markers (I, me, my, we, our team, my clients, clients I've worked with). If fewer than 3, inject natural first-person framing in 2-3 sections (e.g. "I've watched this stack fail at clients who...", "We rebuilt this last quarter for a SaaS team that..."). The author is Ian Chamberland, RevOps consultant at Homegrown Growth Co.`;
const newVerifyLine = `PERSONAL VOICE verify — confirm the draft contains 3+ first-person markers (I, me, my, we, our team). If fewer than 3, inject natural first-person framing in 2-3 sections (e.g. "I've watched this stack fail when...", "We rebuilt this last quarter and found...", "In my testing..."). Do NOT reach for client-scale language to hit this count, see CLIENT MENTIONS verify below. The author is Ian Chamberland, RevOps consultant at Homegrown Growth Co.`;

const clientVerifyBlock = `CLIENT MENTIONS verify — scan for scale language implying a large client roster ("dozens of clients", "half a dozen clients", "several clients", "multiple clients", "many clients", "clients I've worked with", "every client engagement"). Reword down to at most 1-2 singular, specific client references total ("a client I worked with"), or remove entirely if the sentence works without it. Most posts should end with zero client references.

`;

if (!humBody.includes(SENTINEL)) {
  if (!humBody.includes(oldVerifyLine)) {
    console.error('Humanize: expected PERSONAL VOICE verify line not found verbatim. Aborting (engine text may have drifted).');
    process.exit(1);
  }
  humBody = humBody.replace(oldVerifyLine, newVerifyLine);
  humBody = humBody.replace('CITATIONS verify —', clientVerifyBlock + 'CITATIONS verify —');
  hum.parameters.body = humBody;
}

// ---- Write back -------------------------------------------------------------
writeFileSync(path, JSON.stringify(doc, null, 2), 'utf-8');
console.log('client-mentions updates applied (or already present).');

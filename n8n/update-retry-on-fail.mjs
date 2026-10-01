// Idempotent updater: turn on n8n "Retry On Fail" for the TAG workflows' external calls.
//
// Why: on 2026-10-01 a Notion API outage failed 3 scheduled runs, and the PostHog
// Liveness Monitor failed 3 times in September on ECONNABORTED timeouts. None of the
// ~40 external calls across the 7 active TAG workflows retried anything, so a blip of a
// few seconds cost a whole run. This is layer 1 of 3 (seconds-scale blips). Minutes- to
// hours-long outages are handled by the error workflow's delayed re-run
// (build-error-retry.mjs), and runs that never happen by the GitHub Action watchdog
// (n8n/watchdog.mjs).
//
// Only calls that are safe to repeat are listed: reads, PATCHes, LLM calls, Slack posts,
// IndexNow. Calls that CREATE something are deliberately left off, because a request that
// succeeded but timed out would be repeated into a duplicate: GitHub Create Branch /
// Commit File / Open PR and Notion page creates. Those fall through to the error workflow,
// whose re-run resumes from the failed node.
//
// Usage (from repo root):
//   node --env-file=../growth-engine/.env n8n/update-retry-on-fail.mjs           # dry run
//   node --env-file=../growth-engine/.env n8n/update-retry-on-fail.mjs --apply   # push live + sync local JSON
// Re-running is a no-op. Revert one workflow: node n8n/live-patch.mjs --restore <backup> --apply

import { writeFileSync, existsSync } from 'node:fs';
import { patchLive, syncLocalFields } from './live-patch.mjs';

const RETRY = { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 }; // 5000 ms is the UI maximum

const TARGETS = {
  sjZADhZGIuz9tZHK: { file: 'n8n/blog-post-engine.json', nodes: ['Get Next Topic', 'Mark Topic Generating', 'Slack Queue Empty',
    'Fetch Tools Registry', 'Fetch Blog List', 'Generate Draft', 'Humanize', 'Check Idempotency MDX', 'Check Idempotency MD',
    'Get Base SHA', 'Mark Topic In Review', 'Slack Notification', 'Generate Social Outputs', 'Log Cost to Slack'] },
  vfEeiQg3TsPlD24J: { file: 'n8n/topic-suggestor.json', nodes: ['List Published Posts', 'Get Calendar State', 'Generate Suggestions', 'Slack Notify'] },
  coLm8goioffInJ2b: { file: null, nodes: ['Query Ian Tasks', 'Post to Slack'] },
  HbCayxHdzdYdfvfP: { file: 'n8n/daily-briefing.json', nodes: ['Get Open PRs', 'Get Topics State', 'Get Pending Drafts', 'Post Briefing to Slack'] },
  vooFcTsWtyOok7Ps: { file: 'n8n/posthog-monitor.json', nodes: ['Query PostHog', 'Slack Alert'] },
  dxOpkHKeWnilrRmv: { file: null, nodes: ['Query PostHog Clicks', 'Query Instantly Replies', 'Post to Slack'] },
  LKKVtHqiD6cyxBWc: { file: 'n8n/notion-publish-status.json', nodes: ['Find Notion Topic', 'Mark Published', 'Slack Notify',
    'IndexNow Submit', 'Get Google Access Token', 'Google Indexing Submit'] },
};
const NEVER = /^(Create Branch|Commit File|Open PR|Save Twitter Thread|Save LinkedIn Post|Create Suggestion in Notion)$/;

function applyRetry(wf, names) {
  const changes = [];
  for (const name of names) {
    if (NEVER.test(name)) throw new Error(`refusing to retry a create call: ${name}`);
    const n = wf.nodes.find((x) => x.name === name);
    if (!n) { changes.push(`WARN node "${name}" not found (drift?)`); continue; }
    if (Object.entries(RETRY).every(([k, v]) => n[k] === v)) continue;
    Object.assign(n, RETRY);
    changes.push(`${name}: retryOnFail x${RETRY.maxTries}, ${RETRY.waitBetweenTries}ms`);
  }
  return changes.some((c) => !c.startsWith('WARN')) ? changes : [];
}

const APPLY = process.argv.includes('--apply');
for (const [id, t] of Object.entries(TARGETS)) {
  await patchLive(id, (wf) => applyRetry(wf, t.nodes), { apply: APPLY });
  if (t.file && existsSync(t.file)) {
    const { text, changed, missing } = syncLocalFields(t.file, Object.fromEntries(t.nodes.map((n) => [n, RETRY])));
    if (changed.length && APPLY) writeFileSync(t.file, text);
    console.log(`  local ${t.file}: ${changed.length ? `${APPLY ? 'synced' : 'would sync'} ${changed.length} node(s)` : 'already in sync'}${missing.length ? `; not in local JSON (drift): ${missing.join(', ')}` : ''}`);
  }
}

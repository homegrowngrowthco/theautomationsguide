// Idempotent, two-phase setup for the TAG PostHog dashboards.
//
// The analytics PLUMBING is already live (src/components/Analytics.astro fires
// pageviews + the affiliate_click event into PostHog), but there are no
// dashboards to read it. This script creates the 4 dashboards/insights from
// ANALYTICS.md ("Dashboards and funnels worth building") via the PostHog
// management API and pins them to one "TAG Overview" dashboard.
//
// Mirrors the repo's setup-script convention (backlog/build-backlog.mjs,
// n8n/deploy-engine.mjs): .mjs + dotenv, bare global fetch returning
// {ok,status,json}, fail-fast env guards, DRY-RUN by default / --apply to
// mutate, idempotent "create only what's missing", console summary.
//
// Env (project-root .env, loaded by dotenv):
//   POSTHOG_PERSONAL_API_KEY  (required) a personal key (phx_...). The phc_ key
//                             in Analytics.astro is write-only INGEST and cannot
//                             drive the management API. Create one at
//                             PostHog -> Settings -> Personal API keys
//                             (scopes: insight write + dashboard write, project read).
//   POSTHOG_PROJECT_ID        (optional) auto-discovered via GET /api/projects/ if unset.
//   POSTHOG_HOST              (optional) default https://us.posthog.com
//                             (US-cloud management host; differs from the
//                             us.i.posthog.com INGEST host).
//
// Usage (run from the repo root):
//   node analytics/posthog-setup.mjs            # DRY RUN -> writes analytics/posthog-insights.json
//   node analytics/posthog-setup.mjs --apply    # create the dashboard + insights

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'posthog-insights.json');
const APPLY = process.argv.includes('--apply');

const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const HOST = (process.env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/+$/, '');
let PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '';

// The key is required to talk to PostHog. A DRY RUN works without it (it just
// builds + writes the definition JSON for review); only --apply (and the live
// existing-state lookups that make the plan accurate) need it.
if (!KEY && APPLY) {
  console.error('POSTHOG_PERSONAL_API_KEY not set. Add it to .env in the repo root (a phx_... personal key,');
  console.error('NOT the phc_ ingest key). PostHog -> Settings -> Personal API keys; scope: insight + dashboard write.');
  process.exit(1);
}

const DASHBOARD = {
  name: 'TAG Overview',
  description: 'theautomationsguide.co traffic, affiliate funnel, top content, and newsletter intent. Auto-created by analytics/posthog-setup.mjs.',
};

// ---- Insight definitions (current PostHog query format: InsightVizNode) ------
// Maps 1:1 to ANALYTICS.md "Dashboards and funnels worth building". The exact
// affiliate_click payload keys (tool, tool_name, destination_url,
// is_affiliate_url, referrer) are emitted by src/pages/go/[tool].astro.
const ev = (event, name, math) => ({ kind: 'EventsNode', event, name: name || event, ...(math ? { math } : {}) });
const trends = (series, extra = {}) => ({
  kind: 'InsightVizNode',
  source: { kind: 'TrendsQuery', series, interval: 'day', dateRange: { date_from: '-30d' }, ...extra },
});

const INSIGHTS = [
  {
    name: 'Traffic overview - pageviews & visitors by referrer',
    description: 'Daily pageviews (total) and unique visitors, broken down by referring domain. Who is coming and from where.',
    query: trends(
      [ev('$pageview', 'Pageviews', 'total'), ev('$pageview', 'Unique visitors', 'dau')],
      { breakdownFilter: { breakdown: '$referring_domain', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Traffic by UTM source',
    description: 'Daily pageviews broken down by utm_source, so tagged newsletter/social links bucket cleanly.',
    query: trends(
      [ev('$pageview', 'Pageviews', 'total')],
      { breakdownFilter: { breakdown: 'utm_source', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Affiliate funnel - pageview to affiliate_click by tool',
    description: 'Conversion from any pageview to an affiliate_click, broken down by tool_name. Per-tool click-through intent.',
    query: {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: [ev('$pageview', 'Pageview'), ev('affiliate_click', 'Affiliate click')],
        breakdownFilter: { breakdown: 'tool_name', breakdown_type: 'event' },
        dateRange: { date_from: '-90d' },
        funnelsFilter: { funnelVizType: 'steps' },
      },
    },
  },
  {
    name: 'Affiliate clicks over time by tool',
    description: 'Daily count of affiliate_click events broken down by tool_name. Which tools earn the most outbound clicks.',
    query: trends(
      [ev('affiliate_click', 'Affiliate clicks', 'total')],
      { breakdownFilter: { breakdown: 'tool_name', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Top content - pageviews by blog path',
    description: 'Daily pageviews broken down by path, filtered to /blog/ posts. Which posts earn attention.',
    query: trends(
      [{ ...ev('$pageview', 'Pageviews', 'total'), properties: [{ key: '$pathname', value: '/blog/', operator: 'icontains', type: 'event' }] }],
      { breakdownFilter: { breakdown: '$pathname', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Newsletter / form intent',
    description: 'Daily pageviews that hit a #newsletter URL, alongside autocaptured form submits. On-site newsletter intent.',
    query: trends([
      { ...ev('$pageview', 'Newsletter pageviews', 'total'), properties: [{ key: '$current_url', value: 'newsletter', operator: 'icontains', type: 'event' }] },
      { ...ev('$autocapture', 'Form submits', 'total'), properties: [{ key: '$event_type', value: 'submit', operator: 'exact', type: 'event' }] },
    ]),
  },
];

async function api(method, path, body) {
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { _raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

// Paginated GET that collects all .results across pages.
async function listAll(path) {
  const out = [];
  let next = `${HOST}${path}`;
  while (next) {
    const res = await fetch(next, { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`GET ${next} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    const j = await res.json();
    for (const r of j.results || []) out.push(r);
    next = j.next || '';
  }
  return out;
}

async function resolveProjectId() {
  if (PROJECT_ID) return PROJECT_ID;
  const res = await api('GET', '/api/projects/');
  if (!res.ok) throw new Error(`Could not list projects (${res.status}). Check the key/host. ${JSON.stringify(res.json).slice(0, 300)}`);
  const projects = res.json?.results || [];
  if (!projects.length) throw new Error('No PostHog projects visible to this key.');
  if (projects.length > 1)
    console.warn(`Note: ${projects.length} projects visible; using the first ("${projects[0].name}", id ${projects[0].id}). Set POSTHOG_PROJECT_ID to override.`);
  return String(projects[0].id);
}

async function main() {
  console.log(`PostHog setup -> ${HOST}  ${APPLY ? '(APPLY)' : '(DRY RUN)'}${KEY ? '' : '  (no key: offline definition build)'}\n`);

  // Keyless dry run: validate + write the definition JSON without touching PostHog.
  if (!KEY) {
    writeFileSync(OUT, JSON.stringify({ dashboard: DASHBOARD, insights: INSIGHTS }, null, 2) + '\n', 'utf8');
    console.log(`Built ${INSIGHTS.length} insight definitions + 1 dashboard. Written to ${OUT} for review.`);
    console.log('Set POSTHOG_PERSONAL_API_KEY and re-run (add --apply) to create them in PostHog.');
    return;
  }

  // With a key: read-only existing-state lookups so the plan is accurate in both modes.
  PROJECT_ID = await resolveProjectId();
  console.log(`Project id: ${PROJECT_ID}`);

  const existingDashboards = await listAll(`/api/projects/${PROJECT_ID}/dashboards/?limit=100`);
  const existingInsights = await listAll(`/api/projects/${PROJECT_ID}/insights/?limit=300`);
  const dashByName = new Map(existingDashboards.map((d) => [d.name, d]));
  const insightByName = new Map(existingInsights.map((i) => [i.name, i]));

  const plan = INSIGHTS.map((i) => ({ name: i.name, action: insightByName.has(i.name) ? 'exists' : 'create' }));
  const dashAction = dashByName.has(DASHBOARD.name) ? 'exists' : 'create';
  console.log(`Dashboard "${DASHBOARD.name}": ${dashAction}`);
  for (const p of plan) console.log(`  insight "${p.name}": ${p.action}`);

  const result = { host: HOST, projectId: PROJECT_ID, dashboard: null, insights: [] };

  if (!APPLY) {
    writeFileSync(OUT, JSON.stringify({ dashboard: DASHBOARD, insights: INSIGHTS, plan: { dashboard: dashAction, insights: plan } }, null, 2) + '\n', 'utf8');
    console.log(`\nDRY RUN complete. Definitions written to ${OUT} for review. Re-run with --apply to create them.`);
    return;
  }

  // --- create dashboard ---
  let dashId;
  if (dashByName.has(DASHBOARD.name)) {
    dashId = dashByName.get(DASHBOARD.name).id;
    console.log(`\nDashboard exists (id ${dashId}).`);
  } else {
    const res = await api('POST', `/api/projects/${PROJECT_ID}/dashboards/`, DASHBOARD);
    if (!res.ok) throw new Error(`Create dashboard failed (${res.status}): ${JSON.stringify(res.json).slice(0, 400)}`);
    dashId = res.json.id;
    console.log(`\nCreated dashboard "${DASHBOARD.name}" (id ${dashId}).`);
  }
  result.dashboard = { id: dashId, name: DASHBOARD.name };

  // --- create insights, pinned to the dashboard ---
  let created = 0;
  for (const def of INSIGHTS) {
    if (insightByName.has(def.name)) {
      const ex = insightByName.get(def.name);
      console.log(`  exists: "${def.name}" (id ${ex.id})`);
      result.insights.push({ id: ex.id, name: def.name, action: 'exists' });
      continue;
    }
    const res = await api('POST', `/api/projects/${PROJECT_ID}/insights/`, {
      name: def.name,
      description: def.description,
      query: def.query,
      dashboards: [dashId],
      saved: true,
    });
    if (!res.ok) {
      console.error(`  FAILED to create "${def.name}" (${res.status}): ${JSON.stringify(res.json).slice(0, 500)}`);
      throw new Error('Insight creation failed; fix the definition shape and re-run (idempotent).');
    }
    created++;
    console.log(`  created: "${def.name}" (id ${res.json.id})`);
    result.insights.push({ id: res.json.id, name: def.name, action: 'created' });
  }

  writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`\nDone. Created ${created} insight(s); dashboard "${DASHBOARD.name}" (id ${dashId}).`);
  console.log(`Open: ${HOST}/project/${PROJECT_ID}/dashboard/${dashId}`);
  console.log(`State written to ${OUT}.`);
}

main().catch((e) => { console.error('\nFatal:', e.message || e); process.exit(1); });

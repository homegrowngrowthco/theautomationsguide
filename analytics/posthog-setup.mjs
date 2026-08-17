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
//   node analytics/posthog-setup.mjs                     # DRY RUN -> writes analytics/posthog-insights.json
//   node analytics/posthog-setup.mjs --apply             # create the dashboard + insights
//   node analytics/posthog-setup.mjs --update --apply    # ALSO rewrite drifted existing insights
//
// --update exists because "create only what's missing" silently means "an insight
// definition can never be corrected". The six insights below were created before
// the $host scoping was added, so on a plain --apply they all report `exists` and
// keep serving the unfiltered (FlyrAI-contaminated) query forever. With --update
// the live query is diffed against the definition and PATCHed when it differs.

import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'posthog-insights.json');
const APPLY = process.argv.includes('--apply');
const UPDATE = process.argv.includes('--update');

const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const HOST = (process.env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/+$/, '');
// TAG's PostHog project, pinned. Do NOT fall back to the `@current` alias here:
// `@current` means "whichever project this user last opened in the PostHog UI",
// so once other projects existed in the org (2026-08-13) the same command
// resolved to 555096 and then to 408442 within the same session. This
// script REWRITES insight definitions, so resolving to the wrong project would
// silently rewrite the wrong dashboard. Override via POSTHOG_PROJECT_ID.
const TAG_PROJECT_ID = '408442';
let PROJECT_ID = process.env.POSTHOG_PROJECT_ID || TAG_PROJECT_ID;

// The key is required to talk to PostHog. A DRY RUN works without it (it just
// builds + writes the definition JSON for review); only --apply (and the live
// existing-state lookups that make the plan accurate) need it.
if (!KEY && APPLY) {
  console.error('POSTHOG_PERSONAL_API_KEY not set. Add it to .env in the repo root (a phx_... personal key,');
  console.error('NOT the phc_ ingest key). PostHog -> Settings -> Personal API keys; scopes: dashboard:read, dashboard:write, insight:read, insight:write.');
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

// ---- Production-host scoping -------------------------------------------------
// Project 408442 is NOT TAG-only. Measured 2026-08-12, all-time event split:
//   FlyrAI production   4441 (63.5%)   <- different product, same project
//   TAG production      1560 (22.3%)
//   TAG deploy-preview   894 (12.8%)
//   localhost             81 (1.2%)
// So an unfiltered $pageview/$autocapture insight on this dashboard was reporting
// TAG numbers that were ~78% not-TAG. Scope every generic-event series to the
// production hostname.
//
// Deliberately applied PER SERIES rather than as a global TrendsQuery/FunnelsQuery
// filter, because a global filter would also hit the `affiliate_click` step and
// zero it out: those events are POSTed straight to the ingest API by
// src/pages/go/[tool].astro and historically carry no $host at all. They also need
// no filter — FlyrAI has no /go/ pages, so affiliate_click is TAG-exclusive by
// construction.
// Both spellings are real and both are ours. A browser that resolves the
// fully-qualified domain name sends the ROOT-dotted form, so `$host` arrives as
// `theautomationsguide.com.` — measured 2026-08-13 at 3 events vs 1,620. An
// `exact` filter on the bare string silently drops those. PostHog treats an
// array value under `exact` as IN, so list every variant instead.
const PROD_HOSTS = ['theautomationsguide.com', 'theautomationsguide.com.'];
const onProdHost = (node) => ({
  ...node,
  properties: [...(node.properties || []), { key: '$host', value: PROD_HOSTS, operator: 'exact', type: 'event' }],
});

const INSIGHTS = [
  {
    name: 'Traffic overview - pageviews & visitors by referrer',
    description: 'Daily pageviews (total) and unique visitors, broken down by referring domain. Who is coming and from where.',
    query: trends(
      [onProdHost(ev('$pageview', 'Pageviews', 'total')), onProdHost(ev('$pageview', 'Unique visitors', 'dau'))],
      { breakdownFilter: { breakdown: '$referring_domain', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Traffic by UTM source',
    description: 'Daily pageviews broken down by utm_source, so tagged newsletter/social links bucket cleanly.',
    query: trends(
      [onProdHost(ev('$pageview', 'Pageviews', 'total'))],
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
        series: [onProdHost(ev('$pageview', 'Pageview')), ev('affiliate_click', 'Affiliate click')],
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
      [onProdHost({ ...ev('$pageview', 'Pageviews', 'total'), properties: [{ key: '$pathname', value: '/blog/', operator: 'icontains', type: 'event' }] })],
      { breakdownFilter: { breakdown: '$pathname', breakdown_type: 'event' } },
    ),
  },
  {
    name: 'Newsletter / form intent',
    description: 'Daily pageviews that hit a #newsletter URL, alongside autocaptured form submits. On-site newsletter intent.',
    // The form-submit series was the worst-hit of the six: FlyrAI's signup and
    // onboarding forms are autocaptured into this same project, so "TAG newsletter
    // intent" was largely counting a meal-planning app's signups.
    query: trends([
      onProdHost({ ...ev('$pageview', 'Newsletter pageviews', 'total'), properties: [{ key: '$current_url', value: 'newsletter', operator: 'icontains', type: 'event' }] }),
      onProdHost({ ...ev('$autocapture', 'Form submits', 'total'), properties: [{ key: '$event_type', value: 'submit', operator: 'exact', type: 'event' }] }),
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
  // A project-SCOPED personal key (the common case) is rejected by the org-level
  // /api/projects/ list with a 403, but resolves the `@current` alias to its own
  // project. Try that first; fall back to the org list for all-projects keys.
  const cur = await api('GET', '/api/projects/@current/');
  if (cur.ok && cur.json?.id != null) {
    console.log(`Resolved project via @current: "${cur.json.name}" (id ${cur.json.id}).`);
    return String(cur.json.id);
  }
  const res = await api('GET', '/api/projects/');
  if (!res.ok) throw new Error(`Could not resolve a project (@current ${cur.status}, list ${res.status}). Set POSTHOG_PROJECT_ID in .env (the number in your PostHog URL: us.posthog.com/project/<ID>/...). ${JSON.stringify(res.json).slice(0, 200)}`);
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

  // A naive JSON.stringify compare reports drift on EVERY insight forever: PostHog
  // stores the query with its own key order and injects server-managed fields
  // (`version: 4` on TrendsQuery/FunnelsQuery). Canonicalize both sides first —
  // recursively sort object keys, drop the server-managed keys — so the check
  // reports real definition changes only. Arrays keep their order (series order is
  // meaningful: it defines the funnel steps).
  const SERVER_MANAGED = new Set(['version']);
  const canonical = (v) => {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) {
        if (SERVER_MANAGED.has(k)) continue;
        out[k] = canonical(v[k]);
      }
      return out;
    }
    return v;
  };
  const sameQuery = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const actionFor = (def) => {
    const ex = insightByName.get(def.name);
    if (!ex) return 'create';
    if (sameQuery(ex.query, def.query)) return 'exists';
    return UPDATE ? 'update' : 'DRIFTED (re-run with --update to fix)';
  };
  const plan = INSIGHTS.map((i) => ({ name: i.name, action: actionFor(i) }));
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
  let updated = 0;
  for (const def of INSIGHTS) {
    if (insightByName.has(def.name)) {
      const ex = insightByName.get(def.name);
      const drifted = !sameQuery(ex.query, def.query);
      if (!drifted) {
        console.log(`  exists: "${def.name}" (id ${ex.id})`);
        result.insights.push({ id: ex.id, name: def.name, action: 'exists' });
        continue;
      }
      if (!UPDATE) {
        console.log(`  DRIFTED: "${def.name}" (id ${ex.id}) — live query differs from the definition. Re-run with --update to rewrite it.`);
        result.insights.push({ id: ex.id, name: def.name, action: 'drifted' });
        continue;
      }
      const up = await api('PATCH', `/api/projects/${PROJECT_ID}/insights/${ex.id}/`, {
        description: def.description,
        query: def.query,
      });
      if (!up.ok) {
        console.error(`  FAILED to update "${def.name}" (${up.status}): ${JSON.stringify(up.json).slice(0, 500)}`);
        throw new Error('Insight update failed; fix the definition shape and re-run (idempotent).');
      }
      updated++;
      console.log(`  updated: "${def.name}" (id ${ex.id})`);
      result.insights.push({ id: ex.id, name: def.name, action: 'updated' });
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
  console.log(`\nDone. Created ${created} insight(s), updated ${updated}; dashboard "${DASHBOARD.name}" (id ${dashId}).`);
  console.log(`Open: ${HOST}/project/${PROJECT_ID}/dashboard/${dashId}`);
  console.log(`State written to ${OUT}.`);
}

main().catch((e) => { console.error('\nFatal:', e.message || e); process.exit(1); });

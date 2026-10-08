# Topic Backlog Builder

> **Queue source of truth is the Notion Content Calendar** (`62f34586-4f78-4b83-b2ac-105f500d059e`), never a repo snapshot. Census: `node --env-file=<token-env> build-backlog.mjs --status`. (The old CONTENT_CALENDAR.md snapshot was deleted 2026-07-17.)

A standalone "topic engine" that surfaces the highest-leverage NET-NEW topics from
the tools we already know about, scores them on what the site measurably earns, and
guarantees they do not cannibalize anything already published or staged. It feeds the
same Content Calendar the publishing engine reads, but never publishes anything itself.
**Since 2026-10-08 it is the only topic generator** (the n8n Topic Suggestor is retired).

## Phase 1 (this folder) — known-universe ranking, local output only

`build-backlog.mjs`:

1. Loads the universe: `src/data/tools.ts` (29 tools with `/tools/<slug>` LPs) + the
   "Full backlog" section of `AFFILIATE_PIPELINE.md` (~75 more, by category, with
   first-mover stars). ~104 tools total.
2. Loads the dedup corpus: every published `src/content/blog/*.mdx` (title + tags
   resolved to a tool set) + the live Notion calendar (any status).
2c. Measures the site from Search Console (`signals.mjs`): unserved demand clusters,
   near-win posts and hubs, the age-adjusted impressions-per-post table by format, and
   live affiliate programs with no post. See "Signals and score" below.
3. ONE Claude call proposes N net-new topics, told what is already covered and the
   measured signals (no hard-coded format quotas since S110).
4. A DETERMINISTIC dedup guard (one shared `norm()` helper) hard-drops exact keyword/
   title/tool-set collisions and within-batch dupes, and flags partial overlaps. The
   LLM is not trusted to dedup.
4b. A DETERMINISTIC score (0..100) ranks the survivors; tertiles become Priority.
5. Sanitizes (no em/en dashes), then writes the batch with the score breakdown.

Run from the project root (so dotenv finds `./.env` with `ANTHROPIC_API_KEY`):

```
node backlog/build-backlog.mjs               # 15 topics is the CI default; local default 25
node backlog/build-backlog.mjs --count=40
node backlog/build-backlog.mjs --model=claude-opus-4-8
node backlog/build-backlog.mjs --mine-only       # print every signal input, no Claude, no writes
node backlog/build-backlog.mjs --rank-suggested  # score the live Suggested rows (NOTION_TOKEN), no writes
node backlog/build-backlog.mjs --selftest        # offline fixtures: signals + the 2026-08-12 scrub
```

GSC locally: `GSC_TOKEN_FILE=C:/Users/Ian/.gsc/token.json` (the same OAuth token the
`gsc-*.py` scripts use). Without it every signal is empty and topics score on
monetisation and format only (the run says so).

## Signals and score (`signals.mjs`, added Session 110, 2026-10-08)

Why: until S110 only GSC unserved queries reached the prompt and Priority was the
model's own guess. Measured on 2026-10-08 (GSC window to 10/05): 60 clicks and 28k
impressions in 28 days; comparisons earn 251 impressions per post (posts 60+ days
old), alternatives 171, migrations 148, guides 115; the old prompt demanded "at least
N migrations". The best tool has 3 human affiliate clicks in 90 days. So:

- **Volume rule:** impressions, position and near-wins rank topics. Clicks and
  affiliate clicks print as a sanity line in Notes and never enter the score.
- **Score 0..100** per surviving topic:
  - demand 0..50: unserved query clusters the title serves (log-scaled impressions,
    x1.2 when the site already ranks 5..15). A cluster is a tool pair or tool+intent
    ("moltsets vs apollo" in three phrasings; "rb2b pricing" + "rb2b cost"); anything
    looser matches query by query on 60% token coverage.
  - near-win 0..20: a published post whose TITLE names the anchor tool ranks 5..15
    with 100+ impressions attributed to human queries (rank-tracker operator strings
    are dropped; they inflated the beehiiv-vs-substack post from 119 to 949).
  - monetisation 0..20: anchor program live 15 (+5 when no post names it), pending or
    applied 8, else 0.
  - format 1..10: measured, age-adjusted 90d impressions per post by format, best = 10;
    a format with under 3 old posts gets the mean (unknown is not bad).
  - overlap -15: jaccard 0.5..0.72 with a covered title (0.72+ is a dedup drop).
- **Priority** = score tertile within the batch (High / Medium / Low), interleaved by
  anchor tool. The engine's Queued sort (Priority, then Created) needs no change.
- **Hub near-wins** (`/tools/<slug>/` at position 5..15, e.g. `/tools/close/` on
  "close crm") are listed as hub fixes in the batch and never become a sibling post.
- The "alternatives" title fence from the 2026-08-04 audit still hard-drops; the
  measured table now rates the format second, so that fence is an open decision (TODO).

**Pre-registered success metric** (Ian, 2026-10-08): the share of each weekly Queued
pick taken from the shortlist's top 12 (target two thirds), and at 8 weeks (~2026-12-10)
28-day GSC impressions, clicks and median position per post for scored-topic posts vs
the 2026-09-01 to 10-14 cohort. Tracked in TODO.md.

Outputs (regenerate any time; safe to delete or gitignore):
- `backlog-batch.md`  — human-readable ranked table to eyeball
- `backlog-batch.json` — same data + the dropped list, for the Phase 2 stager

Nothing here writes to Notion. Review `backlog-batch.md`, delete rows you do not want,
then the Phase 2 stager pushes the survivors to Notion as `Suggested` (never `Queued`).

## Phase 2 (BUILT) — scheduled on GitHub Actions

`.github/workflows/topic-backlog.yml` runs the same script twice a week (Sunday and
Wednesday 06:00 UTC, 15 topics a run; GitHub starts cron runs 4 to 5 h late) and stages
the survivors. We host on GitHub Actions, not n8n, because the universe and
dedup corpus are all repo files the script already parses, so CI keeps the script as the
single source of truth (no logic duplicated into n8n Code nodes). The publishing engine
stays in n8n; only topic discovery lives here.

Two differences from a plain local run, both via the `--stage` flag:
- The dedup corpus becomes a LIVE Notion query of ALL Content Calendar rows (any status:
  published, queued, generating, in-review, staged), superseding the local
  `CONTENT_CALENDAR.md` snapshot. With no `NOTION_TOKEN` it falls back to the snapshot.
- It creates each surviving topic in the Content Calendar DB at `Status: Suggested`. It
  NEVER sets `Queued` - flipping to `Queued` (what the publishing engine fires on) stays a
  human decision. The DB id defaults to the engine's `topicsDatabaseId`
  (`62f34586-4f78-4b83-b2ac-105f500d059e`); override with the `NOTION_DATABASE_ID` repo
  variable.

### To turn it on (one-time)
1. Add a repo secret **`NOTION_TOKEN`** = the Notion internal integration token the engine
   uses (get it from https://www.notion.so/profile/integrations - open the integration
   that already has the Content Calendar shared with it, copy its Internal Integration
   Secret). It must have access to the Content Calendar DB - it does, since the engine
   reads/writes it. The n8n credential can't be read back via API, so this value has to
   come from the Notion integrations page (or be re-copied there).
2. `ANTHROPIC_API_KEY` is already a repo secret. `SLACK_WEBHOOK_URL` is NOT a repo secret
   (the n8n engine has its webhook hardcoded) - add it only if you want the "N staged"
   ping; the workflow runs fine without it.
3. Test without writing: Actions tab -> "Topic backlog builder" -> Run workflow ->
   `dry_run: true`. Inspect the run summary + the `backlog-batch` artifact.
4. When happy, let the schedule run, or Run workflow with `dry_run: false` to stage
   immediately. `GSC_TOKEN_JSON` is a repo secret, so CI runs carry the full signal set.

### To pause it
Disable the workflow in the Actions tab, or comment out the `schedule:` block. Manual
`workflow_dispatch` still works while paused.

## Phase 2.5 (idea, not built) — auto-refill cap
A tiny companion job could promote the top-N `Suggested` rows to `Queued` to hold a fixed
buffer and make cadence hands-off. Deliberately NOT built: it removes the per-topic human
veto, which we want to keep while the domain is young.

## Phase 3 (later) — web discovery

Add a discovery pass that surfaces brand-new tools/categories (launch feeds, rising
keywords) into the universe before they exist in `AFFILIATE_PIPELINE.md`, so the backlog
stays ahead of the market, not just ahead of our own coverage.

# Next session (TAG): revamp topic generation on performance data; queue runway, merge-on-green proof, parked checks

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-10-08 ~16:30Z after an op #1241 review that verified every claim below against the repo, GitHub Actions and a live Notion query.)

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`, then `git worktree prune -v`. Two linked worktrees exist on purpose (`C:/tmp/tag-logo-audit`, `C:/tmp/tag-n8n-retry`): other sessions own them, so never remove them; "Permission denied" on prune of a stale `.git/worktrees/tag-*` entry is harmless. `TODO.md` is the only source of truth for open tasks; re-check every claim here with a query or against the repo before acting.

**No manual merges (Ian, 2026-10-05).** Content PRs merge themselves (`auto-merge-content.yml`). Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`. Claude's gh user is a ruleset bypass actor: never run a plain `gh pr merge` on a PR whose checks are pending, never `--admin`.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 11), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 108 and 105), `backlog/README.md`, `n8n/README.md` (Topic Suggestor row + "Retry stack"), and `audits/AUDIT-CONVERSION-2026-10-01.md` section 1 (the baseline numbers the design must respect).

## MAIN WORK: revamp topic generation around what actually drives traffic and clicks (Ian, 2026-10-08)

Ian's ask: make topic generation use what is driving traffic, clicks and affiliate clicks; he is not sure we use what we have. Do the routine checks below first (they are short), then spend the session here. **Design first, build second:** bring Ian the inventory + a proposal via AskUserQuestion before writing code.

### Where it stands (verified 2026-10-08 16:00Z; re-check)

Two generators feed the Notion Content Calendar as `Suggested`; promotion to `Queued` is Ian's manual pick, and that pick is what ran the queue dry on 10/08.

1. **Weekly backlog builder** `backlog/build-backlog.mjs` (GHA `topic-backlog.yml`, cron Sun 06:00Z; GitHub runs it 4 to 5 h late, last run Sun 10/04 11:30Z, next Sun 10/11). Uses: tool registry, affiliate status (anchor fence), deterministic dedup against published posts + the live calendar, and **GSC unserved queries** only: `mineGscDemand` pulls 28 days with `dimensions: ['query']`, keeps queries with 3+ impressions that no post serves, top 40 (`--mine-only` prints them; repo secret `GSC_TOKEN_JSON`). No page, click, CTR or position signal reaches the prompt. The format quotas in `buildPrompt` ("at most N comparisons, at least N migrations", alternatives fenced out in `dedup`) are hard-coded prose. Its `--selftest` failed the 9/13, 9/20 and 9/27 runs on one dedup fixture (a HubSpot migration title); green since 10/01.
2. **n8n Topic Suggestor** `vfEeiQg3TsPlD24J` (Mon + Thu 11:30Z, 5 topics). Uses almost nothing: "Get Calendar State" reads 100 of ~460 rows with no pagination (`n8n/topic-suggestor.json` line 153), "Build Context" keeps only `.md` files (line 178) so it sees 1 of 177 posts (176 are `.mdx`). 15 of the 63 Suggested on 10/08 were duplicates. Made retry-safe in S108 (exact-title lookup before create); its context is still broken. **Dependents if it is retired:** `n8n/watchdog.mjs` line 39 watches its id (false alerts otherwise), the Error Trigger workflow is attached to it, and `n8n/README.md` has its rows and setup section.

**Signals not used anywhere today, with their real volume (audit 10/01, window to 9/28; re-pull before the proposal):**
- **GSC page level:** 54 clicks / 24.3k impressions / 28 d across ~178 posts (94 clicks / 90 d). Near-win set: 96 pages at position 5-15 with 13.9k impressions / 28 d. High-impression zero-click pages include hub pages (`/tools/close/` 1,708 impressions at 5.1) and posts (beehiiv-vs-substack-vs-hubspot 908 at 5.4, aisdr-hubspot-workflow 814 at 5.6, rb2b-pricing 608 at 7.9). A hub near-win is a hub content fix, not a sibling post; keep the two apart in the score.
- **PostHog 408442:** ~63 post pageviews a week, flat; 17 real-affiliate `affiliate_click` / 28 d, with `source_path` only since 10/02. Thin.
- **Affiliate economics:** `src/data/affiliate-links.ts` has 78 `live`, 51 `pending`, 5 `applied`, 2 `rejected` keys; commission is prose in `notes` and in `AFFILIATE_PIPELINE.md` tables (indicative only). Two ready seed lists sit in `TODO.md`: 16 listed live-program hubs with zero posts, and 7 held early-coverage topics (re-check ~11/01).
- **Indexation** (12 crawled-not-indexed on 10/01) and the **pricing index** `src/data/pricing-index.json` (65 of 93 priced): usable as penalties or as "pricing post" candidates, not as demand.

**Volume rule for the design (from the audit's own power calculation: no split test reaches significance in under 33 weeks):** impressions, position and near-wins are the signals that can rank topics; clicks and affiliate clicks are tiebreakers and sanity checks only. Do not build a click-weighted score on 54 clicks.

**The "formats" claim needs measuring first.** The 8/04 audit never produced a per-format click table; its evidence was an output-mix observation (zero alternatives posts in the last 21) plus poorly ranked alternatives queries. Step one of the revamp is that table: pull GSC with `dimensions: ['page']` (28 d and 90 d), map each page to its post frontmatter, classify with the builder's existing `intentOf()` (migration / pricing / alternatives / review / comparison), and report impressions, clicks, CTR and median position per format and per anchor tool. Put the real numbers in the proposal.

**Tooling that already exists (reuse, do not rewrite):**
- `gsc-search-analytics.py` (local, venv `C:\Users\Ian\.venvs\gsc`, OAuth at `~/.gsc`) already prints page-level clicks / CTR / position and the page-one zero-click set; the builder's `gscAccessToken()` is the CI-side equivalent with the refresh token.
- `analytics/posthog-setup.mjs` + `analytics/README.md`: a local **project-scoped** `POSTHOG_PERSONAL_API_KEY` in `.env` is Ian's standing setup, so a local PostHog read works today; only CI needs a new repo secret (Ian creates it; never paste it in chat). HogQL goes to `POST /api/projects/408442/query` on `us.posthog.com`. The connector's `execute-sql` is for interactive reads, not the builder.
- The stager (`stageToNotion`) writes Topic, Status, Priority, Tag, Target Keyword, Notes. The engine's "Get Next Topic" sorts Queued rows by Priority (High first) then Created. A ranked shortlist therefore either packs the score into Priority (no engine change) or adds a Score property and changes the engine sort (live n8n change via `live-patch.mjs`, Ian's OK). The design question must carry that choice.
- Test path for a changed builder: Actions > "Topic backlog builder" > Run workflow with `dry_run: true` (summary + `backlog-batch` artifact), not the Sunday cron.

### What to bring Ian (one AskUserQuestion, options with a recommendation)

1. Which signals to add and how to weight them into one score per proposed topic (observed demand, near-win sibling, live affiliate program with zero coverage, measured format performance once the table exists, cannibalization penalty), under the volume rule above.
2. One generator or two: likely retire or rebuild the n8n Suggestor so a single, data-fed builder owns topic discovery (fix or remove the context bugs either way, and handle the dependents listed above).
3. Whether the generator should also produce a **ranked shortlist** so the weekly Queued pick is a quick yes/no for Ian (he keeps the per-topic veto; no auto-promotion unless he asks), and where the score lives (Priority vs a new property).
4. Data access for CI: GSC is already a repo secret; PostHog needs a project-scoped personal API key as a new secret or the read stays local.
5. **Pre-register the success metric before building** (the audit's method): share of each weekly Queued pick taken from the shortlist's top N, and at 8 weeks, 28-day GSC impressions and clicks per post for scored-topic posts vs the prior cohort. Write it into `TODO.md` with the read date.

**Build rules for this work:** changes to `backlog/` are allowed for this revamp (Ian, 10/08). Keep the deterministic dedup guard and anchor fence, extend `--selftest` fixtures for every new signal, and ship a `--dry-run`/`--mine-only` style read that prints the inputs and scores before anything writes to Notion. Any live n8n change goes through `live-patch.mjs` with Ian's OK. Measure before claiming a signal helps. **If the shortlist exists before the ~10/14 pick (NEEDS FROM IAN 1), use it for that pick: it is the revamp's first live acceptance test.**

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **Next Queued batch (due before ~2026-10-14 12:00Z):** first count Queued in Notion (Content Calendar `62f34586-...`, or the Notion connector's SQL on `collection://3536c795-1a40-4ddf-a210-05a117df3848`; 10/08 16:00Z: 12 Queued / 36 Suggested / 233 Skipped / 178 Published). If 4 or fewer remain, run the dry `--audit-queue` (shim in the S108 log), then bring Ian a pick of about 12 from the Suggested pool, as S108 did, or from the new shortlist if it exists. Never promote without his answer.
2. **Topic generation revamp design** (MAIN WORK above): one AskUserQuestion with the inventory, the format table and a recommended design before building. The Suggestor context bugs are decided inside it.
3. **Beehiiv steps:** Ian said "not yet" on 10/05. Ask again only if he raises it, or once in a session on or after 10/09; if done, screenshot the signup at 375 px on a post.
4. **Beehiiv `attribution.js` + mono labels (S105/S106):** ask only if Ian raises perf or the Beehiiv steps. Post-contract change, so his call.
5. **`/blog/` pagination (low, only if time):** two mocks with screenshots before building. **R8:** only if he raises it.
6. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part 0. Close the merge-on-green proof

1. **The next engine PR whose qa pushes an `[auto-register]` commit** is the real test of #354 (#357/#359/#361/#362 had none). It should merge within minutes of green with no help, and its head should carry a `pr-gates` check titled "PR gates pass (dispatched run)". If it sticks, `gh workflow run auto-merge-content.yml`; if a check is `cancelled` with an empty `runner_name`, `gh run rerun <id> --failed`. Never merge by hand. Then delete the TODO item.

## Part A. Suggestor proof (Claude only)

1. **The Mon 10/12 11:30Z Topic Suggestor run** (`vfEeiQg3TsPlD24J`) is the first after S108's patch: its execution should show "Find Existing Title" and "Keep New Topics", the Slack count should equal the pages created, and Notion should hold no new duplicate titles (SQL: `GROUP BY "Topic" HAVING COUNT(*) > 1` over non-Skipped rows). If a create failed, the Slack message says so and nothing re-runs. Skip this if the revamp retired the Suggestor before 10/12.
2. If any engine run failed or a red `qa` stalled a PR, recover with **Retry** on the execution (never a fresh trigger), per `n8n/README.md` "Retry stack". A red content PR is fixed in-branch or closed.

## Part B. Parked checks (Claude only)

1. **First real attributed click:** PostHog 408442, `affiliate_click` after 2026-10-08 14:15Z, host-scoped (S108: 7 since S107, none real). Query with the PostHog connector's `execute-sql`; confirm `project-get` returns 408442. Only `source_via` `click` or `last_page` with `is_automated=false` counts, and only with a session, a browser and a TAG pageview **on a page that actually links that tool**. Rejected so far: crawler bursts (404 probes without a trailing slash) and direct `/go/` loads seconds after a short pageview (S107 Instantly, S108 GetAccept).
2. **~2026-10-15 metric:** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. Drop crawler bursts first. Read it only on or after 10/15.

## Part C. Lows if time allows

- Merge-on-green follow-ups in TODO: auto re-run of runs GitHub cancelled with no runner (only if it recurs); the `[qa-fix-N]` re-run path is unexercised.
- #362 (Brevo alternatives) has one unlinked live-program mention (Clay): `node qa/link-live-mentions.mjs --post <file> --write` in a PR, if the freshness gate allows it without inventing a review date.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running. n8n live exports carry a Slack webhook URL: redact it in anything printed or committed.
- Docs-only changes go through a PR with `--auto` too: master requires `qa` + `pr-gates`, so a direct push only lands via the admin bypass.
- End the session with 0 open PRs unless one is red and named in the wrap-up. Never merge red, never `--admin` or the UI bypass (CLAUDE.md gotcha 10).
- Watch long CI waits with a Monitor that emits on state changes (Ian, 10/05: check frequently; an idle session past the cache window re-caches everything).
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/` (except N4's `~/.claude.json`); `backlog/` is open only for the topic-generation revamp, via a PR; running `backlog/build-backlog.mjs --audit-queue` read-only is fine, `--prune-apply` and Notion status changes need Ian's OK.
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Code changes go in a `C:\tmp` worktree on a branch and a PR with `--auto`; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

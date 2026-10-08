# Next session (TAG): first scored builder run, the ~10/14 pick from the shortlist, merge-on-green proof, parked checks

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-10-08 ~17:10Z at the end of Session 110, op #1242.)

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`, then `git worktree prune -v`. Linked worktrees other sessions own (`C:/tmp/tag-logo-audit`, `C:/tmp/tag-n8n-retry`) are never removed; "Permission denied" on prune of a stale `.git/worktrees/tag-*` entry is harmless. `TODO.md` is the only source of truth for open tasks; re-check every claim here with a query or against the repo before acting.

**No manual merges (Ian, 2026-10-05).** Content PRs merge themselves (`auto-merge-content.yml`). Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`. Claude's gh user is a ruleset bypass actor: never run a plain `gh pr merge` on a PR whose checks are pending, never `--admin`.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 11), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 110 and 108), `backlog/README.md` ("Signals and score"), `n8n/README.md` ("Retry stack").

## What Session 110 changed (verify, do not re-derive)

- Topic discovery has ONE owner: `backlog/build-backlog.mjs` on GitHub Actions, **Sun + Wed 06:00Z, 15 topics a run** (GitHub starts cron 4 to 5 h late). Every surviving proposal carries a deterministic score 0..100 (`backlog/signals.mjs`: GSC demand clusters, near-win siblings, monetisation, age-adjusted format prior, overlap penalty; clicks are a sanity line only). Priority = score tertile; Notes = `Score N = ...`. 32 signal fixtures run inside `--selftest` on every run.
- The n8n Topic Suggestor `vfEeiQg3TsPlD24J` is **retired**: deactivated 10/08 16:51Z (`n8n/retire-suggestor.mjs`, backup in `~/.n8n-backups/`), off the watchdog list. Do not reactivate; there is no 10/12 Suggestor run to check.
- Read-only tools: `--mine-only` prints every signal input; `--rank-suggested` scores the live Suggested pool with fence flags. Local run shim (no local `NOTION_TOKEN`): a scratch `.mjs` that sets `NOTION_TOKEN ||= NOTION_API_KEY` and `GSC_TOKEN_FILE ||= C:/Users/Ian/.gsc/token.json`, then `import(pathToFileURL(builder).href)`, run with `node --env-file=../todo-sync/.env <shim> --rank-suggested`.
- Pre-registered metric is in `TODO.md` (pick share from the top 12 at each pick; 8-week GSC cohort read ~2026-12-10).

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **Next Queued batch (due before ~2026-10-14 12:00Z):** count Queued first (Notion SQL on `collection://3536c795-1a40-4ddf-a210-05a117df3848`; 10/08 16:00Z: 12 Queued / 36 Suggested). If 4 or fewer remain, run `--rank-suggested` and bring Ian a pick of about 12 **from the ranked shortlist** (fence-flagged rows cannot ship through the builder, say so), then record metric (a): how many of his picks were in the top 12. Never promote without his answer. This pick is the revamp's first live acceptance test.
2. **Beehiiv steps:** Ian said "not yet" on 10/05. Ask once in a session on or after 10/09; if done, screenshot the signup at 375 px on a post. The `attribution.js` + mono-label perf items (S105/S106) only if he raises perf or the Beehiiv steps.
3. **Alternatives fence (low):** the 10/08 table rates the format second (171 impressions per post, 8 posts); the 8/04 fence still hard-drops the title form. Ask only if a top-scored Suggested row is an alternatives title he wants.
4. **`/blog/` pagination (low, only if time):** two mocks with screenshots before building. **R8:** only if he raises it.
5. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part 0. Close the merge-on-green proof

1. **The next engine PR whose qa pushes an `[auto-register]` commit** is the real test of #354 (#357/#359/#361/#362 had none). It should merge within minutes of green with no help, and its head should carry a `pr-gates` check titled "PR gates pass (dispatched run)". If it sticks, `gh workflow run auto-merge-content.yml`; if a check is `cancelled` with an empty `runner_name`, `gh run rerun <id> --failed`. Never merge by hand. Then delete the TODO item.

## Part A. Builder and engine proof (Claude only)

1. **Sun 2026-10-11 06:00Z (expect ~10:30Z): first scheduled scored run** of "Topic backlog builder". The run summary must show the signal line (clusters / near-win posts / hub fixes / live programs with no post), the batch table with Score and breakdown columns, and the staged Notion rows must carry `Score N = ...` in Notes with Priority by tertile. Red on GSC means the `GSC_TOKEN_JSON` secret; red on the selftest means a fixture rotted against live inputs (the dedup fixtures are pinned to 2026-08-12, the signal fixtures are synthetic). Wed 10/14 06:00Z is the second run.
2. If any engine run failed or a red `qa` stalled a PR, recover with **Retry** on the execution (never a fresh trigger), per `n8n/README.md` "Retry stack". A red content PR is fixed in-branch or closed.

## Part B. Parked checks (Claude only)

1. **First real attributed click:** PostHog 408442, `affiliate_click` after 2026-10-08 16:30Z, host-scoped (S110: 0 since 14:15Z). Query with the PostHog connector's `execute-sql`; confirm `project-get` returns 408442. Only `source_via` `click` or `last_page` with `is_automated=false` counts, and only with a session, a browser and a TAG pageview **on a page that actually links that tool**. Rejected so far: crawler bursts (404 probes without a trailing slash) and direct `/go/` loads seconds after a short pageview (S107 Instantly, S108 GetAccept).
2. **~2026-10-15 metric:** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. Drop crawler bursts first. Read it only on or after 10/15.

## Part C. Lows if time allows

- **Hub fixes** (TODO): `/tools/close/` 3,633 attributed impressions / 28 d at 5.7 on "close crm", 0 clicks; `/tools/appy-ai/`; `/tools/moltsets/`. Hub content work (title, intro, price stat), never a sibling post. Bring Ian a before/after proposal with screenshots if he wants it.
- Merge-on-green follow-ups in TODO: auto re-run of runs GitHub cancelled with no runner (only if it recurs); the `[qa-fix-N]` re-run path is unexercised.
- #362 (Brevo alternatives) has one unlinked live-program mention (Clay): `node qa/link-live-mentions.mjs --post <file> --write` in a PR, if the freshness gate allows it without inventing a review date.
- Three scripts still list the retired Suggestor id harmlessly (`build-error-retry.mjs` RETRY_IDS, `update-retry-on-fail.mjs`, `error-trigger.json`); drop it the next time one of them is regenerated for another reason.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running. n8n live exports carry a Slack webhook URL: redact it in anything printed or committed.
- Docs-only changes go through a PR with `--auto` too: master requires `qa` + `pr-gates`, so a direct push only lands via the admin bypass.
- End the session with 0 open PRs unless one is red and named in the wrap-up. Never merge red, never `--admin` or the UI bypass (CLAUDE.md gotcha 10).
- Watch long CI waits with a Monitor that emits on state changes (Ian, 10/05: check frequently; an idle session past the cache window re-caches everything).
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/` (except N4's `~/.claude.json`). `backlog/` changes go through a PR with the selftest green; `--mine-only`, `--rank-suggested` and `--audit-queue` are read-only and fine; `--prune-apply`, `--stage` outside CI and Notion status changes need Ian's OK.
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Code changes go in a `C:\tmp` worktree on a branch and a PR with `--auto`; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

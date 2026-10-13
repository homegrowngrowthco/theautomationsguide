# Next session (TAG): read the two unattended runs, builder gaps, merge-on-green proof

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-10-13 ~14:15Z at the end of Session 112, op #1257.)

**Two cloud routines now do part of this with nobody present** (CLAUDE.md, "Cloud routines"). Check them first with `RemoteTrigger` (`list`, `list_runs`, `get_run_log`): "TAG unattended check 2026-10-15" (13:00Z, read-only, Slack DM + docs PR) and "TAG queue top-up (Sun + Wed)" (16:00Z; first run that should promote is Sun 10/18). Do not redo work a run already did correctly; verify it and move on.

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`, then `git worktree prune -v`. Linked worktrees other sessions own (`C:/tmp/tag-logo-audit`, `C:/tmp/tag-n8n-retry`) are never removed; "Permission denied" on prune of a stale `.git/worktrees/tag-*` entry is harmless. `TODO.md` is the only source of truth for open tasks; re-check every claim here with a query or against the repo before acting.

**No manual merges (Ian, 2026-10-05).** Content PRs merge themselves (`auto-merge-content.yml`). Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`. Claude's gh user is a ruleset bypass actor: never run a plain `gh pr merge` on a PR whose checks are pending, never `--admin`.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 11), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 112, 111 and 110), `backlog/README.md` ("Signals and score"), `n8n/README.md` ("Retry stack").

## What Session 112 changed (verify, do not re-derive)

- **Queue:** Ian picked the top 10 of the corrected shortlist on 10/13; 13 Queued / 34 Suggested at 13:15Z, Priority set by score within the pick (4 High, 3 Medium, 3 Low; titles and scores in the session log). Metric (a) first read: 10 of 10 from the top 12.
- **Routines:** an old cloud routine had been promoting topics every Sunday since June with stale rules (it, not Ian, queued MoltSets Pricing on 10/11). Ian had it rewritten as the queue top-up and added the 10/15 one-off. Ian's stated goal: queue work so Claude runs it without him; prefer a dated routine with a Slack DM over a prompt that waits for him.
- **#381:** `--rank-suggested` no longer counts Suggested rows as coverage of their own demand (`demandCorpus()` in `backlog/signals.mjs`, 34 signal checks). Before the fix every staged row re-scored at demand 0.
- **#382:** `/tools/nutshell/` has title "Nutshell CRM pricing, pipeline management & alternatives" and a price-led description (`seo` entry, same pattern as Close #368). Baseline 28 d to 10/10: 358 impressions, 209 on "nutshell pipeline management" at 10.0, 0 clicks. Read it ~11/10.
- **Beehiiv:** Ian asked for the steps by Slack and has them (HGC DM, 10/13) with links and the live values. He applies them himself. Do not re-send; ask at most once whether they are done.
- **First scored builder run (10/11) was green**, and showed two builder gaps (TODO): hub near-wins are not fenced at proposal time, and stage dedup disagrees with the queue audit.

## Standing facts (S110/S111, still true)

- Topic discovery has ONE owner: `backlog/build-backlog.mjs` on GitHub Actions, **Sun + Wed 06:00Z, 15 topics a run** (GitHub starts cron 4 to 6.5 h late). Score 0..100 from `backlog/signals.mjs`; Priority = score tertile; Notes = `Score N = ...`. The n8n Topic Suggestor `vfEeiQg3TsPlD24J` is **retired**; do not reactivate.
- Read-only tools: `--mine-only`, `--rank-suggested`, `--audit-queue` (without `--prune-apply`). Local run shim (no local `NOTION_TOKEN`): a scratch `.mjs` that sets `NOTION_TOKEN ||= NOTION_API_KEY` and `GSC_TOKEN_FILE ||= C:/Users/Ian/.gsc/token.json`, then `import(pathToFileURL(builder).href)`, run with `node --env-file=../todo-sync/.env <shim> --rank-suggested`.
- Notion queue counts: SQL on `collection://3536c795-1a40-4ddf-a210-05a117df3848` (group by `Status`). Status and Priority writes go through the Notion connector's page update, only on Ian's answer.
- Hub `seo` descriptions clip at 158 chars and drop an overflowing tail sentence whole; build and read `dist/tools/<slug>/index.html` before quoting an "after" string to Ian.

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **Queue:** promotion is automatic since 10/13 (the top-up routine, a standing score rule Ian approved). Count Queued; only if the routine failed or fewer than 4 remain with no run due, run `--rank-suggested` and bring Ian a pick. Compare the routine's 10/18 picks with `--rank-suggested`: it reads the stage-time score in Notes and cannot re-rank, so a large disagreement is worth showing him.
2. **Builder gaps (med):** does he want a pricing or guide post beside a hub that is already a near-win (MoltSets Pricing shipped that way on 10/12)? His answer decides the fence; then make stage dedup and the queue audit derive the tool set the same way. `backlog/` change, PR, selftest green.
3. **Beehiiv:** ask once whether the Slack steps are done. If yes, screenshot the signup at 375 px on a post and close the TODO item.
4. **Alternatives fence (low):** three Suggested rows are alternatives titles (top one scored 31 on 10/13). Ask only if one reaches the top of a shortlist.
5. **`/blog/` pagination (low, only if time):** two mocks with screenshots before building. **R8:** only if he raises it.
6. **Date-gated:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part 0. Close the merge-on-green proof

1. **The next engine PR whose qa pushes an `[auto-register]` commit** is the real test of #354. #357 through #380 had none (`gh pr view <n> --json commits` on every engine PR since #380). It should merge within minutes of green with no help, and its head should carry a `pr-gates` check titled "PR gates pass (dispatched run)". If it sticks, `gh workflow run auto-merge-content.yml`; if a check is `cancelled` with an empty `runner_name`, `gh run rerun <id> --failed`. Never merge by hand. Then delete the TODO item.

## Part A. Builder and engine proof (Claude only)

1. **Wed 2026-10-14 06:00Z (expect 10:30 to 12:40Z): second scored run**, then Sun 10/18. Check the signal line, the batch table, `Score N = ...` in Notes, and what the queue audit step Skipped (`gh run view <id> --log`, section "QUEUE AUDIT"): a staged row Skipped in the same run is the stage-vs-audit gap again.
2. **The picked topics publish in Priority order** (High first, then Created). Check the first few engine PRs after 10/13 20:00Z: the review "Is MoltSets Legit?" must lint 0 hard with no testing or observation claim (gotcha 11); `node qa/lint-content.mjs --post <file>`. The 10/15 routine reads this too.
3. If any engine run failed or a red `qa` stalled a PR, recover with **Retry** on the execution (never a fresh trigger), per `n8n/README.md` "Retry stack". A red content PR is fixed in-branch or closed.

## Part B. Parked checks (Claude only)

1. **~2026-10-15 metric (the 10/15 routine reads it; verify its read against one query of your own before closing the TODO sub-bullet):** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. PostHog 408442 via the connector's `execute-sql` (confirm `project-get` returns 408442; filter `$host` on both `theautomationsguide.com` and the root-dotted form). Drop crawler bursts first. On 10/13 every click since 10/08 17:00Z was `source_via=none` with no session and no browser, so the honest read may be "no human clicks to measure"; say so rather than computing a share of zero.
2. **First real attributed click:** only `source_via` `click` or `last_page` with `is_automated=false` counts, and only with a session, a browser and a TAG pageview on a page that actually links that tool.

## Part C. Lows if time allows

- **Hub fixes** (TODO): split `/tools/fullenrich/` by country and date (135 at 11.9 on "fullenrich alternatives"); re-read `/tools/moltsets/` ~10/27. Offer Ian a `seo` change only where the demand is real, with built before/after strings.
- Merge-on-green follow-ups in TODO: auto re-run of runs GitHub cancelled with no runner (only if it recurs); the `[qa-fix-N]` re-run path is unexercised.
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
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/` (except N4's `~/.claude.json`). `backlog/` changes go through a PR with the selftest green; `--prune-apply`, `--stage` outside CI and Notion status changes need Ian's OK.
- The post component contract in `src/components/post/`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are. `src/data/tools.ts` changes only for an approved `seo` entry or a tool registration.
- Code changes go in a `C:\tmp` worktree on a branch and a PR with `--auto`; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

# Next session (TAG): close the merge-on-green proof, read the fixed-prompt posts, parked checks

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`, then `git worktree prune -v` (OneDrive locks `.git/worktrees/tag-*` metadata; "Permission denied" on prune is harmless when `git worktree list` is clean). `TODO.md` is the only source of truth for open tasks; this file was last rewritten after Session 107 (2026-10-06 ~16:00Z; S105 shipped merge-on-green in #349/#351/#352/#354, ruleset requires `qa` + `pr-gates`, repo `allow_auto_merge=true`; S107 read the 10/06 12:00Z post (#357) clean and found no real attributed click), so re-check every claim with a query or against the repo before acting.

**No manual merges (Ian, 2026-10-05).** Content PRs merge themselves (`auto-merge-content.yml`). Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`. Claude's gh user is a ruleset bypass actor: never run a plain `gh pr merge` on a PR whose checks are pending, never `--admin`.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 11), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 106 and 105). If the session starts before 2026-10-06 ~20:30Z, nothing below is actionable yet: say so and stop rather than re-running S107's checks.

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **Beehiiv steps:** Ian said "not yet" on 10/05. Ask again only if he raises it or after 10/08; if done, screenshot the signup at 375 px on a post.
2. **Beehiiv `attribution.js` (global in `BaseLayout.astro`):** deferring it would clear best-practices 77 but changes which page Beehiiv credits a subscribe to. Ask only if Ian raises perf or the Beehiiv steps. Same trigger for the **mono labels** (S106): below-fold JetBrains Mono labels in DecisionTree / BottomLine and 4 other post components cost about 2 Lighthouse points (FCP +300 ms simulated, fonts are `swap`) on 154/173 posts; options are sans labels or leave it. Post-contract change, so his call.
3. **`/blog/` pagination (low, only if time):** bring Ian two mocks with screenshots before building.
4. **R8 (parked by Ian 10/05):** only if he raises it.
5. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part 0. Close the merge-on-green proof

1. **#353 is done** (merged by `github-actions` 21:54:58Z, live 200, Notion Published, Slack posted), but only after `gh pr update-branch`: the dispatched `pr-gates` on its bot-pushed head did not count for the PR (fixed in #354).
2. **The next engine PR whose qa pushes an `[auto-register]` commit** is the real test of #354 (#357 on 10/06 had no bot commit, so it does not count): it should merge within minutes of green with no help, and its head should carry a `pr-gates` check titled "PR gates pass (dispatched run)". If it sticks, `gh workflow run auto-merge-content.yml`; if a check is `cancelled` with an empty `runner_name`, `gh run rerun <id> --failed`. Never merge by hand. Then delete the TODO item.

## Part A. Fixed-prompt posts

1. **The 10/06 20:00Z run and later** (#345 + #347 prompts; #353 and #357 were clean): `node qa/lint-content.mjs --post <file>` must show no `first-person testing claim`; read any `first-person usage claim` and `observation with a figure` WARNs. If either keeps appearing, propose making it HARD (lint change in a PR, `--auto`).
2. If an engine run failed or a red `qa` stalled a PR, recover with **Retry** on the execution (never a fresh trigger), per `n8n/README.md` "Retry stack". A red content PR is fixed in-branch (a push re-runs QA) or closed.

## Part B. Parked checks (Claude only)

1. **Indexing re-check (on or after 2026-10-08):** `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post; if calendly still is not indexed, stop chasing it.
2. **First real attributed click:** PostHog 408442, `affiliate_click` after 2026-10-02 01:21Z, host-scoped. At 10/06 15:40Z: 84 events, none real (query with the PostHog connector's `execute-sql`; confirm `project-get` returns 408442). Only `source_via` `click` or `last_page` with `is_automated=false` counts, and only when it has a session, a browser and a TAG pageview; a crawler burst (21 tools in 10 min, 10/05 21:49Z) set `last_page` from 404 probes like `/affiliate` (no trailing slash), and another hit 51 tools on 10/06 10:28-11:05Z. Also reject S107's pattern: a Linux Chrome UUID visitor whose `last_page` `/go/instantly/` loads came minutes after 1 s pageviews (a headless browser, not a click).
3. **~2026-10-15 metric:** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. Drop crawler bursts first. Read it only on or after 10/15.

## Part C. Lows if time allows

- Merge-on-green follow-ups in TODO: auto re-run of runs GitHub cancelled with no runner (only if it recurs); the `[qa-fix-N]` re-run path is unexercised.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running.
- Docs-only changes go through a PR with `--auto` too: master requires `qa` + `pr-gates`, so a direct push only lands via the admin bypass.
- End the session with 0 open PRs unless one is red and named in the wrap-up. Never merge red, never `--admin` or the UI bypass (CLAUDE.md gotcha 10).
- Watch long CI waits with a Monitor that emits on state changes (Ian, 10/05: check frequently; an idle session past the cache window re-caches everything).
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `backlog/`, `pricing/` scripts or `alita/` (except N4's `~/.claude.json`).
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Code changes go in a `C:\tmp` worktree on a branch and a PR with `--auto`; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first (another instance logs there). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

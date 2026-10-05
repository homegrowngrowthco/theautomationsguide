# Next session (TAG): verify the claim fixes held, parked checks, date-gated asks

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`, then `git worktree prune -v` (OneDrive locks `.git/worktrees/tag-*` metadata; "Permission denied" on prune is harmless when `git worktree list` is clean). `TODO.md` is the only source of truth for open tasks; this file was last rewritten after Session 104 (2026-10-05: observed-results engine rule #347 deployed 16:21Z, 98-post scrub #348, #340/#342/#343 merged by hand at Ian's direction, 0 open PRs), so re-check every claim with a query or against the repo before acting.

**Ian's standing rule (2026-10-05): no more manual merges.** Every PR that passes its gates merges by itself. Part 0 builds that; until it ships, Claude merges any green PR itself without asking (never a red one).

Read first: `CLAUDE.md` (gotcha 11 now covers both the testing and the "I've seen" rounds), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 104 and 103).

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **Beehiiv steps:** Ian said "not yet" on 10/05. Ask again only if he raises it or after 10/08; if done, screenshot the signup at 375 px on a post.
2. **`/blog/` pagination (low, only if time):** perf 83 is 169 rendered cards (S103 measured; quick fixes failed). Pagination or "load more" changes the listing and the client-side topic filter, so bring Ian two mocks with screenshots before building.
3. **R8 (parked by Ian 10/05):** only if he raises it. The Notion API cannot publish to web.
4. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part 0. Automatic merging, no human in the loop (do this first)

Today (measured 10/05): repo `allow_auto_merge=false`; `auto-merge-content.yml` runs once a day (cron 14:00Z) and only merges `content:` PRs 2+ days old from creation with a green `qa`; it Slack-pings stuck ones. `qa-content-pr.yml` runs on `pull_request` for `content/` branches and can push fixer commits from inside the job (gotcha 5: read the verdict from the pre-push sha). No GHA runs on `push` to master; Netlify deploys via its app and Notion Publish Status is a GitHub repo webhook, so a bot merge still deploys and still updates Notion (verify on the first one). Ruleset 24417620 requires `qa`.

1. **Content PRs merge the moment `qa` passes.** Add a `workflow_run` (qa-content-pr completed, conclusion success) or end-of-qa-job step that squash-merges the PR whose head sha got the green verdict, re-checking `qa` success on that exact sha and that the PR is still open and unchanged. Drop the 2-day wait; keep the daily job as a backstop that merges anything green it finds and keeps the stuck-PR Slack alert for red ones. Never merge red, never `--admin`.
2. **Every other PR merges itself when green too.** Turn on repo `allow_auto_merge` (`gh api -X PATCH repos/homegrowngrowthco/theautomationsguide -F allow_auto_merge=true`) so `gh pr merge --auto --squash` can be set when a PR is opened; Claude sets it on every PR it opens. Non-content PRs report `qa` as skipped, which passes the ruleset, so add or confirm a real required check for code PRs (lint/selftests job) before relying on it.
3. Work in a `C:\tmp` worktree, PR it, then prove it end to end: the next engine content PR merges within minutes of a green `qa` with no human action, Netlify deploys it, the live post returns 200, Notion flips to Published and Slack posts. Also prove a red `qa` does NOT merge (a throwaway `content/` test PR with a deliberate HARD lint failure, closed and branch deleted afterwards).
4. Update CLAUDE.md (gotcha 6 "Ian merges" and the engine Flow line "human merge (auto-merge backstop after 2 days green)"), `n8n/README.md` if it mentions the 2-day backstop, and TODO. Revert path: revert the PR; `allow_auto_merge` back to false.

## Part A. Confirm the claim fixes held

1. **First engine posts on both fixed prompts** (#345 deployed 10/05 15:22Z, #347 at 16:21Z): the 10/05 20:00Z and 10/06 12:00Z runs and any later ones. For each content PR: `node qa/lint-content.mjs --post <file>` must show no `first-person testing claim` (HARD on posts dated 10/05+, so a hit means `qa` went red). Read any `first-person usage claim` and `observation with a figure` WARNs. If either keeps appearing, propose making it HARD (lint change in a PR).
2. **#340, #342, #343 merged 10/05** (`7563a45`, `963bba8`, `1d25953`): confirm each live post returns 200 and carries the fixed sentences. Any content PR opened since then: if green, merge it (or let Part 0 do it); if red, fix in-branch.
3. If the engine run failed or a red `qa` stalled a PR, recover with **Retry** on the execution (never a fresh trigger), per `n8n/README.md` "Retry stack".

## Part B. Parked checks (Claude only)

1. **Indexing re-check (on or after 2026-10-08):** `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post; if calendly still is not indexed, stop chasing it.
2. **First real attributed click:** PostHog 408442, `affiliate_click` after 2026-10-02 01:21Z, host-scoped. As of 10/05 15:30Z (not re-read in S104): 5 events, none real (all cold `/go/` entries with `source_via=none`; one automated; three tools in two minutes on 10/05, crawler-like). Only `source_via` `click` or `last_page` with `is_automated=false` counts. Do not read the 10/15 or 11/26 metrics early.
3. **~2026-10-15 metric:** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. Read it only on or after 10/15.

## Part C. Lows if time allows

- Content `qa` checks only the first changed post (`head -1` in `qa-content-pr.yml`); #346 and #348 were multi-post PRs gated locally. Looping lint/render over every changed post is a small CI change.
- Best-practices 77 everywhere = Beehiiv `attribution.js` third-party cookie; loading the embed on interaction would clear it (not a gate; check the signup still works on mobile).
- SideBySide: it only reads `offsetHeight` at 768 px and up, so the Gong post's mobile perf gap has another cause; measure before editing a post-contract component.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook (a placeholder email in an edited line goes to `@example.com`; otherwise restore the line's original form). Commit trailers name the model actually running.
- Merge every green PR without asking (Ian, 2026-10-05: no manual merges). Never merge a PR with a red `qa` check, and never use `gh pr merge --admin` or the UI bypass on one (CLAUDE.md gotcha 10). End the session with 0 open PRs unless one is red and named in the wrap-up.
- Live n8n writes need Ian's explicit OK (the classifier blocks `deploy-engine.mjs --apply` without it), go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path (the deployer's dry run does not diff prompt text; diff node parameters yourself). Do not touch `backlog/`, `pricing/` scripts or `alita/` (except N4's `~/.claude.json`).
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Code changes go in a `C:\tmp` worktree on a branch and a PR; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first (another instance logs there). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

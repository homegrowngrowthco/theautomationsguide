# Next session (TAG): read the first fenced builder run, the top-up, the engine link guard; N4 and N5

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-10-16 ~17:30Z at the end of Session 114, op #1309.)

Start inside `theautomationsguide/`. State which model you are running as. `git pull --ff-only` on `master`, then `git worktree prune -v` (never remove a worktree another session owns). `TODO.md` is the only source of truth for open tasks; re-check every claim here with a query before acting. The SessionStart inbox lists `[tag]` issues on `homegrowngrowthco/claude-projects-ops`: act on ANSWERED ones first, close each with a `[claude op #N] done: ...` comment and the `answered` label.

**Cloud routines do part of this unattended** (CLAUDE.md, "Cloud routines"; `RemoteTrigger` list, list_runs, get_run_log): "TAG queue top-up (Sun + Wed)" `trig_01KVAmk2g9KEerLehzufnag6` (16:00Z) and "TAG unattended check (weekly, Thu 13:00Z)" `trig_01Pg3Ga6j4BJG19MKhCBJ7zc` (next 10/22). They report through ops issues, never a Slack DM. Verify a run's work; do not redo it.

**No manual merges (Ian, 2026-10-05).** Content PRs merge themselves; every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`. Never a plain `gh pr merge` on pending checks, never `--admin`.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 11), `TODO.md`, the top of `docs/SESSION_LOG.md` (Sessions 114 and 113), `backlog/README.md` ("Signals and score", hub fence), `n8n/README.md`.

## What Session 114 changed (verify, do not re-derive)

- **#387 fixed and live; merge-on-green proven** (#391, `[auto-register]` commit, merged in 3 min unaided).
- **Clipped slug root cause fixed twice:** builder Notes now carry the full `/blog/<slug>/` (#393); live engine Parse Draft guard (17:16Z) normalises, snaps (unique 20+ char prefix) or unlinks every `/blog/` href against the full post list, logging to `linkGuard`. Backup `~/.n8n-backups/sjZADhZGIuz9tZHK-2026-10-16T17-16-07-417Z.json`.
- **Hub fence (#393):** drops a post targeting a query a `/tools/` hub ranks 15 or better for (20+ impressions, page+query rows). Stage dedup and the audit share one tool-set rule. `dedash` and the first-mover star regexes fixed (19 of 75 tools now first-mover in the proposer prompt).
- **Click rule changed (Ian, ops #8):** pageview join within 60 s. Human clicks since 10/02: 1 of 5 (10/13 Loops). The rule is spelled out in the TODO item; rebuild the HogQL from it (affiliate_click LEFT JOIN same-distinct_id `$pageview` within 60 s before, path = `source_path`; burst = 3+ clicks in 10 s; headless = `last_page` with a `$pageleave` duration of 2 s or less).
- **Beehiiv** is ops issue #9 (Ian's). Do not ask again; when it is closed, screenshot the signup at 375 px on a post and close the TODO item.

## Part A. Reads (Claude only)

1. **Builder Sun 10/18 06:00Z (expect 10:30 to 12:40Z), the first with the fence:** `gh run view <id> --log`. What it fenced and why (`hub fence:` drop reasons), hub advisories in "QUEUE AUDIT" (the step now has `GSC_TOKEN_JSON`; "skipped" means the secret did not reach it), 0 rows staged-then-Skipped, and whether the proposals shifted toward first-mover tools. A fence that drops a different-query post is a bug: fix in a PR with a fixture.
2. **Top-up Sun 10/18 16:00Z:** should promote (about 3 Queued left). Compare its picks with `--rank-suggested` (it reads the stage-time score in Notes). Local shim: a scratch `.mjs` setting `NOTION_TOKEN ||= NOTION_API_KEY` and `GSC_TOKEN_FILE ||= C:/Users/Ian/.gsc/token.json`, then `import(pathToFileURL(builder).href)`; run `node --env-file=../todo-sync/.env <shim> --rank-suggested`. Rows the new fence would flag show up there.
3. **Engine link guard:** on each execution since 10/16 20:00Z read Parse Draft's `linkGuard` (n8n executions API, GET only). Every `snap` must land on the right post; every `strip-*` must be a real non-post. Then `node qa/lint-content.mjs --post <file>` on the new posts (0 hard; no testing or observation claim, gotcha 11).
4. **Clicks:** re-run the joined rule from 10/02 01:21Z; at 5 human clicks compute the `source_path` share (target >90%).

## Part B. Asks for Ian (AskUserQuestion at the point of need; then close the ops issue)

- **Old queue items (CLAUDE.md root rule 6):** TODO still has `@ian` tags (R8 template publish, PartnerStack link defects, authority sprint, affiliate applications, GEO re-run). Convert each into a `needs-ian` issue (`-l project:tag`, body file), `parked` where Ian parked it (R8), and drop the tag. One issue per item; this rings Ian once per new issue, so batch them in one sitting.
- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run** (9/24 baseline 1 of 25, 5 queries x 5 engines). Ask whether Ian runs it or Claude drafts the queries.
- **Alternatives fence (low):** ask only if an alternatives title tops a shortlist.

## Part C. Lows if time allows

- Hub fixes (TODO): split `/tools/fullenrich/` by country and date; re-read `/tools/moltsets/` ~10/27; Nutshell ~11/10.
- 8 mojibake comments and one log string remain in `backlog/build-backlog.mjs` (not regexes); fix the next time the file is touched for another reason.
- Three scripts still list the retired Suggestor id harmlessly; drop it when one is regenerated anyway.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. **A command Ian must run goes in a plain chat message as a fenced code block, full and on one line, never only inside a question dialog (he cannot copy from it).** The auto-mode classifier blocks Claude's own live n8n engine writes as a production deploy: after Ian's OK, hand him the exact apply command that way.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running. n8n live exports carry a Slack webhook URL: redact it in anything printed or committed.
- Docs-only changes go through a PR with `--auto` too: master requires `qa` + `pr-gates`.
- End the session with 0 open PRs unless one is red and named in the wrap-up. Never merge red, never `--admin` or the UI bypass (CLAUDE.md gotcha 10).
- Watch long CI waits with a Monitor that emits on state changes. Git Bash here has no `jq`; use `gh ... --jq`.
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/` (except N4's `~/.claude.json`). `backlog/` changes go through a PR with the selftest green; `--prune-apply`, `--stage` outside CI and Notion status changes need Ian's OK.
- The post component contract in `src/components/post/`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are. `src/data/tools.ts` changes only for an approved `seo` entry or a tool registration.
- Code changes go in a `C:\tmp` worktree on a branch and a PR with `--auto`; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

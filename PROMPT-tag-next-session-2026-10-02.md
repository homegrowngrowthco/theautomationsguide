Work each numbered section in its own subagent (general-purpose, Opus for writes, Sonnet for reads). The top-level session only dispatches, reads the section's 10-line report, and logs. Never let the top-level context pass 200k; if it does, /compact before the next section.

# Next session (TAG): read the supply fix, build the alarm if its secret exists

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-11-04 at the end of Session 118, op #1498.)

Start inside `theautomationsguide/`. State which model you are running as. `git pull --ff-only` on `master`, then `git worktree prune -v` (never remove a worktree another session owns; the `md-tier-1358` "Permission denied" line on git commands is OneDrive noise). `TODO.md` is the task list, this file is the order of work.

Subagents cannot ask Ian. A section that needs a decision returns its evidence and a recommendation; the top-level session asks with AskUserQuestion, one single-select per decision.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 17, 18, and "Cloud routines"), `TODO.md`, the top of `docs/SESSION_LOG.md` (Session 118).

Do not run this before Mon 11/09, so the 11/08 builder run and top-up have landed.

## 1. State read (Sonnet, read only)

Report: open PRs; engine PRs since 11/04 21:00Z with qa image line, conclusions and time to merge (TODO "first real engine posts"; **any red goes to the top of your report**); engine executions (workflow `sjZADhZGIuz9tZHK`, GET only; about 3 s means no topic); the top-up runs of 11/04 and 11/08 (`RemoteTrigger` list_runs, get_run_log on `trig_01KVAmk2g9KEerLehzufnag6`): what it promoted and held; Queued and Suggested counts via `node --env-file=../todo-sync/.env <shim> --status`, and pass `--status` explicitly because with no flag the script runs a full builder dry run and spends a Claude call; open `project:tag` issues on `homegrowngrowthco/claude-projects-ops`, with answers; the watchdog's runway line.

## 2. Read the builder on the 11/08 run (Sonnet)

Per TODO: `Proposed N -> kept K`, `Recent drops`, reworded repeats, format mix, any max_tokens WARN. Baseline: old code kept 1 of 15, new code kept 10 of 30 on 11/04. If yield fell back or the mix is all pricing and review, return evidence and a recommendation: the "vs" wording first. Supply must hold 2 a day, so also report how many eligible scored rows are left. If it still cannot, bring Ian the choice of new tool sources or 1 post a day.

## 3. Repeated-red alarm (Opus; only if `gh secret list` shows `OPS_ISSUES_PAT`)

Design in TODO and ops #68. In `qa/failure-ledger.mjs`, with fixtures: one issue per signature at 3 distinct PRs in 14 days, deduped by open title, using a body file. It must not fail the qa job if the issue call fails. If the secret is missing, leave the TODO; ops #68 already asks.

## 4. Answered queue items (Sonnet for reads, Opus for writes)

Ops #63 to #68, whichever Ian has answered: claim with `[claude op #N] on it`, do the follow-up, close with `[claude op #N] done: ...`. GEO: if ops #67 is answered, score the sheet into `audits/AUDIT-GEO-<date>.md` against 1 of 25.

## 5. Duplicate review and small corrections (Sonnet for the read, top-level asks)

Review the 27 older Suggested rows against post bodies (gotcha 18), and bring Ian one bulk Skipped list. Recommend or decline tightening the top-up's "when in doubt it is not a duplicate" rule; a routine `update` wipes its prompt unless the whole prompt is resent. Fix the small corrections in TODO that need no decision; the top-up's stale engine times go with any prompt change.

## 6. Dated reads

Nutshell hub ~11/10; pricing index ~11/12 (this rebuild also clears 5 wrong domains from the public JSON; do not touch `pricing/` scripts); clicks at 5 human under the widened rule, currently 3; topic-score metric ~12/10; conversion audit ~11/26. If a date has not arrived, leave it in TODO and say so. Beehiiv is ops #9, Ian's. Do not ask again.

## Rules

- Every question to Ian goes through AskUserQuestion. **A command Ian must run goes in a plain chat message as a fenced code block, full and on one line, never only inside a question dialog (he cannot copy from it).** The auto-mode classifier blocks Claude's own live n8n engine writes as a production deploy: after Ian's OK, hand him the exact apply command that way.
- This repo is public. No secrets in chat, the transcript or the repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running. n8n live exports carry a Slack webhook URL: redact it in anything printed or committed. No DataForSEO call without asking Ian first.
- Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`, docs too. Never a plain `gh pr merge` on a pending PR, never `--admin` or the UI bypass (gotcha 10). End with 0 open PRs unless one is red and named in the wrap-up.
- Watch CI with Monitor running `gh pr checks <n> --watch` or `gh run watch <id> --exit-status`, plus a stall watchdog on anything long. Never poll with sleep in the foreground. Git Bash here has no `jq`; use `gh ... --jq`.
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/`. `backlog/` changes go through a PR with the selftest green; `--prune-apply`, `--stage` outside CI and Notion status changes need Ian's OK. A subagent promoting topics reads post bodies first.
- The post component contract in `src/components/post/`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are. `src/data/tools.ts` changes only for an approved `seo` entry or a tool registration.
- Code changes go in a `C:\tmp` worktree on a branch; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is. Finish with `/wrap`.

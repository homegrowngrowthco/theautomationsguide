Work each numbered section in its own subagent (general-purpose, Opus for writes, Sonnet for reads). The top-level session only dispatches, reads the section's 10-line report, and logs. Never let the top-level context pass 200k; if it does, /compact before the next section.

# Next session (TAG): refill the queue, close the failures op #1496 exposed

(File name is historical; it is rewritten in place each session. Content last rewritten 2026-11-04 ~15:00Z at the end of Session 117, op #1496.)

Start inside `theautomationsguide/`. State which model you are running as. `git pull --ff-only` on `master`, then `git worktree prune -v` (never remove a worktree another session owns; the `md-tier-1358` "Permission denied" line on git commands is OneDrive noise). `TODO.md` is the task list, this file is the order of work.

Subagents cannot ask Ian. A section that needs a decision returns its evidence and a recommendation; the top-level session asks with AskUserQuestion, one single-select per decision.

Read first: `CLAUDE.md` (gotchas 5, 6, 10, 17, and "Cloud routines"), `TODO.md`, the top of `docs/SESSION_LOG.md` (Session 117), `backlog/README.md` ("Signals and score").

## What Session 117 changed (verify in section 1, do not re-derive)

- **qa was red on every content PR from 10/30:** `ubuntu-latest` became Ubuntu 26.04 and Playwright 1.59.1 refuses it. #430 pinned the qa job to `ubuntu-24.04`. All 8 held PRs (#417, #421, #424 to #429) merged on green 11/04 via `gh pr update-branch`.
- **#421 had registered the wrong company** (creatio.io, a Finnish studio, for Creatio the CRM). Corrected by hand; only its blurb's em dash had stopped it publishing.
- **Not fixed: the topic queue is empty.** `0 Queued, 36 Suggested` at the 11/04 builder run, which staged 1 row. Engine runs with nothing queued exit in about 3 s and still report success, so the watchdog stays green.

## 1. State read (Sonnet, read only)

Report: open PRs; qa conclusions and runner image since op #1496 (`gh run view <id> --log`, line `Image:`); engine executions since 11/04 13:00Z (n8n workflow `sjZADhZGIuz9tZHK`, GET only; about 3 s means no topic); the 11/04 top-up (`RemoteTrigger` get, list_runs, get_run_log on `trig_01KVAmk2g9KEerLehzufnag6`; it was due 17:09Z); Queued and Suggested counts; open `project:tag` issues on `homegrowngrowthco/claude-projects-ops`. Any red content PR since the pin goes to the top of your report; the top-level session deals with it before section 2.

## 2. Refill the queue (Sonnet for the read, top-level asks, Opus for the writes)

The outcome is enough Queued rows for the engine to publish 2 a day again, plus a supply that does not run dry every few days.

- **Read:** why the builder yield fell. 10/25 and 10/28 kept 4 each by the session log; 11/02 kept 2 of 15; 11/04 staged 1. Count the drop reasons in those runs' logs (HubSpot rejected, alternatives format, CTA, registry, hub fences). Then rank the Suggested rows with `--rank-suggested` (shim in `backlog/README.md` or a scratch `.mjs` setting `NOTION_TOKEN ||= NOTION_API_KEY` and `GSC_TOKEN_FILE ||= C:/Users/Ian/.gsc/token.json`; run with `node --env-file=../todo-sync/.env`). 34 rows are unscored legacy rows, which the top-up's standing rule excludes. Include the 7 held early-coverage topics (TODO, due ~11/01) with their current GSC demand and affiliate status.
- **Ask Ian (evidence in the question):** recommend one of: promote a named top N from the ranked list now; extend the standing rule so the top-up may promote rows `--rank-suggested` scores; loosen a named fence, if the counts show one fence causes most of the drop. If the top-up already opened a `[tag]` queue issue, close it with his answer per the root `CLAUDE.md` decision queue rules. No Notion status change and no `--stage` outside CI without his answer.
- **Cloud routine trap:** a routine `update` wipes its prompt unless the whole prompt is resent (memory `reference_cloud_routine_facts_github_connector_push_connectors`). Read it first if the rule changes.
- **Then:** apply, verify the rows read Queued, and confirm the next engine run opens a PR.
- **Also decide:** whether an empty-queue engine run should stay silent-green. The top-up issue is the only alarm today. Recommend or decline a change; a live n8n write needs Ian's explicit OK (see Rules).

## 3. Two posts published on a judgment call (Sonnet for the read, top-level asks)

The top-up overrode its duplicate rule on **Lindy vs Relevance AI** (#428; the 11/01 run held it against `2026-07-06-relevance-ai-vs-lindy-vs-n8n-ai-agents-for-gtm-teams`) and **Circleback vs Fathom** (#427), and said so on ops #60. Compare each with the older post it could duplicate: target query, overlap, GSC impressions for the older post. Ask Ian keep, or redirect to the older post, with a recommendation. New posts have no ranking data yet, so do not present their absence of clicks as evidence. Change nothing without his answer.

## 4. Auto-register: wrong companies (web-reader subagents for the audit, Opus for the code)

**Audit first.** `src/data/affiliate-links.ts` holds 40 entries noted `Auto-registered from a content PR`. Web reads go through `.claude/agents/web-reader.md`, never a hand-written prompt. For each: does the homepage belong to the tool the post describes? Known suspect: `guru` points at `https://mobile.guru.so/` ("Welcome to Guru"); the knowledge-base product is at getguru.com, and the Trainual post links it. Fix confirmed wrong entries in one PR (homepage, name, blurb; `node qa/auto-register-tools.mjs --logo-for <slug> --replace` for the logo; a logo that fails validation ships logo-less). This is a data correction, so it is an approved exception to the "affiliate-links.ts stays as is" rule below. Name every fix in the wrap-up.

**Then the code** in `resolveHomepage` (`qa/auto-register-tools.mjs`). Find out why creatio.io beat creatio.com before choosing a fix: the title-starts-with-brand bonus is a hypothesis, and a `.com` that blocked the runner's UA is another. Also note the slug came from the post's tool card name ("Creatio Native Business Process").
- **Candidate rules to test:** reject a page whose `lang` or text is not English; when two registrable domains both pass identity, do not guess.
- **Trap:** an unresolved tool hard-fails lint, which holds the post. So dry-run the new rule against the 40 existing entries and report how many it would have refused or changed before shipping. A rule that holds many good posts is worse than the bug; bring that trade-off to Ian if the number is high.
- **Done means:** a creatio.io vs creatio.com fixture in `--selftest`, all existing fixtures green, PR with `--auto`.

## 5. Merger and failure reporting (Opus)

In `qa/merge-green.mjs`, `.github/workflows/auto-merge-content.yml` and the qa job's failure steps:

- **Recover a bot-pushed head stuck with `action_required` stubs after a prior red** (ops #57, Ian's option 1). #417, #421 and #424 all sat this way. **Trap:** `gh pr update-branch` worked in op #1496 because it ran as Ian. The same call from the sweep runs as `GITHUB_TOKEN`, whose push triggers no workflow (gotcha 5), so it would only make new stubs. The existing `[qa-fix-N]` path uses `reRunWorkflow` on the qa run; check whether a re-run covers this case, remembering a re-run may use the workflow file from its original commit, which matters after a workflow fix. Keep a retry cap, because a deterministic content red would otherwise loop and spend Vision money. Add fixtures to `--selftest`.
- **Name the failure.** The fail signature fell through to `other` for all 6 Playwright failures, and the comment told Ian to "fix the post". Add a signature for the install step and make its comment and Slack line say infrastructure, not content.
- **Same file, if it stays small:** the TODO item on a GitHub-cancelled run counting as red.
- **Propose, do not build yet:** repeated same-class reds across different PRs opened no decision-queue issue, so this ran 5 days before Ian saw it. Check whether TAG has an ops-repo PAT secret. Adding a secret is Ian's step (memory: classifier refuses secret writes), so ask only if the rest is ready.

## 6. Playwright, then unpin (Opus; only after section 5 is merged)

Evidence from op #1496: the 1.64.1 bundle (`lib/coreBundle.js`) mentions `ubuntu26` and the 1.59.1 code does not. That is a grep, not a proof, so confirm from the release notes or a real run.

**Trap:** the qa job is skipped on non-content PRs, so a PR changing it proves nothing and its first real run is the next engine post. A wrong unpin stops publishing again. Test on a throwaway `content/` branch and PR with the `no-auto-merge` label, read the run, then close it and delete the branch (it costs one Vision call). Run `npm run qa:overflow` before and after the bump, because a new browser can move that gate. If 26.04 fails, bump only and keep the pin, and say so.

Also source a transparent Creatio logo if creatio.com has an SVG or transparent mark (`npm run qa:logos` must pass). If not, leave the TODO.

## 7. Carried over and cleanup (Sonnet for reads, top-level asks)

- **Close what is already answered:** delete TODO items the session log shows finished (for example the 10/18 top-up read and the first-run hub fence reads, S115 and S116). Check each against the log first.
- **Old queue items (root `CLAUDE.md` rule 6):** TODO still has `@ian` tags (R8 template publish, PartnerStack link defects, authority sprint, affiliate applications, GEO re-run). Convert each to a `needs-ian` issue (`-l project:tag`, body file), `parked` where Ian parked it (R8), and drop the tag. Each new issue rings Ian once, so batch them in one sitting.
- **Alita n8n MCP key (N4 in the last prompt; it was due to die 10/29):** no op log row shows the rotation. Check `mcp__n8n-alita__n8n_health_check`. If it fails, ask Ian: he creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API, no expiry); you store it from his clipboard, printing nothing.
- **Dated reads that fall due:** GEO citation re-run (ask whether Ian runs it or Claude drafts the queries; baseline 1 of 25 on 9/24); clicks under the joined rule (TODO; at 5 human clicks compute the `source_path` share); Nutshell hub ~11/10; pricing index ~11/12. If a date has not arrived, leave it in TODO and say so.
- **Beehiiv** is ops issue #9, Ian's. Do not ask again.
- **Out of scope:** FlyrAI's unpinned `deploy.yml` (separate project, in memory `reference_ubuntu_latest_26_breaks_playwright_ci`), `/blog/` Lighthouse, content gaps.

## Rules

- Every question to Ian goes through AskUserQuestion. **A command Ian must run goes in a plain chat message as a fenced code block, full and on one line, never only inside a question dialog (he cannot copy from it).** The auto-mode classifier blocks Claude's own live n8n engine writes as a production deploy: after Ian's OK, hand him the exact apply command that way.
- This repo is public. No secrets in chat, the transcript or the repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook. Commit trailers name the model actually running. n8n live exports carry a Slack webhook URL: redact it in anything printed or committed. No DataForSEO call without asking Ian first.
- Every PR Claude opens gets `gh pr merge --auto --squash <branch>` right after `gh pr create`, docs too. Never a plain `gh pr merge` on a pending PR, never `--admin` or the UI bypass (gotcha 10). End with 0 open PRs unless one is red and named in the wrap-up.
- Watch CI with Monitor running `gh pr checks <n> --watch` or `gh run watch <id> --exit-status`, plus a stall watchdog on anything long. Never poll with sleep in the foreground. Git Bash here has no `jq`; use `gh ... --jq`.
- Live n8n writes need Ian's explicit OK, go through `n8n/live-patch.mjs` or the engine updaters, dry run first, with a saved GET of the live workflow as the revert path. Do not touch `pricing/` scripts or `alita/`. `backlog/` changes go through a PR with the selftest green; `--prune-apply`, `--stage` outside CI and Notion status changes need Ian's OK.
- The post component contract in `src/components/post/`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are, except section 4's corrections. `src/data/tools.ts` changes only for an approved `seo` entry, a tool registration or section 4.
- Code changes go in a `C:\tmp` worktree on a branch; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`. In Git Bash, pass route arguments with `MSYS_NO_PATHCONV=1`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: use the op number the SessionStart hook printed and `node .claude/log-op.mjs` (never compute it). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is. Finish with `/wrap`.

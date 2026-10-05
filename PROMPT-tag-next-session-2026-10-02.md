# Next session (TAG): engine testing-claims fix, #344 sign-off, parked checks

Start inside `theautomationsguide/`. State which model you are running as. Run `git pull --ff-only` on `master`. `TODO.md` is the only source of truth for open tasks; this file was last rewritten after Session 102 (2026-10-05: ruleset on master, #339 merged and production-verified, #344 open for Ian), so re-check every claim with a query or against the repo before acting.

Read first: `CLAUDE.md` (gotcha 10 is new: `master` requires `qa`), `TODO.md`, the top of `docs/SESSION_LOG.md` (Session 102), `docs/DESIGN-SYSTEM.md` (page patterns section is new).

## NEEDS FROM IAN (AskUserQuestion, at the point where each is needed)

1. **PR #344 (honest methodology copy):** approve, edit or reject. He should check two first-person lines ("Some of these tools I have run in production"; "Ian has spent eight years running RevOps stacks, so some of the tools covered here he has used in production"). Merge only on his word; it is not a content PR, so `qa` reports skipped and the ruleset passes it.
2. **Existing posts with invented testing claims:** after Part A ships the prompt fix, ask whether to scrub the existing posts (the Session 90 pattern) or leave them. Bring a count first.
3. **R8 (parked by Ian 10/05):** only if he raises it. The Notion API cannot publish to web; he publishes the RevOps Stack Audit template himself and sends the link.
4. **Beehiiv steps:** not done as of 10/05. Ask once; if done, screenshot the signup at 375 px on a post.
5. **Date-gated, only once the date has passed:** N4 on or after 2026-10-22, N5 about 2026-10-24 (Part D).

## Part A. Stop the engine inventing hands-on testing (the bulk of the session)

Engine posts still write first-person testing claims with no testing behind them: "I have tested it on three different HubSpot portals" (2026-09-20 Apollo to HubSpot post), "after hands-on testing" (2026-09-21 best CRM post), "most operator-friendly I have tested" (AI SDR post). Session 90 fixed the same class for client anecdotes (PR #283, the prompt rule plus a scrub). Do the same:

1. **Size it over the whole population first:** grep every post for first-person testing claims (`I have tested`, `I tested`, `I've tested`, `hands-on testing`, `in my testing`, `we tested`), count by month, and list which arrived after the 9/16 prompt fix. Read the definition of what the engine prompt now forbids before writing a new rule.
2. **Fix the generator** with an idempotent `n8n/update-engine-*.mjs` updater (dry run, `deploy-engine.mjs --apply`, GET-verify live, keep `n8n/blog-post-engine.json` in sync). Prefer a deterministic sanitizer or lint rule over prompt text alone (CLAUDE.md gotcha 1). Watch the n8n expression tokenizer (gotcha 2).
3. Then ask Ian (need 2) before touching existing posts.

## Part B. Parked checks (Claude only)

1. **Indexing re-check (about 2026-10-08):** `gsc-index-status.py` for `/tools/calendly/`, the 9/06 Beehiiv post and the 10/01 Mailchimp-to-Kit post; if calendly still is not indexed, stop chasing it.
2. **First real attributed click:** PostHog 408442, `affiliate_click` after 2026-10-02 01:21Z, host-scoped. As of 10/05 13:00Z: 2 events, neither real (cold runable `source_via=none`; frase `is_automated=true`). Only `source_via` `click` or `last_page` with `is_automated=false` counts. Do not read the 10/15 or 11/26 metrics early.
3. **~2026-10-15 metric:** `source_path` on >90% of human clicks (baseline 6%), split at the redesign deploy 10/02 ~21:55Z. Read it only on or after 10/15.

## Part C. Lows if time allows

- `/blog/` Lighthouse mobile perf 84 (LCP 3.98 s) on master; not the lazy first card image. Find the LCP element (save the Lighthouse JSON), then fix.
- SideBySide: it only reads `offsetHeight` at 768 px and up, so the Gong post's mobile perf gap has another cause; measure before editing a post-contract component.
- Lighthouse best-practices is 77 everywhere: check what it flags.

## Part D. Date-gated asks for Ian (only once the date has passed)

- **N4 (on or after 2026-10-22): Alita n8n MCP key, which dies 2026-10-29.** Ian creates a key on `https://alitahealth.app.n8n.cloud` (Settings > n8n API > Create, label `claude-mcp-noexpiry-<date>`, Expiration: No expiration, no scopes) and copies it. Do not ask him to run a command from a question dialog; run it yourself with the PowerShell tool, printing nothing: `Get-Clipboard | Set-Content -NoNewline -Encoding ascii "$env:USERPROFILE\.n8n-alita-newkey.txt"`. Then the Session 97 swap pattern: probe `GET /api/v1/workflows?limit=1` and require 200 before writing; back up `~/.claude.json`; set `mcpServers["n8n-alita"].env.N8N_API_KEY`; write atomically, verify; delete the key file and clear the clipboard. Ian runs `/mcp` and reconnects.
- **N5 (about 2026-10-24): GEO citation re-run.** Repeat the 9/24 baseline (5 queries x 5 engines, baseline 1 of 25), now with the redesign live. Ask Ian whether he runs it or Claude drafts the queries.

## Rules

- Every question to Ian goes through AskUserQuestion; attach screenshots when asking him to choose. Commands he must run go in a chat code block.
- No secrets in chat, the transcript or the public repo. Never read `.env.local`. Never `git add -A`. Never bypass the PII hook (restore a moved line's original form instead). Commit trailers name the model actually running.
- Never merge a PR with a red `qa` check, and never use `gh pr merge --admin` or the UI bypass on one (CLAUDE.md gotcha 10).
- Live n8n writes go through `n8n/live-patch.mjs` or the engine updaters (backup, verify, restore), dry run first. Do not touch `backlog/`, `pricing/` scripts or `alita/` (except N4's `~/.claude.json`).
- The post component contract in `src/components/post/`, `src/data/tools.ts`, `src/data/affiliate-links.ts`, every `/go/` redirect, `ClickSource` and its root class names, `Analytics.astro`, the CSP and `_headers`, `trailingSlash: 'always'`, the sitemap and JSON-LD stay as they are.
- Code changes go in a `C:\tmp` worktree on a branch and a PR; junction `node_modules`; remove the junction with PowerShell `[IO.Directory]::Delete(path, $false)` before `git worktree remove`. File edits use the Edit tool or a `.mjs` script with a dry run, never `node -e` or `python -c`.

## Wrap-up

Session log entry (20 lines or fewer), `TODO.md` updated, `npm run qa:docs` 0 hard. Root ops log: check `git log` for the latest op number first (another instance logs there). Rewrite this file in place with whatever is still open; `git rm` it only when nothing is.

# The Automations Guide (TAG)

RevOps/GTM automation blog at **theautomationsguide.com**. Affiliate-monetized (every tool links via `/go/<slug>`), with a fully automated daily content engine. Author identity: Ian (byline "Ian Chamberland" on site).

- **Repo:** `github.com/homegrowngrowthco/theautomationsguide`, branch `master` (not main). Public repo.
- **Deploy:** Netlify auto-deploys every push to master (~90s). Rollback guide: [DEPLOYMENT.md](DEPLOYMENT.md).
- **History:** full session-by-session log in [docs/SESSION_LOG.md](docs/SESSION_LOG.md). Open tasks ONLY in [TODO.md](TODO.md).

This file is an index: state, a pointer, no history, no counts. Detail is on demand and leaves with its task.
Narrative goes to the session log (`docs/SESSION_LOG.md`), never here. (Tier rule from the markdown hygiene audit, op #1357, 2026-10-21.)

## Architecture map

| Area | Where | Notes |
|---|---|---|
| Posts | `src/content/blog/*.mdx` | MDX + component library in `src/components/post/` |
| Tool registry | `src/data/tools.ts` | `/tools/<slug>` hubs; `listed:false` = indexable but off homepage/grid |
| Affiliate registry | `src/data/affiliate-links.ts` | **Source of truth for every `/go/<slug>` redirect + program status.** Missing entry = 404 = hard lint fail |
| QA gates | `qa/` | `lint-content` `render-acceptance` `mobile-overflow` `lint-logos` `seo-scan` `auto-register-tools` + Vision review/fixer. npm: `qa:lint` `qa:render` `qa:overflow` `qa:logos` `qa:seo` `qa:docs`, plus `qa:shots` (11 routes x 3 widths) and `qa:lighthouse` (median of 3; perf 95+, a11y 100, SEO 100, CLS 0) after `npm run build` |
| Design system | `src/styles/global.css` (2026-10 token block), `src/components/ui/` | "Ink spec": ink is the frame, reading surfaces stay light. Rules + inventory: [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md). Astro 4.16, no Tailwind, latin-only Fontsource fonts |
| Topic/LP builders | `backlog/` | `build-backlog.mjs` (weekly GHA, stages Notion `Suggested`; `--status` = queue census), `build-tool-lp.mjs` |
| Pricing index | `pricing/` | `build-pricing-index.mjs` -> `src/data/pricing-index.json` + `public/data/`, rendered at `/revops-automation-pricing/`. The linkable asset. **Never guesses**: a figure absent from the fetched page is `null` with a reason. `--selftest` (13 fixtures, offline) gates every run |
| Engine + deployers | `n8n/` | `blog-post-engine.json` + idempotent `update-engine-*.mjs` updaters; deploy via `deploy-engine.mjs --apply` (needs `N8N_API_URL`+`N8N_API_KEY` in env; source: `node --env-file=../growth-engine/.env`) |
| CI | `.github/workflows/` | `qa-content-pr.yml` (content gates), `auto-merge-content.yml` (merge-on-green for content PRs + daily stuck-PR sweep; logic in `qa/merge-green.mjs`), `qa-freshness.yml` ("PR gates": selftests + build + lint, rolled up into the required `pr-gates` check), `topic-backlog.yml` (weekly), `handle-tool-reply.yml` (PR-comment tool registration) |
| Analytics | `analytics/` + GSC scripts | `posthog-setup.mjs`; root `gsc-index-status.py` + `gsc-search-analytics.py` (OAuth cache `~/.gsc/`, venv `C:\Users\Ian\.venvs\gsc`) |
| Audits | `audits/` | Dated reports. Findings freeze at write time; resolution is tracked ONLY in TODO.md |

## Content engine (live)

- n8n Cloud `homegrowngrowth.app.n8n.cloud`, workflow **"Blog Post Engine — TAG (v3)"** id `sjZADhZGIuz9tZHK`, cron 8am AND 4pm ET daily (2/day since 9/16, `update-engine-2x-daily.mjs`), 32 nodes.
- **Failures retry themselves (2026-10-01):** per-node Retry On Fail, then the error workflow re-runs temporary failures from the failed node at 15m/45m/2h, then the `n8n-watchdog` GHA checks every scheduled run succeeded. To recover a dead run by hand, use **Retry** on the execution, not a fresh trigger (a fresh engine trigger claims the NEXT topic). Details + measured API facts: [n8n/README.md](n8n/README.md) "Retry stack".
- Flow: Notion Content Calendar (`Status: Queued`) → generate/humanize (Sonnet) → sanitize → PR on `content/<slug>` branch → QA workflow (auto-register + gates + Vision) → merges itself within minutes once `qa` + `pr-gates` are green on the head (`auto-merge-content.yml`; label `no-auto-merge` holds one) → Netlify deploy + Notion Publish Status.
- Notion DBs: Content Calendar `62f34586-4f78-4b83-b2ac-105f500d059e`, Drafts `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`. Queue lives in Notion — never snapshot it into the repo.
- Engine changes: edit via an idempotent `n8n/update-engine-*.mjs` updater, dry-run, `deploy-engine.mjs --apply`, then GET-verify live. Keep `n8n/blog-post-engine.json` in sync with the live instance.
- Topic discovery lives in `backlog/build-backlog.mjs` (GitHub Actions, Sun + Wed 06:00 UTC), scored on GSC signals (`backlog/signals.mjs`); the n8n **Topic Suggestor is RETIRED** (deactivated 2026-10-08, `n8n/retire-suggestor.mjs`; do not reactivate, it has no performance input). `--rank-suggested` prints the ranked shortlist for a manual pick.
- **Cloud routines (claude.ai/code/routines; they run with nobody present and are NOT visible from the repo, so list them before assuming a Notion write was Ian's):**
  - **"TAG queue top-up (Sun + Wed)"** `trig_01KVAmk2g9KEerLehzufnag6`, 16:00 UTC after each builder run. Standing rule Ian approved 2026-10-13: when fewer than 9 are Queued it promotes the highest `Score N` Suggested rows (no alternatives titles, no dead programs, max two per tool) up to 10 Queued and sets Priority by score. It existed from 2026-06-16 as "TAG weekly backlog review" with June's rules and promoted every Sunday unnoticed until S112.
  - **"TAG unattended check (weekly, Thu 13:00Z)"** `trig_01Pg3Ga6j4BJG19MKhCBJ7zc`: read-only checks (engine PRs, builder runs, new-post lint, queue dry date, the source_path metric both ways) plus one docs PR with auto-merge. It was the one-off 2026-10-15 check, re-armed weekly on 2026-10-15 (op #1297).
  - **Both report only through the decision queue** (since 2026-10-15, op #1297; rules in `../CLAUDE.md` "The decision queue"): a `needs-ian` issue on `homegrowngrowthco/claude-projects-ops` only when something needs Ian; a healthy run opens nothing. No Slack DMs. A routine gets a fresh clone and the claude.ai connectors only: no local `.env`, no GSC token, no op number; `gh` is not authenticated there, the GitHub connector tools are.
- Other live workflows: Daily Briefing, PostHog Monitor, Notion Publish Status (webhook on PR merge: Notion + Slack + per-post IndexNow; Google Indexing API branch built but OFF), Error Trigger. **PR + Backlink Monitor is OFF** (deactivated 2026-07-14 at Ian's direction after 12 days live produced zero backlinks; do not reactivate without fixing the 2 logged defects — full history in `../pr-backlink-monitor/STATUS.md`, its own tracked project). All TAG Slack alerts lead with `🤖 *The Automations Guide*` (keep for any new alerting workflow).

## Docs + logging conventions (2026-07-17)

- **TODO.md holds open tasks only.** Delete an item when it closes (its detail lives in the session log). Re-rank on add. `npm run qa:docs` fails on any `[x]` left in TODO.md and on CLAUDE.md >400 lines.
- **Session log:** one entry per session in [docs/SESSION_LOG.md](docs/SESSION_LOG.md), newest first, target ≤20 lines (shipped / PRs+SHAs / verify one-liner / revert / gotchas). Root ops-log gets 1-2 lines + a pointer here.
- **Docs-only changes go through a PR too** (since S105): a `C:\tmp` worktree, then `gh pr merge --auto --squash`. `master` requires `qa` + `pr-gates`, so a direct push only lands via the admin bypass.
- **Audits** go in `audits/AUDIT-<TYPE>-<date>.md`; remediation items go to TODO.md; do not maintain resolution state inside the audit file beyond a header note.
- Do not re-create: AFFILIATE_PROGRAMS.md (merged into [AFFILIATE_PIPELINE.md](AFFILIATE_PIPELINE.md)), CONTENT_CALENDAR.md (queue is in Notion), GSC-TIER2-CHECKLIST.md (done).

## Key IDs / integrations

- PostHog project **408442** (dashboard 1699394); GA4 `G-RKWHJ95P3H`; GSC property `sc-domain:theautomationsguide.com`; Beehiiv form `d41efc59-7041-482b-8178-6d238e6c3cfa`; IndexNow key file `dde35cca97309131104c0505957f0948.txt`.
- Repo secrets: `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `SLACK_WEBHOOK_URL` (+ `GSC_TOKEN_JSON` pending, see TODO).

## Evergreen gotchas (earned the hard way — details in the session log)

1. **No em/en dashes in any published content.** Hard rule. Enforce deterministically (sanitizer/lint), never by prompt alone.
2. **n8n expression tokenizer:** prompt bodies are `={{ ... }}` expressions. No backticks, no inner `{{`/`}}` (space them `{ {`), keep brace count 1/1. `new Function` compile tests do NOT catch this class.
3. **Worktrees in `C:\tmp`** for any branch work (no OneDrive churn). Junction node_modules for sharp: `cmd //c "mklink /J <link> <target>"` (Git Bash eats bare backslashes); `cmd //c rmdir` the junction before `git worktree remove`. OneDrive locks stale worktree metadata — fix via `git worktree prune -v` + remove ONLY git-confirmed-stale dirs.
4. **A pre-gate fixer must scan the same surface as the gate it feeds** (auto-register vs lint-content class). Auto-register's guards: parked/placeholder/app-shell rejection, brand-stem host check, registry-first homepage, logo transparency validation.
5. **GITHUB_TOKEN pushes from inside the qa job** never trigger workflows (only `action_required` stubs, no check runs), so the pushed head has no checks. Since S105 the qa job, on a pass, publishes its `qa` verdict onto the commit it pushed and dispatches PR gates there (a dispatched run's checks are not tied to the PR, so its `pr-gates` job republishes via `checks.create`; #354); a `[qa-fix-N]` head gets no verdict until the merger re-runs qa on it. `issue_comment` workflows run from the DEFAULT branch, so reply-handler fixes only apply once merged to master.
6. **"Fixed (PR open)" is not shipped** — check `gh pr view <n> --json state` before assuming a logged fix is live. **No manual merges (Ian, 2026-10-05):** content PRs merge themselves on green (`auto-merge-content.yml`); every other PR Claude opens gets `gh pr merge --auto --squash` (repo `allow_auto_merge=true`). A PR that cannot go green is fixed in-branch or closed, never merged by hand.
7. **Trailing slash always** (`trailingSlash:'always'`, directory build): internal links, JSON-LD, and screenshot URLs all need the slash form.
8. **Strict CSP:** Pagefind/WASM needs `'wasm-unsafe-eval'`; new third-party endpoints need `_headers` updates; test search on deploy previews, not local preview.
9. **HubSpot-style enum/label traps don't apply here, but Excel-mangled IDs and quote-sensitive regex parsers do:** registry parsers must be quote-agnostic and CRLF-aware (recurring bug class).
10. **`master` requires `qa` + `pr-gates` (ruleset 24417620; `qa` 2026-10-05, `pr-gates` S105).** #334 merged by hand 18 s after a red qa run (dead `/go/marketo/`); there was no branch protection. Non-content PRs report `qa` as skipped, which passes, so `pr-gates` (selftests + build + lint) is their real gate; add any new PR-gates job to its `needs`. Admins can bypass, so a red merge needs `gh pr merge --admin` or the UI bypass box: never use either on a red content PR. Revert: `gh api -X DELETE repos/homegrowngrowthco/theautomationsguide/rulesets/24417620`.
11. **Example phrases in an engine prompt get copied verbatim.** The voice examples "In my testing..." (and S90's fix offering it as the safe alternative to client anecdotes) produced invented hands-on claims in 38% of posts (S103, #345 + #346 scrub). Never model a first-person testing, usage or measurement claim in a prompt; `qa:lint` HARD-fails testing claims on posts dated 2026-10-05+. It happened again inside that fix: its "safe" phrase "I've seen teams get this wrong when..." sat in 150/169 posts, 137 sentences carrying an invented figure (S104, #347 + #348). Model no observation phrase at all; `qa:lint` WARNs on observation + figure.
12. **`/audit-seo` slash command** only loads when the session starts inside `theautomationsguide/`; output goes to `audits/`.
13. **Bing Webmaster Tools IS registered** (2026-04-24, imported from GSC, so no on-site artifact exists). Do not re-doubt it; see [OFF_SITE_SEO_CHECKLIST.md](OFF_SITE_SEO_CHECKLIST.md).
14. **A PostHog `phc_` token does not reveal its project.** Match the bundle token against `api_token` from `GET /api/projects/<id>/` with a key scoped to that project, and never resolve `@current`. 408442 is TAG's alone; pre-split history stays there, so filter insights on both `theautomationsguide.com` and `theautomationsguide.com.` permanently.
15. **The "in my testing" twin posts are not data.** Ian's call is that they stay as-is, but never cite them as measurement. Two indexation claims are also unsettled: inbound links are not required (the 9/06 control indexed with none), and "FAQs predict indexation" is confounded with the sitemap re-read.
16. **`hubspot` affiliate status is `rejected`**, so HubSpot-anchored posts cannot earn.

## Current strategic state (2026-10-16)

**The site was redesigned on 10/02 (Session 101, #335 + #336, production-verified).** Direction "Ink spec" chosen by Ian from four artboards: ink nav, title band and footer frame cream reading surfaces. The post template now opens with a tools panel (the compared tools' dated pricing-index prices and `/go/` buttons) above the fold, a sticky ToC rail and a 70ch column; ComparisonTable shows the index price where the index has one. Lighthouse mobile is 95 to 97 with a11y 100 and CLS 0 on home, posts, /tools/ and the pricing index. The `tool-strip` root class is unchanged, so the 10/15 and 11/26 attribution reads stay comparable (split them at the deploy). About, disclosure, tool hubs and every listing page were rebuilt on 10/05 (#339, `ui/PageHead`); the disclosure page now lists every live program, generated from the registry. See [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

**Since 10/02:** every PR merges itself on green, never by hand (Session 105), and topic generation is scored on GSC signals with the Topic Suggestor retired (Session 110). Latest session: 114 (10/16) in the session log.

**Still true from earlier states:** off-site authority is the binding constraint (zero independent referring domains). Ian dropped pitching the pricing index on 10/01 (Session 98), so the levers left are LinkedIn cadence and the brand-search nudge. The engine publishes twice a day since 9/16 (Session 89), and n8n failures retry themselves (Session 96). The dated states from 8/04 to 10/01 are in [docs/SESSION_LOG.md](docs/SESSION_LOG.md) under those dates.

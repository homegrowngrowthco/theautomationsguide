# Session Log — last updated 2026-05-12

## Recovery Notes (2026-05-05 machine wipe)

This project survived the **2026-05-04** complete machine wipe.

**Preserved:**
- Full git history on GitHub (`homegrowngrowthco/theautomationsguide`, branch `master`). Last commit: 2026-05-05 "Update local paths to new OneDrive location" (the path migration).
- Live production site at theautomationsguide.com (Netlify auto-deploys from `master`).
- All n8n Cloud workflows (`blog-post-engine` v3, `topic-suggestor`, `daily-briefing`) — JSONs in `n8n/` plus live versions in n8n Cloud.
- Notion DBs (Content Calendar `62f34586-4f78-4b83-b2ac-105f500d059e`, Drafts `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`).
- Beehiiv newsletter integration (form ID `d41efc59-7041-482b-8178-6d238e6c3cfa`).
- All 5 published posts in `src/content/blog/`.
- `.claude/settings.json` (project allowlist) — committed to repo.
- Existing `AFFILIATE_PROGRAMS.md`, `OFF_SITE_SEO_CHECKLIST.md`.

**Lost:**
- Local `.claude/settings.local.json` overrides.
- Local Claude Code session history.

**Followup needed:**
- Rotate keys used in n8n credentials (Anthropic, GitHub PAT with `repo` scope, Notion Integration Token). After rotation, update the n8n Cloud credentials with the same names.
- No redeploy needed — Netlify auto-deploys from `master`, the repo is unchanged.
- `.gitignore` updated 2026-05-05 to add `.claude/file-history/` to the existing `.claude/settings.local.json` ignore.

---

## Quick reference — recent additions (Session 8, 2026-05-11 → 2026-05-12)

This session closed out everything left open after Session 7's redesign: shipped the deferred automation workflows, ran the rotation backlog for TheAutomationsGuide, fixed two bugs caught when the QA pipeline ran live for the first time, and produced the first fully-engine-generated + auto-QA-fixed post to land on the site.

**Automation infrastructure (PR #10, merged 2026-05-11):**
- Bumped Netlify to Node 22 LTS (Node 20 maintenance EOL was Apr 2026).
- Added 3 new n8n workflows + 1 GitHub Action:
  - `n8n/posthog-monitor.json` — daily 9am ET PostHog liveness check, Slack-alerts on zero pageviews in 24h.
  - `n8n/notion-publish-status.json` — webhook-triggered, fires on PR merge → flips matching Notion topic to `Published` + Slack ping. Closes the "go mark Published manually" loop.
  - `n8n/error-trigger.json` — n8n native Error Trigger backstop, Slack-alerts on any workflow failure account-wide.
  - `.github/workflows/auto-merge-content.yml` — daily 14:00 UTC GHA that auto-merges `content:`-prefixed PRs that are 14+ days old with all checks passing and no CHANGES_REQUESTED review.
- Setup steps for each documented in [n8n/README.md](n8n/README.md) Workflows 4–7.

**Backfilled 8 existing `.md` posts to `.mdx` with components (PR #11, merged 2026-05-11).** Per-post component picks based on what each post supports — comparison posts got ComparisonTable + StatRow; tutorial got StepRow + SideBySide; framework posts got PullQuote + ComparisonTable; listicle got PullQuote + StepRow. All 8 now have a single contrarian MyTake block + `/go/<slug>` affiliate links on first mentions of each tool from the registry. Three posts (make-vs-zapier-vs-n8n, 5-mistakes, apollo-vs-clay) had no `faqs` field and got 4 each.

**QA-into-engine auto-fix pipeline (PR #12, merged 2026-05-11).** GitHub Action [`.github/workflows/qa-content-pr.yml`](.github/workflows/qa-content-pr.yml) that runs on every `content/*` PR: waits for Netlify deploy preview → captures Playwright screenshots at 4 breakpoints → Claude Vision (`claude-sonnet-4-6`) reviews and returns JSON verdict → if issues found, Claude rewrites the `.mdx` and commits back as `[qa-fix-N]`. Capped at 2 fix attempts to prevent infinite loops; if cap hit, posts a manual-review comment + Slack-pings. Cost ceiling per PR: ~$0.25-$0.30 worst case. Helper scripts in [qa/qa-pr-review.mjs](qa/qa-pr-review.mjs) + [qa/qa-pr-fix.mjs](qa/qa-pr-fix.mjs).

**Right-sized Anthropic models for cost-efficiency (PR #13, merged 2026-05-11).** Audit found 3 social-output Anthropic calls (Twitter / Video / LinkedIn) each running Sonnet 4.6 with the full ~3K-token post body duplicated in each user prompt — ~10K duplicate input tokens per post — and `cache_control` flags set on prompts under the 1024-token threshold so caching was theater. Collapsed into a single `Generate Social Outputs` Haiku 4.5 call returning JSON, with a new `Parse Social Outputs` code node fanning the 3 fields to the existing Save nodes. Switched Topic Suggestor to Haiku 4.5 (simple structured generation, Haiku-reachable quality). Trimmed `max_tokens` caps to right-sized values. Net: ~30% cost reduction (~$0.19 → ~$0.13 per post) with no quality regression. Auto-memory `feedback_right_size_models.md` captures the principle for future projects.

**Key rotations completed (2026-05-12):**
- **Anthropic** (post-malware-wipe rotation, item N1 on parent ROTATION-LIST). 4 consumers updated: 1Password, n8n credential, `theautomationsguide/.env`, GitHub repo secret `ANTHROPIC_API_KEY`. Scope verified by grep across all `claude_projects/` — Anthropic key is only referenced in TheAutomationsGuide.
- **GitHub PAT** (item N2). Switched to fine-grained PAT format (`github_pat_...`) scoped to this repo with `Contents: R/W` + `Pull requests: R/W`. n8n credential updated with `Authorization: Bearer github_pat_...`.
- **Notion Integration Token** (item N3). Reset on `TAG - Content Engine` integration. n8n credential updated with `Authorization: Bearer ntn_...`.

**n8n credential format reference** (matters when rotating):
| Credential name | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` (**raw, no Bearer**) |
| `GitHub PAT` | Header Auth | `Authorization` | `Bearer github_pat_...` |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |
| `PostHog Personal API Key` | Header Auth | `Authorization` | `Bearer phx_...` |

**n8n workflows imported + activated in Cloud (2026-05-12):**
- Re-imported: `blog-post-engine.json` (picks up SVG comment fix from PR #8 + social-outputs collapse from PR #13), `topic-suggestor.json` (Haiku swap from PR #13).
- New imports: `posthog-monitor.json`, `notion-publish-status.json`, `error-trigger.json` — all activated, credentials wired, GitHub webhook configured to fire `notion-publish-status` on every Pull request event.
- Error Trigger set as the "Error workflow" on every other workflow (Blog Engine, Topic Suggestor, Daily Briefing, PostHog Monitor, Notion Publish Status) in Workflow Settings.

**First live QA pipeline run — PR #16 (newsletter automation stack post, merged 2026-05-12).** Surfaced 2 bugs in my GHA implementation, both fixed:
- **Bug 1 (PR #17):** `grep -cE 'pat' || echo "0"` was producing `"0\n0"` when grep found zero matches, breaking `$GITHUB_OUTPUT` parser (`Invalid format '0'`). Fix: replaced with `grep -E 'pat' | wc -l | tr -d ' '` — exits cleanly regardless of match count.
- **Bug 2 (PR #19):** Playwright `fullPage: true` on a 1100-1400-word MDX post at mobile breakpoint produced PNGs > 10,000px tall, which Anthropic Vision rejects (8000px dimension limit). Fix: detect `document.documentElement.scrollHeight` and clip to 7,500px via Playwright's `clip` option when oversized.
- After both fixes, the QA workflow ran end-to-end: Claude Vision found 6 layout issues (4 major + 2 minor: StepRow density at tablet, StatRow padding on mobile, SideBySide diagram unreadable at tablet, PullQuote margin, prose width at desktop, newsletter footer padding asymmetry). Claude rewrote the `.mdx`, committed `[qa-fix-1]` (`575c71f`), Netlify rebuilt the deploy preview with fixes applied. Reviewed visually and merged.

**Known limitation — QA auto-loop is one-shot, not 2-shot, until PAT swap.** The `[qa-fix-N]` commits are pushed with the default `GITHUB_TOKEN`, which by GitHub's security design does NOT trigger downstream workflow runs (loop prevention). So the QA workflow's intended 2-pass verification (review → fix-1 → re-review → optional fix-2 → re-review) currently degrades to a 1-pass (review → fix-1 → human reviews deploy preview manually). To restore full auto-loop, swap the `Commit and push the fix` step in `qa-content-pr.yml` to use a fine-grained PAT secret (e.g., `AUTO_FIX_PAT`) instead of `GITHUB_TOKEN`. Scoped follow-up, not urgent — single-pass auto-fix is a useful workflow even without the second verification.

**Deployment + rollback safety guide (PR #18, merged 2026-05-12).** Added [`DEPLOYMENT.md`](DEPLOYMENT.md) at the project root — plain-language reference covering the mental model (PR → merge → Netlify auto-deploy → `git revert` to undo), three rollback paths (GitHub UI Revert button, `git revert -m 1 <merge-sha>`, Netlify dashboard "Publish older deploy" as emergency button), n8n-specific rollback (git is source of truth → `git show <sha>:n8n/<file>.json` → re-import), recent deployments table with per-PR revert commands, pre-merge checklist, and TL;DR cheat sheet. Pinned for "I don't know what I'm doing, what do I press?" moments.

---

## Quick reference — Session 7 (2026-05-07 PM)

**Visual post format redesign — site-wide.** Posts moved off the 760px-centered "wall of text" layout onto a wider 1280px container with a Forbes/Gartner-style full-width body. All chrome (post header, EmailSignup, AuthorNote, related-tags), homepage `#newsletter` band, and About page also widened. Quick Answer block uses flexbox to vertically-center mixed inline content (works on all 8 existing `.md` posts without edits). Post-header padding tightened (~70px reclaimed around the title divider). Mobile `StatRow` cards trimmed (~30% smaller). PRs: [#7](https://github.com/homegrowngrowthco/theautomationsguide/pull/7).

**MDX component library** at [src/components/post/](src/components/post/) — `SideBySide`, `StatRow`, `PullQuote`, `MyTake` (Ian's amber-bordered aside, distinct from `.quick-answer`), `StepRow`, `Figure`. `ComparisonTable` (existing) refactored to explicit-N-cols so 3-tier comparisons always render in one row. All components share dark-theme tokens and collapse to single-column on mobile. Components used inside `.mdx` posts via `import X from '@/components/post/X.astro'` (uses existing `@/*` tsconfig path alias).

**`@astrojs/mdx` installed.** New posts can mix Markdown + JSX components. Existing `.md` posts continue to render unchanged — no backfill performed. Astro auto-detects extension; engine now writes `.mdx`, but `.md` files stay valid.

**n8n engine v4 — MDX + per-post-type templates.** [n8n/blog-post-engine.json](n8n/blog-post-engine.json) Generate Draft prompt rewritten:
- Reads `Tag` from Notion Content Calendar → maps to one of four `postType` skeletons: `comparison` (1100–1400 words, ComparisonTable + StatRow + SideBySide+SVG decision tree), `tutorial` (800–1100 words, StepRow + SideBySide), `framework` (900–1200 words, PullQuote + StatRow), `opinion` (600–900 words, PullQuote + MyTake-led).
- Inline list of 10 affiliate slugs; rule "first mention only" linkifies tools to `/go/<slug>`.
- Required `MyTake` block with contrarian/experiential claim (omit if no real opinion); single-MyTake limit.
- `SVG / MDX SYNTAX RULE` section explicitly forbids HTML `<!-- -->` comments inside SVG (must use `{/* */}`) — added after PR #6's first build failed on this exact issue.

**Dual idempotency check** (engine plumbing). Before commit, the engine GETs both `${slug}.mdx` AND `${slug}.md` paths on master. Either 200 → abort. Protects all 8 legacy `.md` slugs from clobber via the new `.mdx` path. Architecture: existing "Check Idempotency" renamed → "Check Idempotency MDX"; new "Check Idempotency MD" node inserted between MDX check and Confirm Not Exists; Confirm Not Exists updated to verify both 404 before creating branch.

**Humanize prompt update.** Existing banned-words list preserved. New rules: verify the 7-line `import` block at top of file is intact; verify exactly one `<MyTake>` block (rewrite as contrarian if found generic); verify `/go/<slug>` on first mention of each affiliate-list tool.

**Pagefind static search wired in.** Build script chained: `astro build && pagefind --site dist`. Index at `/pagefind/` (server-side, zero client JS at idle, ~50KB UI loaded only on `/search`). New page [src/pages/search.astro](src/pages/search.astro) hosts the Pagefind UI with dark-theme tokens. Nav input submits to `/search?q=...`. In `npm run dev`, search page shows a "build first" placeholder since the index doesn't exist in dev mode.

**Navbar overhaul.** Bigger text (links 1rem, logo 1.0625rem), taller bar (`--nav-h: 72px`). New right cluster at desktop ≥1024px: search input (focus-expands 220→260px) + Newsletter CTA button (links to `/#newsletter` anchor on homepage) + LinkedIn icon. Tablet 768–1023px shows search only. Mobile <768px shows links only (unchanged from before). LinkedIn icon link goes to Ian's profile.

**QA pipeline at [qa/](qa/) — Playwright + Claude Vision.**
- `npm run qa:screenshots` — Playwright/Chromium captures every blog post + homepage/blog/tools/about/search at 4 breakpoints (375/768/1280/1440px), full-page PNGs to `qa-screenshots/<slug>/<viewport>.png` (gitignored).
- `npm run qa:review` — sends each page's 4 viewports to `claude-sonnet-4-6` with a layout-issue-focused prompt; writes `qa-review.md` (gitignored). Cost ~$0.15–0.25 per full run.
- `npm run qa` — runs both.
- Setup: needs `ANTHROPIC_API_KEY` in `.env`. Playwright Chromium installs to `%USERPROFILE%\AppData\Local\ms-playwright\` (outside OneDrive, ~150MB).
- Override base URL via `QA_BASE_URL=https://deploy-preview-N--...netlify.app npm run qa:screenshots` to QA a Netlify deploy preview directly.

**Node.js 24 LTS installed locally** via winget. Netlify build still on Node 20 per `netlify.toml` — works fine, but worth bumping to 22 LTS or 24 LTS in a future iteration since Node 20 hits maintenance EOL April 2026.

**New devDependencies in [package.json](package.json):** `@astrojs/mdx@^3`, `pagefind@^1`, `playwright@^1`, `@anthropic-ai/sdk@^0`, `dotenv@^17`. Net `node_modules` growth ~50MB (Playwright the bulk; Chromium binary lives outside OneDrive).

**Engine update artifact:** [n8n/update-engine-for-mdx.mjs](n8n/update-engine-for-mdx.mjs) is the one-shot Node script that converted v3 → v4. Source of truth for how the prompts were constructed. Don't re-run on the post-update JSON (it errors on missing `Check Idempotency` original name).

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_qa_before_user_review.md` — run mobile + desktop QA passes independently before declaring visual changes done
- `feedback_qa_auto_fix_workflow.md` — for QA-on-generation pipelines, default to autofix-and-recommit, not propose-and-wait

**Action required of Ian after this session:** re-import [n8n/blog-post-engine.json](n8n/blog-post-engine.json) into n8n Cloud so the live engine picks up the SVG comment fix from PR #8. The live engine is currently on the version imported earlier today (which produces MDX correctly but can recur the HTML-comment-in-SVG bug PR #6 hit). Master's JSON now has the fix in the prompt.

---

## Quick reference — earlier additions (Session 6, 2026-05-07 AM)

**Repo hygiene improvements (one-time, durable):**
- `delete_branch_on_merge = true` enabled on the GitHub repo (Settings → General → Pull Requests). Future PR merges auto-delete the head branch.
- `remote.origin.prune = true` set on the local clone. `git fetch`/`git pull` now auto-removes remote-tracking refs for deleted branches.
- Net effect: no more stale merged-branch accumulation requiring manual cleanup.

**Notion MCP fix (workspace mismatch):** claude.ai's Notion connector had been auth'd to Ian's personal workspace, not "The Automations Guide" workspace, so MCP `notion-fetch`/`create-pages` calls 404'd against the Content Calendar even though the n8n integration ("TAG - Content Engine") had access. Fixed by disconnecting and reconnecting Notion in claude.ai → Settings → Connectors with the correct workspace selected, then adding the Claude integration to the Content Calendar DB. MCP can now read/write the DB directly.

**Kit affiliate launch — 8 topic batch added to Notion review queue:** Kit was approved for the affiliate program (50% recurring 12mo via PartnerStack). 8 Kit-monetizable topics (4 high-intent comparisons, 1 high-priority migration guide, 3 medium workflow/tools/guide) now sit in the Content Calendar with `Status = Suggested`. All 8 funnel to `/go/kit`. Flip to `Queued` to feed the n8n blog engine. Source plan: see prior `n8n/topic-suggestions/2026-05-07-kit-launch.md` (branch deleted after Notion sync; topic content lives in Notion now).

**Drift reconciled from a parallel Claude Code Desktop session:** Desktop session created a `claude/add-article-ideas-FkSz5` branch on the remote (1 commit, the kit-launch markdown) without VS Code knowing. Local master was also 1 PR-merge behind remote (PR #4, Apollo article). Both reconciled. Going forward: VS Code is the canonical workspace for this repo; avoid running parallel desktop sessions on the same project.

---

## Quick reference — earlier additions (Session 5, 2026-05-03)

**Legal pages live:** `/privacy`, `/terms`, `/disclosure` — all `noindex, follow`. Footer updated to link them.

**Affiliate redirect system:** Centralized in `src/data/affiliate-links.ts`. Use `/go/<slug>` in any post or component. The `/go/[tool]` Astro page fires a PostHog `affiliate_click` event before redirecting (works once PostHog is installed). 10 tools registered, all with `status: 'pending'` until real URLs come in.

**ComparisonTable component:** `src/components/ComparisonTable.astro`. Drop into any post for a multi-tool comparison with affiliate CTAs. See component header for usage example.

**Topic Suggestor prompt:** Updated to weight commercial intent — explicit hierarchy from "highest intent (comparisons/alternatives)" down to "lower intent (opinion)". Mix targets 3+ HIGHEST INTENT per batch.

**Blog engine LinkedIn output:** New parallel branch in `blog-post-engine.json`. Generates LinkedIn post + saves to Drafts DB alongside Twitter thread + video script. Uses LinkedIn-specific best practices (hook in first 210 chars, line breaks every 1-2 sentences, 1200-1800 char target, anti-cliché ruleset).

Running log across all sessions. Use as context when starting a new Claude Code session.

---

## Table of Contents

1. [Astro Site — theautomationsguide.com](#1-astro-site--theautomationsguidecoms)
2. [n8n Blog Post Generator Workflow](#2-n8n-blog-post-generator-workflow)
3. [90-Day Launch Plan — Notion](#3-90-day-launch-plan--notion)
4. [Open Placeholders (all three projects)](#4-open-placeholders--all-three-projects)
5. [Master Next Steps](#5-master-next-steps)

---

## 1. Astro Site — theautomationsguide.com

### Repo & deployment

- **GitHub:** `github.com/homegrowngrowthco/theautomationsguide`
- **Branch:** `master` (not `main`)
- **Netlify:** auto-deploys on push to `master` — no manual step needed after `git push`
- **Local path:** `C:\Users\Ian\OneDrive\Documents\claude_projects\theautomationsguide\`

### Site structure

```
theautomationsguide/
├── astro.config.mjs           # site URL + @astrojs/sitemap@3.1.6
├── netlify.toml               # build: npm run build, publish: dist
├── OFF_SITE_SEO_CHECKLIST.md  # manual submission/distribution checklist
├── public/
│   ├── favicon.svg
│   ├── robots.txt             # AI crawler allow rules + sitemap pointer
│   ├── _headers               # Netlify security headers (CSP, HSTS, etc.)
│   └── _redirects             # www → apex 301 redirect
├── src/
│   ├── components/
│   │   ├── AuthorNote.astro   # E-E-A-T author callout, left-border accent, on every post
│   │   └── EmailSignup.astro  # Beehiiv embed — disabled until real URL is set
│   ├── content/
│   │   ├── config.ts          # Schema: title, description, pubDate, tags, draft, faqs (optional)
│   │   └── blog/
│   │       ├── revops-tech-stack-2025.md
│   │       ├── zapier-vs-make-for-gtm-teams.md
│   │       ├── automate-sales-handoff-hubspot-slack.md
│   │       └── revops-automation-stack-2026.md
│   ├── layouts/
│   │   ├── BaseLayout.astro       # nav, footer, all <head> meta, JSON-LD, named head slot
│   │   └── BlogPostLayout.astro   # read time, tags, EmailSignup, AuthorNote, BlogPosting/FAQ JSON-LD
│   ├── pages/
│   │   ├── index.astro        # homepage
│   │   ├── about.astro        # first-person, E-E-A-T focused
│   │   ├── tools.astro        # affiliate hub: 3 categories, 9 tools
│   │   ├── 404.astro          # friendly 404 with noindex
│   │   ├── llms.txt.ts        # dynamic /llms.txt endpoint — article index for AI engines
│   │   ├── rss.xml.js         # RSS feed via @astrojs/rss
│   │   └── blog/
│   │       ├── index.astro    # blog listing with tag cloud
│   │       └── [slug].astro   # dynamic post route
│   └── styles/
│       └── global.css         # dark theme, design tokens, .quick-answer utility class
```

### Key decisions

- **Framework:** Astro 4.x static output — no JS framework, fast, good for SEO
- **CSS:** Custom dark-mode, no Tailwind — edit `global.css` directly
- **Sitemap:** `@astrojs/sitemap@3.1.6` (NOT 3.7.x — crashes on Astro 4.16.x with `reduce` error)
- **Newsletter:** Beehiiv embed — disabled until real URL is set in `EmailSignup.astro`
- **E-E-A-T:** `AuthorNote` on every post + first-person About page
- **Affiliate links:** All use `AFFILIATE_LINK_PLACEHOLDER` — safe to push, replace before live promotion
- **Content management:** Markdown files in `src/content/blog/` — commit and push to deploy
- **SEO/GEO:** Sitemap, RSS, llms.txt, robots.txt with AI crawlers, JSON-LD structured data all live as of 2026-04-24
- **Security headers:** Netlify `_headers` file — CSP, HSTS, X-Frame-Options, Referrer-Policy all active

### Session 1 problems solved

| Problem | Resolution |
|---|---|
| `gh` CLI not on PATH after winget install | Used full path `/c/Program Files/GitHub CLI/gh.exe` |
| `gh auth login` wouldn't complete via `!` prefix | Ian ran `& "C:\Program Files\GitHub CLI\gh.exe" auth login` in a separate PowerShell window |
| Git identity not configured | Set `user.email = ian@homegrowngrowth.co`, `user.name = Ian` globally |

### Session 2 problems solved

| Problem | Resolution |
|---|---|
| `@astrojs/sitemap@3.7.2` crashed with `reduce` error | Downgraded to `3.1.6` |
| n8n body expressions with apostrophes | Switched to ES6 backtick template literals for system prompts |
| GitHub commit needed base64 of humanized content | Used `Buffer.from($json.content[0].text).toString('base64')` inline |

### Session 3 problems solved

| Problem | Resolution |
|---|---|
| Bash tool calls kept getting interrupted/denied | Created `.claude/settings.json` with allowlist for `git add/commit/push` and `npm install/build` |

### Session 4 — Content engine v3 + Topic Suggestor + Daily Briefing + affiliate research (2026-05-03)

Reassessed site (no rebuild needed — Astro/Netlify is the right shape for hands-off review/tweak workflow). Rebuilt the n8n content engine into a PR-based flow so reviews happen on Netlify deploy previews. Researched affiliate programs for the 8 site tools + 5 high-value adjacent programs.

| File | What changed |
|---|---|
| `n8n/blog-post-engine.json` | NEW — v3 workflow (Notion topic queue, PR flow, idempotency check, claude-sonnet-4-6 + prompt cache). Live & tested end-to-end (PR #1 created successfully) |
| `n8n/topic-suggestor.json` | NEW — Mon/Thu — Claude proposes 5 topics based on coverage gaps, written as `Suggested` for batch approval (5 min twice/week) |
| `n8n/daily-briefing.json` | NEW — daily 7:30am — single Slack ping summarizing PRs to review, topics to approve, drafts to post. Skips post when nothing pending |
| `n8n/create-content-databases.js` | NEW — provisions Content Calendar + Drafts DBs in Notion, seeds 3 sample topics. Updated to include `Suggested` status |
| `n8n/README.md` | NEW — full setup guide for all three workflows |
| `n8n/blog-post-engine-v2-archive.json` | Archived v2 (was at repo-root `workflows`) for reference |
| `AFFILIATE_PROGRAMS.md` | NEW — Tier 1/2/3 application URLs, commission rates, cookie windows. Confirmed Zapier/Gong/Chorus have no public affiliate program — drop from site |
| Removed `workflows.zip` (unneeded) and the loose `workflows` file |

Reasoning: Ian wants hands-off + scalable + review-friendly across multiple businesses. Three-workflow system gives him "agents propose, human approves in batch, agents execute" pattern: Topic Suggestor proposes → Ian flips Suggested → Queued → Blog Engine generates + opens PR → Ian reviews on Netlify preview → merges. Daily Briefing is the single morning check-in point that consolidates "what needs me today."

Bug fixed mid-session: Notion update-page calls in v3 used POST instead of PATCH (Notion's update endpoint requires PATCH). Fixed in workflow JSON + manually in Ian's running instance. Fix details in feedback memory `feedback_notion_api_quirks.md`.

### Session 3 — SEO/GEO infrastructure added (2026-04-24)

All committed and live on Netlify. Verified 200s on all endpoints.

| File | What it does |
|---|---|
| `public/robots.txt` | Added explicit `Allow: /` for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, ChatGPT-User, Applebot-Extended, CCBot |
| `public/_headers` | Netlify security headers: CSP, HSTS (2yr + preload), X-Frame-Options DENY, Referrer-Policy, Permissions-Policy |
| `public/_redirects` | www → apex 301 redirect |
| `src/pages/llms.txt.ts` | Dynamic Astro endpoint — generates `/llms.txt` from blog collection at build time; machine-readable article index for AI engines |
| `src/pages/rss.xml.js` | RSS feed via `@astrojs/rss`; posts sorted by pubDate desc |
| `src/pages/404.astro` | Custom 404 with noindex meta, links to /blog and / |
| `src/layouts/BaseLayout.astro` | Added: sitemap link, RSS autodiscovery, theme-color, robots meta (max-snippet/image), author, generator, BreadcrumbList JSON-LD on all pages, Organization JSON-LD on homepage, named `<slot name="head">` for per-page schema injection |
| `src/layouts/BlogPostLayout.astro` | Added: BlogPosting JSON-LD on every post; FAQPage JSON-LD when post frontmatter has `faqs:` array |
| `src/content/config.ts` | Added optional `faqs` field: `z.array(z.object({ question, answer })).optional()` |
| `src/styles/global.css` | Added `.quick-answer` utility class — teal left-border callout for LLM-extractable TL;DR blocks |
| `OFF_SITE_SEO_CHECKLIST.md` | Manual checklist: GSC submission, Bing, social profiles, affiliate applications, GEO baseline test |
| `.claude/settings.json` | Permission allowlist so Claude can run git/npm commands without prompting |

### How to use new SEO features in posts

**Add FAQ structured data to a post:**
```yaml
---
title: "My Post"
faqs:
  - question: "What is X?"
    answer: "X is Y."
  - question: "How do I Z?"
    answer: "You Z by doing W."
---
```

**Add a TL;DR block LLMs can extract:**
```html
<div class="quick-answer">
  <strong>Quick answer:</strong> Your one-sentence summary here.
</div>
```

**To-do before apple-touch-icon is active:**
Add a 180×180px PNG at `public/apple-touch-icon.png`, then uncomment the link in `BaseLayout.astro`.

**To-do before sameAs social signals work:**
In `BaseLayout.astro`, find `sameAs: []` and populate with your LinkedIn company page URL and Twitter/X URL once those accounts exist.

**When Beehiiv is enabled:**
Update `Content-Security-Policy` in `public/_headers` — add `frame-src https://embeds.beehiiv.com` and update `form-action` to include `https://embeds.beehiiv.com`.

---

## 2. Content Engine — n8n (v3, 2026-05-03)

**Folder:** `n8n/` in this repo
**Files:**
- `n8n/blog-post-engine.json` — main workflow (Notion topic → blog PR + social drafts)
- `n8n/topic-suggestor.json` — Mon/Thu — Claude suggests 5 topics based on coverage gaps, writes as `Suggested` for batch approval
- `n8n/daily-briefing.json` — daily 7:30am — single Slack message: PRs to review, topics to approve, drafts to post
- `n8n/create-content-databases.js` — one-off Node script to create the Notion DBs
- `n8n/README.md` — full setup guide for all three workflows
- `n8n/blog-post-engine-v2-archive.json` — old v2 (direct-to-master commit, hardcoded topic) for reference only

**Current Notion DB IDs (live):**
- Content Calendar: `62f34586-4f78-4b83-b2ac-105f500d059e`
- Content Drafts (Social): `7399699b-ef9d-4ef4-8c2c-4749f99b5b76`

These are pre-filled in the Config nodes of all three workflow JSONs.

### Pipeline (v3)

```
Manual Trigger ──┐
                 ├──▶ Config (DB IDs, repo, slack URL)
Weekday 8am ─────┘           │
                             ▼
                  Get Next Topic (Notion query: Status = Queued)
                             │
                             ▼
                  Parse Topic → Mark "Generating" in Notion
                             │
                             ▼
                  Generate Draft (Claude sonnet-4-6, with prompt cache)
                             │
                             ▼
                  Humanize (strips AI fingerprint words, adds opinions)
                             │
                             ▼
                  Parse Draft (extract title, build slug + branch name)
                             │
                             ▼
                  Check Idempotency (GET file on master — 404 = safe)
                             │
                             ▼
                  Get Base SHA → Create Branch → Commit File → Open PR
                             │
              ┌──────────────┼──────────────┬──────────────┐
              ▼              ▼              ▼              ▼
        Mark Topic      Generate       Generate       Slack
        "In Review"     Twitter        Video          Notification
        + PR URL        Thread         Script         (with PR URL)
                            │              │
                            ▼              ▼
                    Save Thread     Save Script
                    to Drafts DB    to Drafts DB
```

### Key v3 changes from v2

| What | v2 | v3 |
|---|---|---|
| Topic source | Hardcoded in Set node | Notion Content Calendar (Status = Queued) |
| Model | claude-sonnet-4-5 | claude-sonnet-4-6 + prompt caching |
| Commit flow | Direct push to `master` | Create branch + open PR (Netlify builds preview) |
| Idempotency | None — would overwrite | Pre-check via GitHub Contents API; aborts if file exists |
| Topic state | Lost after run | Notion status: Queued → Generating → In Review → Published |
| Notion DBs | One DB ("blog") | Two DBs (Content Calendar + Content Drafts) |
| Slack message | Links to GitHub blob | Links to PR (Netlify auto-comments preview URL) |

### Credentials (n8n) — exact names matter

| Credential name | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` |
| `GitHub PAT` | Header Auth | `Authorization` | `token ghp_...` (needs `repo` scope) |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |

### Config node values to fill in

| Field | What to put |
|---|---|
| `topicsDatabaseId` | Content Calendar DB ID (printed by `create-content-databases.js`) |
| `draftsDatabaseId` | Content Drafts DB ID (same script) |
| `slackWebhookUrl` | Incoming Webhook URL from Slack |
| `githubOwner` / `githubRepo` / `githubBaseBranch` / `siteBaseUrl` | Pre-filled |

### Content Calendar DB schema (created by the script)

| Property | Type | Required | Notes |
|---|---|---|---|
| Topic | Title | yes | The post idea |
| Status | Select | yes | Queued, Generating, In Review, Published, Skipped |
| Priority | Select | recommended | High, Medium, Low — engine picks highest first |
| Tag | Select | recommended | revops, automation, tools, comparison, guide — first frontmatter tag |
| Target Keyword | Rich text | optional | SEO hint to LLM |
| Notes | Rich text | optional | Angle, must-includes, contrarian takes |
| PR URL | URL | auto | Filled when PR opens |
| Pub Date | Date | auto | Filled when PR opens |
| Created | Created time | auto | Used as tie-breaker for sort |

### Content Drafts DB schema (created by the script)

| Property | Type | Notes |
|---|---|---|
| Name | Title | "Twitter: [post title]" or "Video: [post title]" |
| Status | Select | Draft – Needs Review, Script – Needs Review, Approved, Posted, Skipped |
| Type | Select | Twitter Thread, Video Script, LinkedIn Post |
| PR URL | URL | Links back to the post PR |
| Pub Date | Date | ISO date of generation |

### Review flow

1. PR opens automatically with title `content: [post title]`
2. Netlify builds deploy preview within ~2 min, comments URL on PR
3. Slack ping: PR link
4. Open preview URL — read post like a visitor
5. Edit on GitHub directly if needed (commit to same branch → preview rebuilds)
6. Click Merge → master deploys → live within ~2 min

### Known gotchas

- **Notion property names are case-sensitive** — `Topic`, `Target Keyword`, `PR URL` etc. must match exactly
- **GitHub PAT scope** — needs `repo` for branch creation on private repos (`public_repo` enough for public)
- **Notion 2000-char cap** still applies — Twitter thread + video script truncated to 1999 chars in Drafts DB
- **Same topic generates same slug → idempotency check throws** — by design. Reword topic or delete existing post
- **No queued topics → workflow stops cleanly** (Parse Topic returns empty array). Add topics, next run picks up

---

## 3. 90-Day Launch Plan — Notion

**Notion root page:** https://www.notion.so/34a7e25f0a1681fa9a88c329a60fb71a
**Script:** `C:\Users\Ian\OneDrive\Documents\claude_projects\create-notion-plan.js`

### Structure

```
The Automations Guide — 90 Day Launch Plan
├── Plan Overview table
├── Phase 1 — Foundation (Days 1–30)   → 39 tasks, Week 1–4
├── Phase 2 — Traction (Days 31–60)    → 21 tasks, Week 5–8
└── Phase 3 — Optimize (Days 61–90)    → 23 tasks, Week 9–13
```

Each database: **Task** · **Week** (select) · **Day** (number) · **Category** · **Priority** · **Status** · **Notes**
All 83 rows pre-populated as "Not Started".

### Phase goals

| Phase | Days | Goal | Key Milestone |
|---|---|---|---|
| Foundation | 1–30 | Pipeline live, site live, affiliates applied, social active | First 3 posts via pipeline; X + TikTok created |
| Traction | 31–60 | 500 visitors/mo, 100 email subscribers, first affiliate clicks | Make vs Zapier comparison live; X at 5x/week |
| Optimize | 61–90 | $100+ affiliate revenue, 500 subscribers, clear picture of what works | Second high-intent page; Beehiiv Boost evaluated; retrospective written |

### Tasks breakdown

| Category | Phase 1 | Phase 2 | Phase 3 | Total |
|---|---|---|---|---|
| Setup | 16 | 1 | 0 | 17 |
| Content | 6 | 5 | 5 | 16 |
| Distribution | 9 | 8 | 0 | 17 |
| Monetization | 8 | 0 | 5 | 13 |
| Analytics | 5 | 7 | 13 | 25 |
| **Total** | **39** | **21** | **23** | **83** |

Analytics is back-loaded — Phase 3 is almost entirely assessment and decisions.

### Re-running the script

```bash
npm install @notionhq/client
NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=your_page_id node create-notion-plan.js
```

Or edit the two constants at the top of the file directly. Script validates both are set before making API calls.

### Notion plan next steps

- Set a default filter on each database view to show only the current week's tasks
- Add a formula column for actual date: `dateAdd(date("2026-04-22"), prop("Day") - 1, "days")`
- Drive `blogTopic` in n8n from the Notion plan — query `Category = Content AND Status = Not Started`
- Add a Beehiiv subscriber count tracker table
- Use Day 89 go/no-go output to create a Phase 4 page if warranted

---

## 4. Open Placeholders (current state — 2026-05-03 EOD)

| Placeholder | Where | Status |
|---|---|---|
| `BEEHIIV_EMBED_URL_PLACEHOLDER` | `src/components/EmailSignup.astro` | ✅ Done — Beehiiv form ID `d41efc59-7041-482b-8178-6d238e6c3cfa` wired |
| `AFFILIATE_LINK_PLACEHOLDER` (raw) | `src/pages/index.astro`, `src/pages/tools.astro` | ✅ Replaced with `/go/[tool]` redirects. Real affiliate URLs still needed in `src/data/affiliate-links.ts` once approvals come in |
| `[COMPANY_LOGOS_PLACEHOLDER]` | `src/pages/index.astro` hero | ✅ Replaced with HGC publisher line |
| `ian@theautomationsguide.com` | `src/pages/about.astro` and legal pages | ✅ Done — alias on Ian's HGC Google Workspace |
| Notion DB IDs / Slack URL | n8n Config nodes | ✅ Filled in workflow JSONs (Content Calendar `62f34586-...`, Drafts `7399699b-...`) |
| `sameAs: []` | `src/layouts/BaseLayout.astro` | ✅ Populated with LinkedIn (Ian) + HGC. TAG company page LinkedIn/Twitter URLs still pending |
| Apple touch icon | `public/apple-touch-icon.png` | ✅ Done (HGC's icon) |
| OG image template | `public/og-default.png` | ❌ Not done — needs design work |

---

## 5. Master Next Steps (current state — 2026-05-12 EOD)

### What's running already

- [x] Site live on theautomationsguide.com, auto-deployed from `master` via Netlify (Node 22 LTS).
- [x] **Content engine v4** (MDX + per-post-type templates + dual idempotency + Haiku for social outputs) live in n8n Cloud. ~$0.13 per post API spend.
- [x] **Topic Suggestor** (Haiku 4.5, Mon/Thu) + **Daily Briefing** (Slack ping each morning) live in n8n Cloud.
- [x] **Auto-merge content PRs GHA** (daily 14:00 UTC, 14-day staleness threshold, Slack-notifies via `SLACK_WEBHOOK_URL` repo secret).
- [x] **QA auto-fix pipeline GHA** (Claude Vision review + 2-fix-cap, ~$0.30 worst-case per PR) — see Session 8 note about one-shot limitation pending PAT swap.
- [x] **PostHog liveness monitor** in n8n (daily 9am ET, Slack-alerts on zero pageviews in 24h).
- [x] **Notion publish-status webhook** in n8n (auto-flips Notion topic Status → Published on PR merge + Slack notification).
- [x] **n8n Error Trigger backstop** wired as "Error workflow" on every active n8n flow.
- [x] **Pagefind static search** — index built at `npm run build`, served from `/pagefind/`, navbar input + `/search` page.
- [x] **Visual MDX component library** (SideBySide, StatRow, PullQuote, MyTake, StepRow, Figure, ComparisonTable) used in all 9 published posts.
- [x] PostHog analytics + Beehiiv newsletter wired and shipping.
- [x] HGC publisher branding (AuthorNote, About, footer, schema).
- [x] Legal pages (privacy, terms, disclosure).
- [x] `/go/[tool]` affiliate redirect system with PostHog tracking.
- [x] Apple touch icon, email alias `ian@theautomationsguide.com`, GSC + Bing submitted.
- [x] (2026-05-12) **Anthropic / GitHub PAT / Notion Integration Token all rotated** through every consumer (1Password, n8n credential, `.env`, GitHub repo secret as applicable).
- [x] (2026-05-12) **First fully-engine-generated + auto-QA-fixed post live** — `/blog/2026-05-12-newsletter-automation-stack-...` (PR #16, qa-fix-1 applied 6 layout issues).
- [x] [DEPLOYMENT.md](DEPLOYMENT.md) — rollback safety guide pinned at repo root.

### Open — Ian (immediate, this week)

- [ ] **Review the 8 Kit-affiliate topic suggestions** in the Notion Content Calendar — flip the ones to write to `Queued` (engine picks highest priority on next weekday 8am run; uses v4 MDX format + QA pipeline).
- [ ] **Apply to remaining affiliate programs** — see `AFFILIATE_PROGRAMS.md` for Tier 1/2/3 + the additional 15 in conversation.
- [ ] **As approvals come in:** edit `src/data/affiliate-links.ts` — change `url: ''` to real affiliate URL, change `status: 'pending'` to `'live'`, commit + push.
- [ ] **Verify PostHog:** open live site in incognito → check PostHog Live Events tab → confirm pageviews + click events fire. (Daily liveness monitor will Slack-alert if it drops to zero, so this is mainly a one-time setup check.)
- [ ] **Verify Beehiiv:** subscribe with test email → confirm signup attributes correctly to source URL.
- [ ] **Create TAG LinkedIn Company Page** + send URL to add to `sameAs` in BaseLayout.

### Open — Ian (next 2-4 weeks)

- [ ] **Distribution: post on LinkedIn 3-5×/week** (via TAG company page per Ian's preference).
- [ ] **Approve Topic Suggestor's biweekly suggestions** in Notion (flip `Suggested` → `Queued` for the good ones).
- [ ] **Pitch 2-3 podcasts/month** — RevOps Podcast (Sweep), Modern Sales, Sales Hacker, GTM Now.
- [ ] **Join + post in 2-3 RevOps communities** — RevOps Co-op (Slack, free), Modern Sales Pros, Pavilion.
- [ ] **Build first lead magnet** — e.g., RevOps Stack Audit Notion template, gated by Beehiiv subscribe.
- [ ] **GEO baseline test** — search target queries in ChatGPT, Perplexity, Claude, Gemini; log results.

### Open — engine + automation improvements (Claude can pick these up later)

- [ ] **Restore QA auto-loop 2nd-pass verification** — swap `Commit and push the fix` step in `.github/workflows/qa-content-pr.yml` from `GITHUB_TOKEN` to a fine-grained PAT secret (e.g., `AUTO_FIX_PAT`). Currently the pipeline is one-shot because GitHub Actions security blocks the bot's pushes from triggering new workflow runs. ~15 min when prioritized.
- [ ] **Beehiiv liveness equivalent** — n8n daily ping on Beehiiv subscriber count API, Slack-alert on form-id failure or zero new subscribers over N days. Pattern documented in `n8n/README.md` Workflow 4 § Beehiiv equivalent.
- [ ] **OG image template** — static PNG at `public/og-default.png` (needs design tool).
- [ ] **Bump Netlify Node 22 → 24 LTS** when Node 22 enters maintenance (April 2027). One-line change in `netlify.toml`.
- [ ] **Per-business shared n8n sub-workflows** (Slack notifier, error logger) once a 2nd business uses the pattern.
- [ ] **Move affiliate registry to Notion or edge function** if you tire of pushing one-line commits to update affiliate URLs once 5+ are live. Sketched in earlier session — not urgent.

### Revert paths (in case anything breaks)

| Concern | Revert command |
|---|---|
| Latest content PR not what you want | `git revert 73a8e86` (PR #16 — newsletter automation post) |
| Backfilled posts look worse than originals | `git revert 52e6807` (PR #11 — backfill 8 posts to MDX) |
| QA auto-fix pipeline misbehaves | `git revert c2c2b18` (PR #12 — QA pipeline) — engine still works without QA loop |
| Right-size models causing social output quality regression | `git revert 8733108` (PR #13 — model right-sizing) — restores 3 Sonnet social calls |
| Automation workflows / Node 22 / auto-merge GHA broken | `git revert b9f4932` (PR #10 — automation improvements) |
| QA workflow `grep -c` or screenshot height bugs surface again | `git revert 0ac804b` (PR #17) or `git revert 2e248ae` (PR #19) — both are bug fixes; reverting restores the failing behavior. Don't revert these. |
| Visual format redesign caused regression | `git revert a83b5cd` (PR #7) |
| Engine v4 MDX prompt produces bad output | `git revert c23036c` (PR #8) — falls back to pre-fix v4 prompt. To fully revert to v3 markdown engine: `git revert a83b5cd` and re-import the resulting JSON into n8n Cloud. |

For step-by-step rollback instructions (UI / CLI / Netlify emergency button) see [DEPLOYMENT.md](DEPLOYMENT.md).

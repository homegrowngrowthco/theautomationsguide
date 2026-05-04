# Session Log — last updated 2026-05-03

## Quick reference — recent additions (Session 5, 2026-05-03)

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
- **Local path:** `C:\Users\ianch\theautomationsguide\`

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
**Script:** `C:\Users\ianch\create-notion-plan.js`

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

## 5. Master Next Steps (current state — 2026-05-03 EOD)

### What's running already

- [x] Site live, deployed on Netlify, full SEO/GEO infrastructure
- [x] Content engine v3 + Topic Suggestor + Daily Briefing workflows live in n8n Cloud
- [x] PostHog analytics + Beehiiv newsletter wired and shipping
- [x] HGC publisher branding (AuthorNote, About, footer, schema)
- [x] Legal pages (privacy, terms, disclosure)
- [x] `/go/[tool]` affiliate redirect system with PostHog tracking
- [x] ComparisonTable component for tool comparisons in posts
- [x] All 5 existing posts have `faqs:` arrays + `.quick-answer` blocks
- [x] Engine prompt updated to auto-generate FAQs + quick-answer for new posts
- [x] Apple touch icon
- [x] Email alias `ian@theautomationsguide.com`
- [x] GSC + Bing submitted

### Open — Ian (this week)

- [ ] **Apply to remaining affiliate programs** — see `AFFILIATE_PROGRAMS.md` for Tier 1/2/3 + the additional 15 in conversation
- [ ] **As approvals come in:** edit `src/data/affiliate-links.ts` — change `url: ''` to real affiliate URL, change `status: 'pending'` to `'live'`, commit + push
- [ ] **Verify PostHog:** open live site in incognito → check PostHog Live Events tab → confirm pageviews + click events fire
- [ ] **Verify Beehiiv:** subscribe with test email → confirm signup attributes correctly to source URL
- [ ] **Create TAG LinkedIn Company Page** + send URL to add to `sameAs` in BaseLayout

### Open — Ian (next 2-4 weeks)

- [ ] **Distribution: post on LinkedIn 3-5×/week** (via TAG company page per Ian's preference)
- [ ] **Approve Topic Suggestor's biweekly suggestions** in Notion (flip `Suggested` → `Queued` for the good ones)
- [ ] **Pitch 2-3 podcasts/month** — RevOps Podcast (Sweep), Modern Sales, Sales Hacker, GTM Now
- [ ] **Join + post in 2-3 RevOps communities** — RevOps Co-op (Slack, free), Modern Sales Pros, Pavilion
- [ ] **Build first lead magnet** — e.g., RevOps Stack Audit Notion template, gated by Beehiiv subscribe
- [ ] **GEO baseline test** — search target queries in ChatGPT, Perplexity, Claude, Gemini; log results

### Open — engine improvements (Claude can pick these up later)

- [ ] OG image template — static PNG at `public/og-default.png` (needs design tool)
- [ ] Handwrite "Make vs Zapier vs n8n" flagship post (~3,000 words, ComparisonTable + `/go/` links)
- [ ] LinkedIn output: replace TAG-engine "Twitter Thread" branch with LinkedIn-only since TAG audience won't be on Twitter anyway
- [ ] Error Trigger workflow in n8n for Claude/GitHub failure paths
- [ ] Auto-merge content PRs after N days of no review (GitHub Actions)
- [ ] Per-business shared n8n sub-workflows (Slack notifier, error logger) once 2nd business uses pattern

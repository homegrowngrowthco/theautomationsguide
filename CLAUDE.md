# Session Log — last updated 2026-04-24

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

## 2. n8n Blog Post Generator Workflow

**File:** `C:\Users\ianch\blog-post-generator-workflow.json` (version 2)

### Pipeline

```
Manual Trigger ──┐
                 ├──▶ Set Topic & Config
Daily Schedule ──┘           │
                             ▼
                    Generate Blog Post (Claude claude-sonnet-4-5)
                             │
                             ▼
                    Parse Blog Response (Code node)
                    [validates response, extracts title, generates slug,
                     base64-encodes content, builds GitHub URL,
                     spreads config forward]
                             │
                             ▼
                    Humanize Blog Post (Claude claude-sonnet-4-5)
                    [strips AI fingerprint words, adds opinionated takes,
                     varies sentence length, uses specific tool names/numbers]
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       Commit to GitHub  Generate         Generate
              │          Twitter Thread   Video Script
              ▼          (6-8 tweets)    (45-60 sec,
       Slack Notification      │         labeled sections)
                          Save Thread        │
                          to Notion     Save Script
                                        to Notion
```

**Schedule:** 8am Mon–Fri (`0 8 * * 1-5`). Dual trigger — Manual or Schedule, both feed the same Set node.

### Credentials to configure in n8n

| Credential name (exact) | Type | Header name | Header value |
|---|---|---|---|
| `Anthropic API Key` | Header Auth | `x-api-key` | `sk-ant-...` |
| `GitHub PAT` | Header Auth | `Authorization` | `token ghp_...` |
| `Notion Integration Token` | Header Auth | `Authorization` | `Bearer ntn_...` |

Slack: no credential — paste webhook URL directly into `slackWebhookUrl` in the Set node.

### Set Topic & Config values to fill in

| Field | Description |
|---|---|
| `blogTopic` | Post topic — swap per run, or drive from a Notion content calendar |
| `githubOwner` | `homegrowngrowthco` |
| `githubRepo` | `theautomationsguide` |
| `githubBranch` | `master` |
| `notionDatabaseId` | 32-char ID from the Notion DB URL |
| `slackWebhookUrl` | Full Incoming Webhook URL from Slack app settings |

### Notion database schema (must match exactly)

| Property | Type | Notes |
|---|---|---|
| `Name` | Title | Set automatically |
| `Status` | Select | Options: `Draft – Needs Review`, `Script – Needs Review` |
| `Blog Post URL` | URL | GitHub blob URL (pre-deploy) |
| `Pub Date` | Date | ISO date of generation |

### Astro frontmatter Claude generates

```yaml
---
title: "Post title"
description: "Brief description"
pubDate: 2026-04-22
tags: ["tag1", "tag2"]
---
```

Files committed to `src/content/blog/YYYY-MM-DD-{slug}.md`.

### Known gotchas

- **Notion 2000-char cap:** Content truncated with `.substring(0, 1999)`. If you extend thread to 10+ tweets, split into two `children` entries.
- **GitHub API node references `$('Parse Blog Response').first().json`** for filename/owner/repo — not `$json` — because at that node `$json` is the Humanize response.
- **`blogTopic` is hardcoded** in Set node. For true daily automation, drive it from a Notion content calendar query instead.
- **No duplicate check:** Same topic run twice → same filename → second run overwrites first. Add IF node to check GitHub if idempotency matters.
- **Netlify deploy is automatic** — Slack notification links to the GitHub blob URL, not the live post URL.

### Potential future additions

- Drive `blogTopic` from Notion content calendar (HTTP Request → filter unpublished → pick next)
- PR flow instead of direct-to-`master` commit (create branch → commit → open PR for review)
- Error branch via n8n Error Trigger or IF node on status codes
- Parameterize model name in Set node
- LinkedIn post as a fourth branch from Humanize Blog Post

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

## 4. Open Placeholders (all three projects)

All of these need real values before live promotion:

| Placeholder | Where | What to put |
|---|---|---|
| `BEEHIIV_EMBED_URL_PLACEHOLDER` | `src/components/EmailSignup.astro` | Beehiiv embed URL |
| `AFFILIATE_LINK_PLACEHOLDER` | `src/pages/index.astro`, `src/pages/tools.astro` | Real affiliate URLs for Make, Clay, HubSpot, n8n, Apollo, Zapier, Gong, Chorus |
| `[COMPANY_LOGOS_PLACEHOLDER]` | `src/pages/index.astro` hero | Real company names/logos |
| `ian@theautomationsguide.com` | `src/pages/about.astro` | Set up this email (Google Workspace or Fastmail) |
| `githubOwner` / `githubRepo` / `notionDatabaseId` / `slackWebhookUrl` | n8n Set Topic & Config node | See Section 2 above |
| `sameAs: []` | `src/layouts/BaseLayout.astro` | LinkedIn company page URL + Twitter/X URL |

---

## 5. Master Next Steps

### Immediate — do this week

- [ ] **Google Search Console** — submit `https://theautomationsguide.com/sitemap-index.xml` under Sitemaps; run URL Inspection → Request Indexing on homepage
- [ ] **Bing Webmaster Tools** — set up, then use "Import from GSC" once GSC is live
- [ ] **Import n8n workflow** — `blog-post-generator-workflow.json` → Workflows → Import from file
- [ ] **Configure n8n credentials** — Anthropic API Key, GitHub PAT, Notion Integration Token
- [ ] **Fill n8n Set node** — `githubOwner`, `githubRepo`, `notionDatabaseId`, `slackWebhookUrl`
- [ ] **Test n8n workflow** — run once on a throwaway topic before enabling the daily schedule
- [ ] **Connect domain** — `theautomationsguide.com` in Netlify → Site settings → Domain management (if not already done)

### Soon

- [ ] **Apple touch icon** — add 180×180px PNG at `public/apple-touch-icon.png`, then uncomment the link in `BaseLayout.astro`
- [ ] **Social profiles** — create LinkedIn Company Page + Twitter/X account; add URLs to `sameAs: []` in `BaseLayout.astro`
- [ ] **Analytics** — install Plausible (preferred: no cookie banners, privacy-first) or GA4
- [ ] **Beehiiv newsletter** — swap `BEEHIIV_EMBED_URL_PLACEHOLDER` in `EmailSignup.astro`; update CSP in `_headers`
- [ ] **Affiliate links** — replace all `AFFILIATE_LINK_PLACEHOLDER` values in `index.astro` + `tools.astro`
- [ ] **Email** — set up `ian@theautomationsguide.com` (Google Workspace or Fastmail)
- [ ] **OG images** — add social share images (`ogImage` prop already wired into `BaseLayout.astro`)
- [ ] **Notion filters** — set default week filters on each phase database
- [ ] **GEO baseline** — search "best RevOps automation blogs" and "Zapier vs Make comparison" in ChatGPT, Perplexity, Claude, Gemini; log whether the site appears (see `OFF_SITE_SEO_CHECKLIST.md`)

### Content — ongoing

- [ ] **Add `faqs:` arrays** to existing posts to unlock FAQPage JSON-LD (see Section 1 for format)
- [ ] **Add `.quick-answer` TL;DR blocks** to existing posts for LLM extraction
- [ ] Write more posts — cadence matters more than perfection at this stage

### Later / optional

- [ ] Drive `blogTopic` from Notion content calendar (Phase 1, Day ~15 task)
- [ ] Replace direct-to-`master` n8n commit with a PR review flow
- [ ] Add LinkedIn post as fourth n8n output branch
- [ ] Add error handling branch in n8n for Claude/GitHub failures
- [ ] Register domain for resale at Sedo/Afternic/Dan.com once site has 90+ days of traffic

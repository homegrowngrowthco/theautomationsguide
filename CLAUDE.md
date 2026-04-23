# The Automations Guide — Project Log

## What we built

A complete Astro static site for **theautomationsguide.com**, an independent content/affiliate publication covering automation tools and workflows for RevOps and GTM teams. Deployed to Netlify via GitHub.

### Site structure

```
theautomationsguide/
├── astro.config.mjs           # Astro config with sitemap integration
├── netlify.toml               # Netlify build config (command: npm run build, publish: dist)
├── package.json               # Dependencies: astro ^4.16.0, @astrojs/sitemap
├── src/
│   ├── components/
│   │   ├── AuthorNote.astro   # E-E-A-T author credibility callout (shown on every post)
│   │   └── EmailSignup.astro  # Beehiiv newsletter embed (disabled until URL is swapped in)
│   ├── content/
│   │   ├── config.ts          # Content collection schema (title, description, pubDate, tags, draft)
│   │   └── blog/              # Markdown blog posts
│   ├── layouts/
│   │   ├── BaseLayout.astro   # Nav, footer, <head>, affiliate disclaimer
│   │   └── BlogPostLayout.astro # Post template with read time, tags, EmailSignup, AuthorNote
│   ├── pages/
│   │   ├── index.astro        # Homepage: hero, features, recent posts, tool cards, email CTA
│   │   ├── about.astro        # About Ian — personal, first-person, E-E-A-T focused
│   │   ├── tools.astro        # Tools/affiliate directory page
│   │   └── blog/
│   │       ├── index.astro    # Blog listing with tag cloud
│   │       └── [slug].astro   # Dynamic post route
│   └── styles/
│       └── global.css         # All styles — dark theme, design tokens, components
```

### Sample blog posts (3 + 1 added by Ian)

| File | Topic |
|------|-------|
| `revops-tech-stack-2025.md` | RevOps automation stack overview |
| `zapier-vs-make-for-gtm-teams.md` | Zapier vs Make comparison |
| `automate-sales-handoff-hubspot-slack.md` | Sales-to-CS handoff playbook |
| `revops-automation-stack-2026.md` | Added by Ian after initial scaffold |

---

## Key decisions made

- **Framework:** Astro 4.x with static output — no JS framework, fast by default, great for SEO
- **Hosting:** Netlify (auto-deploys on push to `master`)
- **Repo:** GitHub at `github.com/homegrowngrowthco/theautomationsguide`
- **Branch:** `master` (not `main`)
- **Design:** Custom dark-mode CSS (no Tailwind, no UI framework) — design tokens in `global.css`, teal (`#2dd4bf`) accent
- **CMS:** Astro content collections — posts are Markdown files in `src/content/blog/`
- **Newsletter:** Beehiiv embed in `EmailSignup.astro` — currently shows a placeholder until the embed URL is swapped in
- **Sitemap:** `@astrojs/sitemap` integration added to `astro.config.mjs`
- **Affiliate strategy:** Disclosure in footer on every page, inline disclosure on Tools page, affiliate links use `AFFILIATE_LINK_PLACEHOLDER` until real links are added
- **E-E-A-T:** `AuthorNote` component on every post signals first-hand experience to Google; About page written in Ian's voice as a RevOps practitioner

---

## Problems we ran into

| Problem | Resolution |
|---------|------------|
| `gh` CLI not on PATH after winget install | Used full path `/c/Program Files/GitHub CLI/gh.exe` |
| `gh auth login` not completing via `!` prefix in Claude Code | Ian ran `& "C:\Program Files\GitHub CLI\gh.exe" auth login` in a separate PowerShell window |
| PowerShell rejecting path with spaces without `&` | Needed `& "C:\..."` syntax in PowerShell |
| Git identity not configured | Set `user.email` to `ian@homegrowngrowth.co` and `user.name` to `Ian` globally |

---

## Placeholders still needing real values

- `BEEHIIV_EMBED_URL_PLACEHOLDER` in `src/components/EmailSignup.astro` — swap in your Beehiiv embed URL to activate the newsletter form
- `AFFILIATE_LINK_PLACEHOLDER` in `src/pages/index.astro` (tool cards) and `src/pages/tools.astro` — replace with real affiliate URLs for Make, Clay, HubSpot, n8n, etc.
- `[COMPANY_LOGOS_PLACEHOLDER]` in `src/pages/index.astro` hero social proof line — remove or replace once you have logos to show
- `ian@theautomationsguide.com` in `src/pages/about.astro` — set up this email if you haven't already

---

## How to add a new blog post

Create a file in `src/content/blog/your-slug.md`:

```markdown
---
title: "Your Post Title"
description: "One-sentence summary for SEO and cards."
pubDate: 2026-05-01
tags: ["HubSpot", "Workflow"]
---

Content here in Markdown.
```

Commit and push — Netlify auto-deploys in ~30 seconds.

---

## Session 1 — 2026-04-22

### What we built

Full site scaffold from scratch in a single conversation. Ian had no existing Astro project.

**Site scaffolded by Claude:**
- `src/content/config.ts` — content collection schema
- `src/layouts/BaseLayout.astro` — nav, footer, affiliate disclaimer, `<head>` meta/OG tags
- `src/layouts/BlogPostLayout.astro` — post template with metadata, tags, back link
- `src/pages/index.astro` — homepage with hero, features grid, recent posts, CTA strip
- `src/pages/blog/index.astro` — blog listing with tag cloud
- `src/pages/blog/[slug].astro` — dynamic post route via `getStaticPaths`
- `src/pages/about.astro` — about page (later rewritten by Ian in Session 2)
- `src/styles/global.css` — full dark-mode CSS design system with tokens
- `netlify.toml` — build config (command: `npm run build`, publish: `dist`)
- `.gitignore` — standard Astro ignores
- 3 sample blog posts — RevOps tech stack, Zapier vs Make, HubSpot/Slack handoff playbook
- `public/favicon.svg` — inline SVG favicon

**Tooling setup:**
- `npm install` run successfully (329 packages, astro ^4.16.0)
- Git initialized, `user.email` set to `ian@homegrowngrowth.co`, `user.name` set to `Ian`
- GitHub CLI (`gh`) installed via `winget install GitHub.cli`
- Auth completed via `& "C:\Program Files\GitHub CLI\gh.exe" auth login` in PowerShell
- Repo created and pushed: `gh repo create theautomationsguide --public --source=. --remote=origin --push`
- Netlify deployment completed by Ian manually via Netlify UI

### Problems we ran into (Session 1)

| Problem | Resolution |
|---------|------------|
| `gh` not on bash PATH after winget install | Used full path `/c/Program Files/GitHub CLI/gh.exe` |
| `! gh auth login` didn't complete auth flow interactively | Ian ran `& "C:\Program Files\GitHub CLI\gh.exe" auth login` in a separate PowerShell window |
| PowerShell rejecting executable path with spaces | Needed `& "C:\..."` syntax — bare path fails without the call operator |
| Git commit failed — identity not configured | Set `user.email` and `user.name` globally before committing |
| winget install appeared to hang | Command completed successfully in background; gh.exe was at `C:\Program Files\GitHub CLI\` |

### Decisions made (Session 1)

- Astro 4.x chosen over 5.x for content collections stability
- Custom CSS over Tailwind — fewer setup steps, easier for Ian to edit without framework knowledge
- Dark mode as default — no light/dark toggle, keeps CSS simpler
- Content collections over a headless CMS — no external dependency, posts are just Markdown files
- Public GitHub repo under `homegrowngrowthco` account
- `master` branch (not `main`) — git default, not changed

---

## Next steps

- [ ] Swap in Beehiiv embed URL to activate newsletter signup
- [ ] Replace `AFFILIATE_LINK_PLACEHOLDER` values with real affiliate links
- [ ] Connect `theautomationsguide.com` domain in Netlify → Site settings → Domain management
- [ ] Set up `ian@theautomationsguide.com` email (Google Workspace or Fastmail)
- [ ] Add analytics (Plausible or Fathom recommended for privacy-first)
- [ ] Add OG/social share images — `ogImage` prop is already wired into `BaseLayout.astro`
- [ ] Write more posts — publish cadence matters more than perfection at launch

---

## Session 2 — 2026-04-22

### What we built

This session had two workstreams: a large site launch pass (adding missing pages, SEO, email capture, new content) and a humanization/E-E-A-T pass (author voice, AI fingerprint removal, n8n workflow improvements).

#### Round 1 — Launch pass

**Fixed post dates** — all three existing blog posts had `pubDate: 2025-*` which was incorrect. Updated to April 2026, March 2026, and April 2026 respectively.

**`src/components/EmailSignup.astro`** — reusable Beehiiv embed component. When `BEEHIIV_EMBED_URL_PLACEHOLDER` is the configured URL, it renders a visually complete but disabled placeholder form so the page looks finished immediately. Swap in the real Beehiiv embed URL to activate.

**Homepage overhaul** (`src/pages/index.astro`):
- "Browse Tools" CTA added alongside existing "Read the Blog"
- Featured Tools section added (Make, Clay, HubSpot, n8n) with affiliate link placeholders and free-tier badges
- EmailSignup component embedded above the CTA strip
- The existing "Latest Posts" section was already pulling from the content collection dynamically — no changes needed

**`src/layouts/BlogPostLayout.astro`** updates:
- Read time calculated from `post.body` word count ÷ 200 wpm
- "Filed under:" related tags row added after prose content
- EmailSignup component embedded above "Back to Blog" link

**`src/pages/tools.astro`** — new affiliate hub page with three category sections: Workflow Automation (Make, n8n, Zapier), CRM & Enrichment (HubSpot, Clay, Apollo), Revenue Intelligence (Gong, Chorus). Each card has a 2-sentence description, free-tier badge where applicable, and `AFFILIATE_LINK_PLACEHOLDER` CTA.

**Navigation** — "Tools" added to main nav and footer nav in `BaseLayout.astro`.

**SEO / technical**:
- `@astrojs/sitemap@3.1.6` installed and wired into `astro.config.mjs` — generates `sitemap-index.xml` at build time
- `public/robots.txt` created pointing crawlers at the sitemap
- `src/styles/global.css` — added styles for `.email-signup`, `.tool-card`, `.tool-grid`, `.tool-badge`, `.affiliate-notice`, `.tools-hero`, `.tools-category-*`, `.post-related-tags`

**New blog post** — `revops-automation-stack-2026.md` (~1,050 words). Targets keyword "revops automation stack 2026". Covers the four-layer model (System of Record → Enrichment → Middleware → Activation), the enrichment shift, a middleware comparison table, the three highest-ROI workflows to build first, and a recommended stack table.

#### Round 2 — Author voice & humanization pass

**`src/components/AuthorNote.astro`** — subtle callout that appears on every blog post just below the title/meta and above the prose. Left-border accent style. Signals human authorship and E-E-A-T without dominating the layout.

**`src/layouts/BlogPostLayout.astro`** — `AuthorNote` added between post header and prose body.

**`src/pages/about.astro`** — fully rewritten in first person as Ian Chamberland. Specific about RevOps background, real-world workflow experience, and personal tool evaluation. Four sections: Why this site exists, What I cover, How I work, Affiliate Disclosure. No generic marketing language anywhere.

**Homepage social proof** — one line added under the hero subtitle: `Read by RevOps and GTM teams at [COMPANY_LOGOS_PLACEHOLDER]`. Replace the placeholder when logo/company names are available.

**`src/content/blog/revops-tech-stack-2025.md`** — added `updatedDate: 2026-04-22` to frontmatter. The layout already renders "Updated [date]" in post metadata when this field is present, which signals freshness to Google.

**`src/styles/global.css`** — added `.author-note` callout styles and `.hero-social-proof` styles.

#### n8n workflow changes (`blog-post-generator-workflow.json`)

The workflow version was bumped from `"1"` to `"2"`. Three changes:

**Bug fix — `Save Thread to Notion`:** The body expression referenced `$json.content[0].text` but at that point in the flow `$json` is the Claude API response from `Generate Twitter Thread`, which in some n8n execution contexts is ambiguous. Fixed to the explicit `$('Generate Twitter Thread').first().json.content[0].text`.

**New node — `Humanize Blog Post`:** HTTP Request node inserted between `Parse Blog Response` and all downstream branches. Makes a second `claude-sonnet-4-5` call with a system prompt that: strips AI fingerprint words (delve, crucial, game-changer, streamline, leverage-as-verb, robust, utilize, it's worth noting, in conclusion, in today's landscape, cutting-edge, seamlessly), varies sentence length, adds one opinionated claim per section, replaces generic examples with specific tool names and numbers, and outputs only the rewritten markdown. Uses a backtick template literal for the system prompt to handle apostrophes cleanly.

**`Commit to GitHub` update:** Previously used `$json.encodedContent` (pre-encoded by the Parse code node). Now uses `Buffer.from($json.content[0].text).toString('base64')` inline, encoding the humanized text. All metadata references (`title`, `filename`, `githubBranch`, `githubOwner`, `githubRepo`) updated to `$('Parse Blog Response').first().json.*` since `$json` is now the Humanize response.

**`Generate Twitter Thread` update:** Content reference changed from `$('Parse Blog Response').first().json.markdownContent` to `$json.content[0].text` — the thread is now generated from the humanized post, not the raw draft.

**New node — `Generate Video Script`:** Third parallel branch from `Humanize Blog Post`. Claude call producing a 45-60 second short-form video script with `[HOOK]`, `[POINT 1]`, `[POINT 2]`, `[POINT 3]`, `[CTA]` labels. Tone: direct, practitioner, no hype. Input is the humanized blog content.

**New node — `Save Script to Notion`:** Saves the video script to the same Notion database with `Status: "Script – Needs Review"` and title `"Video Script: [post title]"`.

**Updated connection graph:**
```
Manual Trigger ─┐
                ├──▶ Set Topic & Config ──▶ Generate Blog Post ──▶ Parse Blog Response ──▶ Humanize Blog Post ──┬──▶ Commit to GitHub ──▶ Slack Notification
Daily Schedule ─┘                                                                                               ├──▶ Generate Twitter Thread ──▶ Save Thread to Notion
                                                                                                                └──▶ Generate Video Script ──▶ Save Script to Notion
```

---

### Problems we ran into (Session 2)

| Problem | Resolution |
|---------|------------|
| `@astrojs/sitemap@3.7.2` crashed with `Cannot read properties of undefined (reading 'reduce')` | Downgraded to `@astrojs/sitemap@3.1.6` which is compatible with `astro@4.16.x` |
| n8n body expressions with apostrophes in single-quoted strings | Used ES6 backtick template literals for static system prompt text — backticks need no apostrophe escaping and JSON doesn't require them to be escaped either |
| `Commit to GitHub` body needed base64 encoding of humanized content | Used `Buffer.from($json.content[0].text).toString('base64')` inline in the expression — `Buffer` is available in n8n HTTP Request expressions since n8n runs on Node.js |

---

### Placeholders added this session (in addition to existing ones)

- `[COMPANY_LOGOS_PLACEHOLDER]` in hero social proof — `src/pages/index.astro`
- `ian@theautomationsguide.com` contact email — `src/pages/about.astro`

---

### Next steps (updated)

- [ ] Swap in Beehiiv embed URL to activate newsletter signup (`src/components/EmailSignup.astro`)
- [ ] Replace all `AFFILIATE_LINK_PLACEHOLDER` values with real affiliate links (Make, Clay, HubSpot, n8n, Apollo, Zapier, Gong, Chorus)
- [ ] Replace `[COMPANY_LOGOS_PLACEHOLDER]` in homepage hero with real company names/logos
- [ ] Connect `theautomationsguide.com` domain in Netlify → Site settings → Domain management
- [ ] Set up `ian@theautomationsguide.com` email (Google Workspace or Fastmail)
- [ ] Add analytics (Plausible or Fathom recommended — privacy-first, no cookie banners)
- [ ] Add OG/social share images — `ogImage` prop is already wired into `BaseLayout.astro`
- [ ] Import updated `blog-post-generator-workflow.json` into n8n (Workflows → Import from file)
- [ ] Configure n8n credentials: Anthropic API Key, GitHub PAT, Notion Integration Token
- [ ] Set real values in `Set Topic & Config` node: `githubOwner`, `githubRepo`, `notionDatabaseId`, `slackWebhookUrl`
- [ ] Test the full n8n workflow end-to-end on a throwaway topic before enabling the daily schedule
- [ ] Decide on publishing cadence — the workflow is set to 8am weekdays; tune or disable as needed

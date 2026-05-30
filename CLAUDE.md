# Session Log — last updated 2026-05-29

## Quick reference — recent additions (Session 14, 2026-05-29)

Design refresh session — applied a Claude Design "Brand Kit v2.2" to the site. Source kit shipped as `The Automations Guide Website.zip` (left untracked in the repo root — not committed). Work is on branch **`design-refresh-brand-kit-v2`** (off `origin/master` `a61ea6c`), to ship as a PR so Netlify builds a deploy preview.

**What the kit changes (more than a recolor):** teal shifts `#2dd4bf` → `#1ec3a4` (dark-mode accent) / `#14a890` (core brand); headlines (H1/H2, hero, page headers, pull-quotes) move to the serif **Source Serif 4** (600); body/UI → **Inter**; eyebrows/tags/labels/code → **JetBrains Mono**; wordmark → **Outfit**. Site stays dark-only (the kit's light-mode block is for newsletters and was intentionally not added).

**Token strategy — revalue + augment, NOT rename (load-bearing).** The kit's token names (`--accent-strong`, `--r-md`, `--font-sans`, `--ink-*`, `--tag-teal-*`) don't match the site's existing names (`--accent-dim`, `--accent-glow`, `--radius`, `--font`). The kit README's "paste `:root`, delete old block" would have broken ~every rule. Instead, in [src/styles/global.css](src/styles/global.css): pasted the kit's foundation scales (`--tag-teal-*`, `--ink-*`, semantic accents, `--font-sans/serif/display`) at the top of `:root`, then re-pointed every existing site-token alias at the foundation. Key remaps: `--accent`→`var(--tag-teal-400)`, `--accent-dim`→`var(--tag-teal-600)`, `--accent-glow`→`rgba(30,195,164,.10)`, new `--accent-hover`→`var(--tag-teal-300)` (replaces the old hardcoded `#5eead4` in `.btn--primary:hover` + `.prose a:hover`), `--font`→`var(--font-sans)`, `--font-mono`→JetBrains Mono. `--bg/--text/--border/...` unchanged (kit dark values are identical).

**Typography applied** via a "Brand typography" block appended late in global.css (wins on source order over the earlier per-section `font-weight:800` rules): serif on `.hero h1, .prose h1, .prose h2, .post-header h1, .about-hero h1, .page-header h1, .tools-hero h1, .section-heading, .pull-quote-body` (H3/H4 stay Inter); JetBrains Mono on `.hero-eyebrow, .tag, .section-label, .email-signup-eyebrow, .my-take-eyebrow, .step-card-number, .stat-card-label, .tool-badge, .post-related-tags-label, .footer-col-label`.

**Fonts loaded** in [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) `<head>` (site previously had zero web fonts): preconnect + one Google Fonts `css2` link (Inter 400-700, Source Serif 4 600, JetBrains Mono 400-700, Outfit 500/800, `display=swap`). **CSP in [public/_headers](public/_headers)** extended: `style-src` += `https://fonts.googleapis.com`, `font-src` += `https://fonts.gstatic.com` (otherwise the fonts would be blocked).

**Wordmark** restyled (not swapped to `<img>` — the kit's logo SVGs are `<text font-family="Outfit">`, which doesn't embed fonts and falls back to system sans as an image). `.nav-logo` now uses `var(--font-display)` (Outfit); "The"/"Guide" quiet (weight 500, muted), "Automations" dominant (weight 800). Kept "Automations" **teal** rather than the kit's white-word + teal-period lockup — flagged to Ian as a follow-up choice if he wants exact kit fidelity. Both nav + footer reuse `.nav-logo`, so the change flows to both.

**Favicon** [public/favicon.svg](public/favicon.svg): recolored its four teal fills `#2dd4bf`→`#1ec3a4`, kept the legible abstract orbital mark (the kit's wordmark favicon is illegible at 16px — Ian's choice). The `[tool].astro` redirect page (self-contained doc, no global.css) hardcoded teal updated to literal `#1ec3a4`. `ComparisonTable.astro` pros-marker `#2dd4bf`→`var(--accent)`.

**New committed assets:** `public/brand/` (kit logo + avatar SVGs, already on new teal — for future og-image/social/external use); `brand-kit/` (full kit as source-of-truth: tokens.css, design-system.html, logos, avatars, Beehiiv + newsletter HTML, social graphics); [NEWSLETTER.md](NEWSLETTER.md) (points at the staged Beehiiv templates + frames the **manual Beehiiv import as an action for Ian** — templates can't be created from the repo).

**Verification:** `npm run build` clean (32 pages, Pagefind indexed 32). Confirmed in `dist/`: font `css2` link present on homepage, new teal in compiled CSS, zero stale `#2dd4bf` in compiled CSS. Playwright screenshots (home / blog / tools / about / post at mobile 375 + desktop 1280) eyeballed: serif headlines, mono teal eyebrows/tags/badges, Outfit wordmark, new teal, responsive layouts all correct.

**Action required of Ian:** (1) Open the PR's Netlify deploy preview and review desktop + mobile. (2) After merge, fill the merge SHA into the DEPLOYMENT.md row. (3) Manually import the two Beehiiv templates per [NEWSLETTER.md](NEWSLETTER.md) (Beehiiv UI, ~10 min). (4) Optional decisions: switch the wordmark to the kit's white-Automations + teal-period lockup; regenerate `apple-touch-icon.png`; align `.my-take` amber to the kit's `--accent-amber`.

**Revert path:** all changes are CSS/asset/docs only (no content, schema, data, or workflow changes) — fully safe to revert. After merge: `git revert -m 1 <merge-sha>`.

### Same-session follow-up — light-mode pivot, exact wordmark, tool hub pages, mobile polish (still on `design-refresh-brand-kit-v2`, pre-merge)

After reviewing the dark refresh, Ian asked for four changes (same PR branch, second commit):

1. **Flipped the whole site to the kit's LIGHT mode (warm cream).** This SUPERSEDES the "site stays dark-only" note above. In [src/styles/global.css](src/styles/global.css) the `:root` aliases now hold the kit light palette: `--bg #fdfcf8`, `--bg-secondary #f6f4ec`, `--bg-card #ffffff`, `--border #e5e1d4`, `--text #262b32`, `--text-muted #5e6671`, `--accent var(--tag-teal-500)` (#14a890), `--accent-dim` teal-600, `--accent-hover` teal-700 (darker on hover for light bg), `--accent-glow var(--tag-teal-50)`, new `--accent-contrast #ffffff` (text on teal buttons), `--nav-bg rgba(253,252,248,.85)`, and light `--shadow-sm/md/lg`. Hardcoded dark values fixed: `.site-nav` bg → `--nav-bg`; `.btn--primary` text → `--accent-contrast`; `.post-card`/`.tool-card`/mobile-drawer shadows → `--shadow-lg`; `theme-color` meta → `#fdfcf8`; `go/[tool].astro` redirect page → cream/ink/teal-500. NOT a toggle — light is the only mode now. (SVG diagram colors in old `.mdx` posts were tuned for dark bg and may have weak contrast on cream — left as a content follow-up, not touched.)
2. **Wordmark now exact kit match.** `.nav-logo` markup changed to `The <span class="logo-word">Automations<span class="logo-dot">.</span></span> Guide` (nav + footer). `.logo-word` = `--text` ink 800, `.logo-dot` = `--accent-dim` teal-600 (kit's light-mode period color). "Automations" is no longer teal; it's ink with a teal period, matching `wordmark-primary.svg`.
3. **Rich tool hub pages.** New [src/data/tools.ts](src/data/tools.ts) (tool registry: slug/name/category/badge/blurb/cta/aliases + `postMentionsTool()` matcher — tags + title + body, case-insensitive for distinctive names, case-sensitive ≥2 hits for ambiguous ones like Make/Clay to avoid false positives). New [src/pages/tools/[tool].astro](src/pages/tools/[tool].astro) generates `/tools/<slug>` for all 8 tools: category eyebrow + serif H1 + blurb + `/go/<slug>` CTA + badge + "N articles mentioning X" card grid. [src/pages/tools.astro](src/pages/tools.astro) refactored to render from `tools.ts` (no more hardcoded cards); each tool name links to its hub, plus a "N articles →" link. Article counts at build: make 12, n8n 14, hubspot 19, pipedrive 6, clay 12, apollo 15, smartlead 9, beehiiv 1 (of 23 posts — sensible spread, hubspot-as-central-CRM checks out). These `/tools/*` pages are indexable (sitemap filter only drops `/go/*` + utility paths). Cleaned em dashes from the carried-over blurbs per the no-em-dash rule.
4. **Mobile polish.** Extended the `@media (max-width:640px)` block: reduced padding on `.tools-hero`/`.about-hero`/`.page-header`/`.post-header`/`.hero`/`.section` (desktop heroes left large empty gaps on phones); left-aligned `.hero p`/`.tools-hero p` (long centered intro copy read ragged on a narrow column); eased `.hero h1` clamp. No horizontal overflow on any page before or after.

**Verification (second commit):** `npm run build` clean (51 pages incl. 8 new tool hubs). Playwright screenshots at desktop 1280 + mobile 390 across home / tools / a tool hub / a post / about — light cream theme, exact wordmark, hub pages, and tightened mobile all confirmed correct.

**Still TODO for Ian (unchanged + new):** the original list above, plus note the site is now LIGHT not dark. Known content follow-up: recolor the in-post SVG diagrams for the light background (they were drawn for dark). The homepage hero + some old posts still contain em dashes in body copy (pre-existing content, not touched in this design pass).

---

## Quick reference — recent additions (Session 13, 2026-05-22)

One-shot session triaging a GSC indexing question — Ian saw 6 pages indexed and 16 not indexed and asked whether something was wrong. Diagnosis: the deployed sitemap at [sitemap-0.xml](https://theautomationsguide.com/sitemap-0.xml) had **39 URLs**, but **15 of them were pages explicitly marked `noindex`** (4 utility pages — `/privacy/`, `/terms/`, `/disclosure/`, `/search/` — plus the 11 `/go/<tool>/` affiliate redirects). Sitemap inclusion + page-level noindex is a self-contradicting signal — GSC buckets these as "Excluded by 'noindex' tag" in the "Why pages aren't indexed" view, inflating the "not indexed" count without any actual quality/crawl issue.

**Fix shape (commit `e09acdc`, direct to master).** Two coordinated edits in one commit:

1. **[astro.config.mjs](astro.config.mjs)** — added a `sitemap({ filter })` predicate that drops `/go/*` and the four utility paths. Sitemap now ships **24 URLs** (homepage, `/about/`, `/blog/`, `/tools/`, 20 posts) — exactly what should be indexable.
2. **[src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)** — added a `noindex?: boolean` prop. When true, emits a single `<meta name="robots" content="noindex, follow">`; otherwise emits the full `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` directive. Previously, the four utility pages were stacking two conflicting `<meta name="robots">` tags (BaseLayout said `index, follow`, the page slot added a second `noindex, follow`). Functionally OK (Google takes most restrictive) but sloppy. [privacy.astro](src/pages/privacy.astro), [terms.astro](src/pages/terms.astro), [disclosure.astro](src/pages/disclosure.astro), [search.astro](src/pages/search.astro) now pass `noindex={true}` instead of injecting via `<Fragment slot="head">`.

[404.astro](src/pages/404.astro) was left untouched — uses `noindex, nofollow` (different directive set) and isn't in the sitemap anyway, so the cleanup doesn't affect it.

**Local verification.** `npm run build` succeeded — 34 pages built, Pagefind indexed 29, generated `dist/sitemap-0.xml` confirmed at 24 URLs (all 15 previously-listed noindex URLs absent). Spot-checked `dist/privacy/index.html` for exactly one robots meta (✓ `noindex, follow`), and `dist/index.html` + `dist/about/index.html` + `dist/blog/index.html` for the full index directive (✓).

**`/go/<tool>` pages don't use BaseLayout** — they have their own minimal HTML doc (meta refresh + PostHog `affiliate_click` capture). The sitemap filter handles them; no template change needed there.

**Pre-push check.** `git fetch origin && git log --oneline HEAD..origin/master` confirmed no engine auto-merges landed mid-session (3 new content branches discovered — `2026-05-21-kit-vs-substack-vs-beehiiv`, `2026-05-21-migrate-substack-to-kit`, `2026-05-22-best-mailchimp-alternatives` — none merged yet, so no rebase needed before the push).

**Action required of Ian after this session:**

1. **Wait ~90s for Netlify to deploy `e09acdc`.** No site behavior changes; the sitemap will reflect the new URL set on next Google crawl.
2. **In GSC → Pages → "Why pages aren't indexed":** confirm the bucket reasons. If you see "Excluded by 'noindex' tag" with ~15 URLs, that's the population this fix addresses — click **Validate Fix** to ask Google to reprocess. If you also see "Crawled - currently not indexed" on real blog posts, that's a different (content-quality / new-domain-trust) problem and is not solved here.
3. **Re-submit the sitemap in GSC** (Sitemaps → enter `sitemap-index.xml`) to nudge Google to pick up the trimmed set faster. Optional — it's already pinged via [public/robots.txt:32](public/robots.txt#L32).
4. **Expect the "Not indexed" count to drop within 1-2 weeks** as Google reprocesses. Indexed count should stay flat or grow as the real blog posts get crawled.

**Revert paths** (also captured in DEPLOYMENT.md):
- Both edits unwanted: `git revert e09acdc` — restores the 39-URL sitemap and the double robots meta tag pattern.
- Both edits are non-destructive (no content/data changes, no schema changes) and safe to revert at any time.

### Same-session follow-up — IndexNow + Google Indexing API submit (commit `805cb28`)

After deploying the sitemap fix, Ian asked what process exists for telling search engines about new posts. None did — the post-merge n8n workflow only updated Notion + pinged Slack. So `notion-publish-status.json` got extended to also hit two search-engine indexing APIs:

**IndexNow (Bing / Yandex / DuckDuckGo / Naver / Seznam) — live + working.** Random 32-char hex key `dde35cca97309131104c0505957f0948` committed to [public/dde35cca97309131104c0505957f0948.txt](public/dde35cca97309131104c0505957f0948.txt) (Astro auto-copies to `dist/` root → served at `https://theautomationsguide.com/dde35cca97309131104c0505957f0948.txt`). Key is public-by-design per IndexNow protocol — the file is the ownership proof, not a secret. New "IndexNow Submit" HTTP node POSTs `{host, key, keyLocation, urlList: [postUrl]}` to `api.indexnow.org/indexnow` after Slack Notify.

**Google Indexing API — wired but opt-in.** Added 4 nodes after IndexNow: "Google Indexing Enabled?" code gate (short-circuits with `return []` if `googleServiceAccountJson` is empty in the Config node — current default), "Build Google JWT" code node (signs RS256 JWT with Node's built-in `crypto` module — no external dependencies), "Get Google Access Token" HTTP POST to `oauth2.googleapis.com/token` with the JWT, "Google Indexing Submit" HTTP POST to `indexing.googleapis.com/v3/urlNotifications:publish` with `{url: postUrl, type: 'URL_UPDATED'}`. Both HTTP calls use `neverError:true` so a 4xx/5xx can't fail the workflow (Notion + Slack steps already happened). Officially the API is gated to JobPosting + BroadcastEvent schemas but accepts blog URLs in practice — quotas are ~200 calls/day per project, well above the engine's ~1/day output rate. Setup steps (GCP project + Indexing API enable + service account + JSON key + GSC Owner grant + paste JSON into Config node) documented in [n8n/README.md](n8n/README.md) Workflow 5 section.

**Filter Eligible also got a slug-extraction extension.** Pulls `slug = headRef.replace(/^content\//, '')` and builds `postUrl = https://${siteHost}/blog/${slug}/`. Slack message now references `postUrl` instead of bare domain. Same slug feeds both indexing APIs.

**n8n re-import required.** Workflow JSON shipped as v2 (`versionId: "2"`); Ian needs to re-import `notion-publish-status.json` into n8n Cloud to pick up the 12 nodes (was 7). No new credentials needed for the IndexNow branch — IndexNow is auth-free. The Notion HTTP nodes still use the existing `Notion Integration Token` credential.

**Action required of Ian** (this paragraph is the consolidated post-deploy todo — completion status as of 2026-05-22 PM):
1. ✅ **Re-import [n8n/notion-publish-status.json](n8n/notion-publish-status.json)** into n8n Cloud — DONE 2026-05-22. The webhook URL stays the same; GitHub repo webhook does NOT need to be reconfigured.
2. ✅ **Wait for Netlify to publish `805cb28`** — DONE 2026-05-22. IndexNow key file curl'd at `https://theautomationsguide.com/dde35cca97309131104c0505957f0948.txt` returns the expected 32-char hex; sitemap re-checked at 25 URLs with zero noindex paths leaking.
3. ✅ **In GSC → Pages → "Why pages aren't indexed":** click "Validate Fix" — DONE 2026-05-22.
4. ✅ **Re-submit the sitemap in GSC:** `sitemap-index.xml` — DONE 2026-05-22.
5. ⏳ **For the 16 currently-stuck unindexed URLs:** in GSC → URL Inspection → "Request Indexing". **IN PROGRESS** — Ian splitting across days due to ~10/day GSC soft cap; will be done by 2026-05-23 Saturday.
6. ⏸️ **(Deferred 2026-05-22) Wire the Google Indexing API:** Ian chose to leave `googleServiceAccountJson` blank in the n8n Config node. Rationale: IndexNow alone covers Bing/Yandex/DuckDuckGo/Naver/Seznam; Google still reads the (now trimmed) sitemap and gets natural-crawl signal from there; manual GSC "Request Indexing" handles the rare case where a specific post needs faster Google indexing. The Indexing API is also technically off-label for blog posts (officially gated to JobPosting + BroadcastEvent schemas). Revisit if post velocity goes up or Google indexing latency becomes a measured bottleneck — re-enabling is a paste-JSON-into-Config-node operation, no code change needed.

**Revert paths** (also captured in DEPLOYMENT.md):
- IndexNow + Google Indexing API additions unwanted: `git revert 805cb28`, then re-import the pre-805cb28 workflow JSON from `git show 2a84738:n8n/notion-publish-status.json` into n8n Cloud.
- Just the Google Indexing branch unwanted: leave `googleServiceAccountJson` empty in n8n Config node — the gate node will continue to short-circuit it.
- Just the IndexNow ping unwanted: pause the *IndexNow Submit* node in n8n. The `dde35cca97309131104c0505957f0948.txt` file can stay or be deleted (no-op either way once n8n isn't pinging IndexNow).

---

# Session Log — last updated 2026-05-13

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

## Quick reference — recent additions (Session 12, 2026-05-20)

One-shot session to claim Kit's $25 partner promo for mentioning their new MCP server in an existing article. Picked [2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u.mdx](src/content/blog/2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u.mdx) as the host — most Kit-centric recent post, MCP framing flows naturally from "programmatic Kit access via n8n" into "programmatic Kit access via AI agents."

**Edit shape (commit `88033dc`, direct to master).** New `## One more thing: Kit just shipped an MCP server` section inserted between the closing MyTake and the "Ship these before you touch anything else" wrap-up. Three paragraphs: (1) frames MCP as letting Claude/Cursor agents read+write subscribers/tags/broadcasts/sequences/forms directly, collapsing ad-hoc investigation work out of n8n; (2) positions it as on-demand complement to n8n's scheduled/event-driven layer with a concrete example (using the MCP to validate Automation 3's 60-day churn threshold against real list data before committing the workflow logic); (3) bolded `[partners.kit.com/theautomationsguide](https://partners.kit.com/theautomationsguide)` CTA + 5-minute setup note (API key → config file → restart). Same edit cleaned 2 em dashes in the existing MyTake (pre-engine-v5 grandfathered AI slop, replaced with commas per [`feedback_no_em_dashes.md`](../.claude/memory/...)). Other grandfathered em dashes elsewhere in the post left alone to keep the diff minimal — engine v5's `sanitizeMdx()` covers this class going forward but doesn't backfill.

**Branded partner slug vs registry slug — deliberate divergence.** The new partner URL `partners.kit.com/theautomationsguide` is a branded slug PartnerStack issued separately from the original `partners.kit.com/nt9zrjmnck9y` ID that's wired into [src/data/affiliate-links.ts](src/data/affiliate-links.ts) `kit.url`. I left the registry on the old slug. The article uses the new branded slug as a direct URL (visibility for Kit's verification team), `/go/kit` still routes to the original slug for tracking continuity. If PartnerStack confirms both resolve to the same payout account, the swap is a one-line edit + commit; flagged as optional in STATUS.md.

**Push required a mid-session rebase.** First `git push origin master` rejected because the engine had auto-merged 3 content PRs while we were editing: PR #30 (Lemlist vs Apollo for B2B Outbound 2026, merge `d9f39e7`), PR #31 (Why RevOps Teams Are Abandoning Outreach in 2026, merge `8123322`), PR #32 (B2B Lead Enrichment Without Clay: The Lean Stack, merge `a3c4db0`). All three received `[qa-fix-1]` from the QA auto-fix bot and auto-merged green via the daily auto-merge GHA. `git pull --rebase origin master` was clean (single-content-file change didn't intersect any of the auto-merged content files) and re-push succeeded. Engine is operating normally on the v5 + Session 10 hotfix baseline across these 3 additional runs — neither Session 10 bug recurred. Matches the rebase pattern from Session 11 (mid-session `ccb0d8a` PR #29 merge). Sufficient signal at this point to add a CLAUDE.md note that engine auto-merges can land any time during a session and a pre-push `git fetch origin && git log --oneline HEAD..origin/master` is cheap insurance — captured in the `log-status` skill but worth restating here.

**DEPLOYMENT.md log entry (commit `fee7e07`, direct to master).** Added row at top of Part 5 Recent deployments reference: `\| 2026-05-20 \| direct \| 88033dc \| Add Kit MCP section to Kit + n8n post (Kit partner promo) \| git revert 88033dc \|`. Pure documentation, no site impact.

**Live URL submitted to Kit:** `https://theautomationsguide.com/blog/2026-05-11-kit-n8n-4-newsletter-automations-every-operator-should-set-u/`. MCP section is second-to-last block in the rendered article; partner link is bolded in the third paragraph of that section.

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- MCP section unwanted: `git revert 88033dc` — restores the article to its pre-MCP state. Forfeits the $25 Kit promo eligibility.
- Docs-log entry unwanted: `git revert fee7e07` — drops the DEPLOYMENT.md row, no site impact.
- Both non-destructive; ordering doesn't matter.

**Action required of Ian after this session:** Submit the article URL to Kit for $25 verification (the partner promo confirmation flow). Wait ~90s after the `88033dc` push for Netlify to finish the build before submission. Optional separate decision: swap `affiliate-links.ts` `kit.url` to the branded slug.

---

## Quick reference — recent additions (Session 11, 2026-05-15)

Short triage session against 3 entries in VS Code's Problems panel for this repo + the sibling `homegrown-growthco` repo. Two fixed and verified live; the third (a GHA secret-context lint on [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml)) is a false-positive — the `SLACK_WEBHOOK_URL` repo secret is configured and used elsewhere in the same workflow, the GitHub Actions VS Code extension just can't introspect repo secrets — left as-is.

**Engine output validated end-to-end since Session 10's hotfixes (observed, no new work).** Three scheduled engine runs after Session 10 shipped clean PRs: PR #27 (Gong vs Outreach vs Salesloft, merged 2026-05-14, commit `c054de5`), PR #28 (Automated Reactivation Sequence with Apollo + HubSpot, merged 2026-05-14, commit `a3a353c`), and PR #29 (Clay vs Zapier for B2B Lead Enrichment Workflows, merged 2026-05-15, commit `ccb0d8a` — landed mid-session while pushing this CLAUDE.md update, prompted a second rebase). All three went through QA auto-fix (PR #27: `[qa-fix-1]`; PR #28: `[qa-fix-1]` + `[qa-fix-2]`; PR #29: `[qa-fix-1]`) and merged green via the daily auto-merge GHA. Session 10's bug 1 (backtick fix in Generate Draft prompt) + bug 2 (resilient social-output parser) both held across all 3 runs — neither failure recurred. The engine is operating normally on the v5 + Session 10 baseline.

**tsconfig.json fix (commit `ecc68c7`, no PR — direct to master).** Severity-8 VS Code Problems entry was "Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0." **Initial fix attempt** — drop the `baseUrl` line entirely, relying on the TS 5.0+ spec that resolves `paths` relative to the tsconfig location — **broke the local test build**. Astro 4.16 / Vite / Rollup still requires `baseUrl` to be set for the `@/*` path alias to resolve at build time, even when the type-system spec doesn't require it. Error surfaced as: `Rollup failed to resolve import "@/components/post/SideBySide.astro"` from one of the 13 affected blog `.mdx` files. **Final fix** (per the TS warning text's own recommendation): restore `baseUrl: "."` AND add `"ignoreDeprecations": "6.0"` to silence the VS Code Problems entry while preserving build behavior. Local `npm run build` succeeded cleanly (34 pages built in 6.84s, pagefind indexed 23 pages) before push. Push initially rejected because of the PRs #27 + #28 auto-merges on master since the last local sync — resolved via `git pull --rebase origin master` (clean rebase, single-line tsconfig change doesn't intersect content `.mdx` files) and re-push. Netlify deploys API confirms `ecc68c7` in `ready` state at 11:48:59Z.

**`netlify/actions/cli@master` archived (sibling repo `homegrown-growth-co`, not this one).** Same VS Code triage caught that the HGC marketing site's deploy workflow was referencing an archived GHA action. Fixed there with a `setup-node` + `netlify-cli@22` install pattern. Calling out here because if the same archived-action pattern shows up anywhere in this repo's GHAs in the future, the fix template is the same: replace `uses: netlify/actions/cli@master` with the 3-step install + run pattern.

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`): none. The Vite-still-needs-baseUrl-even-when-TS-doesn't lesson is captured inline here + in `claude_projects/SESSION_FILE_OPS_LOG.md` op #106. Not strong enough as a generalizable rule to warrant its own feedback memory; the pattern (build-time path-alias config can depend on options the type-system spec marks as optional) is too specific to surface as a future-session heuristic.

**Action required of Ian after this session:** None. Both the fix and the engine output are live and healthy. 3 content PRs have shipped via the engine since the Session 10 hotfix baseline: PR #27, PR #28 (both 2026-05-14), and PR #29 (2026-05-15).

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- tsconfig change unwanted: `git revert ecc68c7` — re-surfaces the VS Code TS 6.0 deprecation warning but build still works (the revert removes the `ignoreDeprecations` line, not `baseUrl` itself).

---

## Quick reference — recent additions (Session 10, 2026-05-14)

Hotfix session triggered by the first scheduled blog engine run after the 2026-05-13 v5 re-import. Two latent bugs in the engine surfaced and both got fixed and re-imported. No content PRs this session.

**Bug 1 — Generate Draft "invalid syntax" (commit `fb8da93`, no PR — direct to master).** At 08:00 ET the scheduled run failed at the Generate Draft node with n8n `ExpressionExtensionError: invalid syntax`. Root cause: commit `2eff8e9` (2026-05-12) added a "use kebab-case for SVG attrs" prompt rule that wrapped attribute names in markdown backticks (`` `text-anchor`, `font-size`, ... ``). The entire prompt is itself a JS template literal in the n8n HTTP body, so the first inner backtick terminated the template literal early and the rest of the prompt parsed as JS, throwing at parse time. Bug was latent in the JSON since 2026-05-12, the n8n Cloud import that picked it up was 2026-05-13 (engine v5), and today's 8am scheduled run was the first one to hit it. **Fix:** replaced the 14 markdown-formatted attribute names with single-quote-wrapped equivalents (`'text-anchor'`, `'font-size'`, ...), semantic instruction to the LLM is identical, no template-literal break. New auto-memory `feedback_no_backticks_in_template_literal_prompts.md` captures the rule + the JSON-parse + `new Function('return ' + expr)()` test-pattern for future-proofing.

**Bug 2 — Parse Social Outputs "missing twitter field" (commit `f0f4dd8`, no PR — direct to master).** After re-importing the Bug 1 fix, the workflow got all the way through Open PR before failing at Parse Social Outputs with `Error: Social outputs missing or empty field: twitter`. Haiku had returned a JSON shape inconsistent with the strict 3-field validator (either named the field `tweet`/`tweets`/`x_thread`, dropped it entirely, or truncated at `max_tokens: 2048`). Two coordinated fixes: **(a)** Generate Social Outputs `max_tokens` bumped 2048 → 4096 for headroom (worst-case extra Haiku output cost ~$0.005 per post). **(b)** Parse Social Outputs rewritten to try common field-name variants (twitter / twitter_thread / tweet / tweets / x / x_thread, analogous for video and linkedin); on still-missing fields, save a diagnostic placeholder to Notion instead of throwing. Placeholder includes truncation flag, missing field name, Haiku's actual top-level keys, and a 300-char raw sample so Ian can decide whether to regenerate manually. **Social drafts are now non-blocking** — the blog PR ships even if Haiku's social JSON is malformed. Source-of-truth artifact: [n8n/update-engine-resilient-social-parser.mjs](n8n/update-engine-resilient-social-parser.mjs), same idempotent one-shot pattern as v5's `update-engine-v5.mjs`.

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_no_backticks_in_template_literal_prompts.md` — when an LLM prompt is embedded in a JS template literal (n8n HTTP body, code-node strings), never use markdown backticks for code formatting; use single quotes or escape. Surfaces as opaque `ExpressionExtensionError: invalid syntax` at runtime. Cross-references `feedback_deterministic_sanitizer_over_prompt.md`.

**Action required of Ian after this session:** None, both hotfixes were re-imported into n8n Cloud during the session. Next scheduled run picks up both. If today's stuck Notion topic is still at `Status=Generating`, flip back to `Queued` so the next run picks it up. If the auto-fired social Slack pings for today's PR are useful as templates, regenerate manually via a one-off n8n trigger against the same topic — otherwise the post itself is the main artifact.

**Revert paths** (also captured in DEPLOYMENT.md table further down):
- Both hotfixes broken: `git revert f0f4dd8` then `git revert fb8da93`
- Parse Social Outputs new behavior unwanted: `git revert f0f4dd8` (falls back to throw-on-missing + `max_tokens: 2048`)
- Backtick fix unwanted: `git revert fb8da93` (re-breaks Generate Draft at next scheduled run, do not)

---

## Quick reference — recent additions (Session 9, 2026-05-13)

This session diagnosed and fixed a recurring layout bug class in the content engine, hardened the engine against three failure modes that were producing AI-slop output, and cleared the open-PR backlog.

**Triggering bug — PR #24 newsletter post (Beehiiv vs Substack vs HubSpot, merged 2026-05-13).** Ian flagged a broken flowchart and missing Substack hyperlink. Root cause investigation revealed two issues that together explain the symptom plus a class of recurring failures:

1. **Substack wasn't in `src/data/affiliate-links.ts`** so the ComparisonTable CTA dropped (component only renders CTA when `affiliateSlug` is set) and the engine's "first mention" rule skipped Substack entirely. Fixed by adding `substack` as `status: 'no-program'` with `homepageFallback: 'https://substack.com/'` — the existing `resolveDestination()` handles fallback to homepage + UTM tag.
2. **The engine generated camelCase SVG attributes** (`textAnchor`, `fontWeight`, `strokeWidth`) despite its prompt having a CRITICAL kebab-case rule. Astro renders SVG as raw HTML, so browsers silently drop camelCase attrs → `text-anchor` defaulted to `start` → labels rendered left-aligned and overflowed both their boxes and the figure container. The qa-fix-1 / qa-fix-2 auto-fix bot saw the visual overflow but couldn't infer "the attribute names are wrong" from a screenshot — it patched CSS around the symptom (qa-fix-2 added an invalid `style` prop on `<ComparisonTable>` with `@media` inside inline CSS, plus an empty trailing `<div>` for 7rem of blank space).

**Engine v5 (PR #25, merged 2026-05-13).** Three coordinated changes hardening the engine after the PR #24 diagnosis:

- **Generate Draft prompt**: adds `PERSONAL VOICE` (first person required — I/me/my/we/my clients, 3-5 markers per post, Ian Chamberland / Homegrown Growth Co. framing), `EXTERNAL CITATIONS` (2-4 inline links to vendor docs / Gartner / Forrester / HubSpot Research / Lenny / Reforge / Common Room / First Round Review / G2; do-not-invent-URLs rule explicit), `NO EM/EN DASHES` (hard rule with commas/periods/parens replacements). `substack` added to the affiliate slug list.
- **Humanize prompt**: adds `NO DASHES` scrub across body/frontmatter/JSX/captions, `PERSONAL VOICE verify` (inject if <3 first-person markers), `CITATIONS verify` (add if <2 inline external links). `substack` added to slug list (parity).
- **Parse Draft jsCode**: prepends a deterministic `sanitizeMdx()` that runs on every output regardless of LLM compliance. Converts camelCase SVG attrs → kebab-case (`textAnchor` → `text-anchor`, `fontWeight` → `font-weight`, `strokeWidth` → `stroke-width`, etc.) and replaces em (U+2014) + en (U+2013) dashes with `", "`. **This sanitizer is the load-bearing change** — prompt rules are aspirational, the regex pass makes the bug class unshippable.

Engine v5 was re-imported into n8n Cloud by Ian on 2026-05-13. Source-of-truth artifact: [n8n/update-engine-v5.mjs](n8n/update-engine-v5.mjs) — same idempotent one-shot pattern as v4's `update-engine-for-mdx.mjs`.

**Cleanup + CI lint (PR #26, merged 2026-05-13).** Removed the qa-fix-2 noise from the newsletter post (invalid `style` prop on `<ComparisonTable>` + empty trailing `<div>` that was rendering as visible blank space + a spurious horizontal divider). Added a `camelCase SVG attributes` lint step to [.github/workflows/qa-content-pr.yml](.github/workflows/qa-content-pr.yml) that runs before the expensive Playwright/Vision pipeline (~2s, fail-fast). The lint is defense-in-depth: the engine's `sanitizeMdx()` covers the LLM path, the CI lint covers hand edits and direct commits that bypass the engine.

**Navbar mobile/tablet fixes (PR #23, merged 2026-05-13 — opened 2026-05-12).** Two real overflow bugs identified by the QA Vision review on the earlier kit-newsletter post: (1) mobile <768px — logo + 3 nav-links = ~400px in a 327px content area, "Tools" was clipping with no fallback; (2) tablet 768-1023px — Newsletter CTA visible despite `.nav-cta { display: none }` because `.btn { display: inline-flex }` declared later in source at same specificity (0,1,0) was winning. Fix adds a hamburger drawer on mobile (vanilla DOM, IIFE-wrapped inline `<script is:inline>`, ARIA-correct, CSS-only animation hamburger → X via `transform` on `aria-expanded="true"`, drawer closes on link click / Escape / viewport-resize-past-768) and bumps tablet rule specificity to `.btn.nav-cta { display: none }` (0,2,0 beats 0,1,0).

**Auto-memory updates** (this session, persisted in `~/.claude/projects/.../memory/`):
- `feedback_no_em_dashes.md` — hard editorial rule across all of Ian's content/writing projects; em dashes and en dashes are AI-slop tells, replace with commas/periods/parens
- `feedback_deterministic_sanitizer_over_prompt.md` — for LLM output with hard syntax invariants (kebab-case attrs, character bans, schema constraints), add a deterministic post-process; prompt rules alone fail and Vision QA can't infer attribute-level bugs from screenshots

**Affiliate philosophy clarified.** Every tool mentioned gets a `/go/<slug>` link regardless of program status. If no affiliate program exists, `homepageFallback` + UTM tag in [src/data/affiliate-links.ts](src/data/affiliate-links.ts) handles the redirect. `resolveDestination()` already implements this; the engine's "first mention" rule now linkifies all tools on the slug list (which includes Substack as the first `no-program` example). When adding a new tool the engine should know about: add it to both `affiliate-links.ts` AND the slug list in both Generate Draft and Humanize prompts (one entry in the engine JSON, applies to both nodes via the v5 updater script).

**Action required of Ian after this session:** None — engine v5 already re-imported into n8n Cloud. Next blog engine run picks up all three layers (prompt rules + verify pass + sanitizer).

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

**Affiliate program wiring — 6 live, 2 rejected, 2 pending (commit `b7c3071`, pushed direct to master 2026-05-12 PM).** Edited [`src/data/affiliate-links.ts`](src/data/affiliate-links.ts) — the source of truth for every `/go/<slug>` redirect on the site. Approved 2026-05-12: **Make** (`make.com/en/register?pc=automationsguide`, direct partner program, 35% / 12 mo, 30-day cookie), **Apollo** (`get.apollo.io/k7n9run0vl50`, PartnerStack, 15% mo / 20% annual / 12 mo), **Clay** (`me.sh/?via=theautomationsguide`, Rewardful, $50 one-time / 60-day cookie), **Beehiiv** (`?via=the-automations-guide`, 50-60% recurring / 12 mo), **Smartlead** (`?via=theautomationsguide`, 15-35% recurring tiered), **Kit** (`partners.kit.com/nt9zrjmnck9y`, PartnerStack, 50% / 12 mo). Rejected (traffic-related, ~likely <1K visits/mo threshold): HubSpot, n8n — `/go/hubspot` and `/go/n8n` still resolve via homepage + UTM fallback, so links don't break. Pending: Pipedrive (gated by PartnerStack Network application, also pending 2026-05-12). Lemlist not applied yet. Added `'rejected'` to the `AffiliateLink` status union for accurate registry state. [AFFILIATE_PROGRAMS.md](AFFILIATE_PROGRAMS.md) rewritten with a proper Status / Live link / Commission / Notes table; "Where to put the links" section trimmed to point at `affiliate-links.ts` as the single edit point. Net effect: the site's affiliate revenue path is now live for the first time — every existing `/go/<tool>` link across blog posts, tools page, and homepage tool cards now routes to a real partner URL with tracking. **PartnerStack Network application copy** (Label + "What program managers should provide") prepared in conversation; submitted by Ian.

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
| `AFFILIATE_LINK_PLACEHOLDER` (raw) | `src/pages/index.astro`, `src/pages/tools.astro` | ✅ Replaced with `/go/[tool]` redirects. Live (2026-05-12): Make, Apollo, Clay, Beehiiv, Smartlead, Kit. Rejected: HubSpot, n8n (re-apply when traffic builds). Pending PartnerStack Network: Pipedrive. |
| `[COMPANY_LOGOS_PLACEHOLDER]` | `src/pages/index.astro` hero | ✅ Replaced with HGC publisher line |
| `ian@theautomationsguide.com` | `src/pages/about.astro` and legal pages | ✅ Done — alias on Ian's HGC Google Workspace |
| Notion DB IDs / Slack URL | n8n Config nodes | ✅ Filled in workflow JSONs (Content Calendar `62f34586-...`, Drafts `7399699b-...`) |
| `sameAs: []` | `src/layouts/BaseLayout.astro` | ✅ Populated with LinkedIn (Ian) + HGC. TAG company page LinkedIn/Twitter URLs still pending |
| Apple touch icon | `public/apple-touch-icon.png` | ✅ Done (HGC's icon) |
| OG image template | `public/og-default.png` | ❌ Not done — needs design work |

---

## 5. Master Next Steps (current state — 2026-05-13 EOD)

### What's running already

- [x] Site live on theautomationsguide.com, auto-deployed from `master` via Netlify (Node 22 LTS).
- [x] **Content engine v5** (Session 9, 2026-05-13) live in n8n Cloud. Adds PERSONAL VOICE + EXTERNAL CITATIONS + NO EM/EN DASHES prompt rules, Humanize verify passes for each, and a deterministic `sanitizeMdx()` in Parse Draft that converts camelCase SVG attrs → kebab-case and strips em/en dashes regardless of LLM compliance. ~$0.13 per post API spend (unchanged from v4).
- [x] **Topic Suggestor** (Haiku 4.5, Mon/Thu) + **Daily Briefing** (Slack ping each morning) live in n8n Cloud.
- [x] **Auto-merge content PRs GHA** (daily 14:00 UTC, 14-day staleness threshold, Slack-notifies via `SLACK_WEBHOOK_URL` repo secret).
- [x] **QA auto-fix pipeline GHA** (Claude Vision review + 2-fix-cap, ~$0.30 worst-case per PR). **camelCase SVG attrs CI lint** (Session 9) runs before screenshots and fails fast if camelCase attrs slip into a content PR — defense-in-depth against hand edits that bypass the engine sanitizer. See Session 8 note about one-shot limitation pending PAT swap.
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
- [x] (2026-05-12) **6 affiliate programs live:** Make (`pc=automationsguide`), Apollo, Clay, Beehiiv, Smartlead, Kit. All wired in `src/data/affiliate-links.ts`. HubSpot + n8n rejected (re-apply when traffic builds). Pipedrive gated by pending PartnerStack Network application.
- [x] (2026-05-13) **Substack registered as `no-program` affiliate entry** in `src/data/affiliate-links.ts` — links via `/go/substack` fall back to substack.com + UTM tag. Pattern for any tool without an affiliate program: add the entry, add the slug to the engine's slug list, and `resolveDestination()` handles the homepage fallback automatically.
- [x] (2026-05-13) **Navbar mobile hamburger drawer + tablet CTA specificity fix** (PR #23). Mobile <768px shows a hamburger that opens a drawer (Blog/Tools/About + search + Newsletter CTA + LinkedIn). Tablet 768-1023px hides the CTA + LinkedIn icon via `.btn.nav-cta { display: none }` (specificity 0,2,0).
- [x] [DEPLOYMENT.md](DEPLOYMENT.md) — rollback safety guide pinned at repo root.

### Open / pending — tracked in Notion

**Canonical source of truth for all TheAutomationsGuide to-do items:**

➡️ **[TAG Tasks Notion database](https://www.notion.so/df30d3d41bc14e94a4f9d760c521d69f)** (under `TAG - Content Engine` workspace)

Sortable by Due Date / Priority / Category. Statuses: `Not started` → `In progress` → `Done` (or `Waiting` if blocked on an external response). Recurring items (monthly engine audit, quarterly key rotation, etc.) live there too.

**Going forward, do not add new to-do items to this CLAUDE.md file.** Add them to the Notion DB. This section exists only to point you there. Past Sessions' completed work is preserved in the Quick reference sections above for historical context.

### Revert paths (in case anything breaks)

| Concern | Revert command |
|---|---|
| tsconfig `ignoreDeprecations` line wrong / TS 7.0 breaks it | `git revert ecc68c7` (commit, no PR — direct master) — re-surfaces VS Code TS 6.0 deprecation warning but build still works |
| Navbar mobile drawer / tablet hide broken | `git revert 4cec916` (PR #23 — navbar mobile/tablet fix) |
| camelCase SVG CI lint blocking a PR you don't want it to | `git revert bae8a23` (PR #26 — also restores the qa-fix-2 noise) |
| Newsletter post (Beehiiv vs Substack vs HubSpot) needs rollback | `git revert cc295c5` (PR #24 — full post + Substack affiliate-links entry) |
| Engine v5 prompts produce odd output | `git revert 8377188` (PR #25) — then re-import the reverted JSON into n8n Cloud. Falls back to v4 behavior. |
| Latest engine-generated content PR not what you want | `git revert 73a8e86` (PR #16 — newsletter automation post) |
| Backfilled posts look worse than originals | `git revert 52e6807` (PR #11 — backfill 8 posts to MDX) |
| QA auto-fix pipeline misbehaves | `git revert c2c2b18` (PR #12 — QA pipeline) — engine still works without QA loop |
| Right-size models causing social output quality regression | `git revert 8733108` (PR #13 — model right-sizing) — restores 3 Sonnet social calls |
| Automation workflows / Node 22 / auto-merge GHA broken | `git revert b9f4932` (PR #10 — automation improvements) |
| QA workflow `grep -c` or screenshot height bugs surface again | `git revert 0ac804b` (PR #17) or `git revert 2e248ae` (PR #19) — both are bug fixes; reverting restores the failing behavior. Don't revert these. |
| Visual format redesign caused regression | `git revert a83b5cd` (PR #7) |
| Engine v4 MDX prompt produces bad output | `git revert c23036c` (PR #8) — falls back to pre-fix v4 prompt. To fully revert to v3 markdown engine: `git revert a83b5cd` and re-import the resulting JSON into n8n Cloud. |

For step-by-step rollback instructions (UI / CLI / Netlify emergency button) see [DEPLOYMENT.md](DEPLOYMENT.md).

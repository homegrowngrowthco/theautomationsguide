# Full Website Audit — theautomationsguide.com — 2026-06-17

> **RESOLUTION (2026-06-18, Session 41):** The critical and **all 6 mediums** are fixed, merged to master, and deployed.
> - **C-1 + C-2** → PR #109 (register zapier/canva/creatify + affiliateSlug lint matcher; also fixed a latent quoted-key parser bug). Prod-verified: `/go/{zapier,canva,creatify}/` now 200.
> - **M-1** color-contrast → PR #110 (`--accent-text` teal-700 + darker fills/faint; Lighthouse color-contrast PASS, a11y 92→96).
> - **M-2 / L-1 / L-8** → PR #111 (default `/og/default.png` card + `og:type=article` + ` | ` title separator). Prod-verified: og:image live.
> - **M-6** → PR #112 (`npm audit fix` non-breaking; 12→9 vulns; Astro 4→6 major deferred/tracked).
> - **M-5** → PR #113 (59 lines dead CSS removed).
> - **M-4 / M-3** → PR #114 (rehype `rel="sponsored"` on prose /go/ links + title-length lint warning).
>
> **Remaining open:** lows L-2, L-3, L-4, L-5, L-6, L-7, L-9, L-10, and the deferred Astro 4→6 major migration (M-6 second half). See the Low section.

**Verdict:** The site is in genuinely good shape. The 2026-06-14 SEO audit's one critical (mobile Core Web Vitals) is fully resolved (Perf 97-100, LCP 1.6-2.3s, CLS 0 across every template). Content, security headers, analytics, and the QA pipeline are all clean. There is **one true critical: four affiliate CTAs 404 at click time on production** (live revenue leak), enabled by a gap in the deterministic QA gate. Everything else is medium/low polish — and the single highest-leverage medium is the sitewide WCAG color-contrast fail (the same brand-token class HGC fixed in its own audit).

This is the full-spectrum companion to [AUDIT-SEO-2026-06-14.md](AUDIT-SEO-2026-06-14.md) (which was SEO-only). Scope: performance, accessibility, conversion/affiliate funnel, content quality, code/template quality, security & headers, dependencies, SEO refresh, analytics integrity, cross-device visual.

**Method:** `npm run build` + the full `qa` suite (lint-content / render-acceptance / mobile-overflow / lint-logos / seo-scan) as the deterministic baseline; a 5-agent read-only static fan-out (content, code, affiliate, security, SEO); Lighthouse 12 (simulated mobile) against **production** across home, blog post, /tools index, tool hub, /reviews, /teams; Playwright network capture + axe-class checks against production. Tallies: **1 critical (+1 paired root-cause), 6 medium, 11 low.** Every finding has file:line or a live-URL evidence anchor.

---

## Critical

### C-1 — Four affiliate CTAs 404 at click time (live revenue leak)
Three comparison posts render "Try X" affiliate buttons whose `/go/<slug>` target has **no entry** in `src/data/affiliate-links.ts`, so `src/pages/go/[tool].astro` never generates the redirect page and the click hits a 404.

**Confirmed live on production** (2026-06-17): `GET /go/zapier/` → **404**, `/go/canva/` → **404**, `/go/creatify/` → **404** (control `/go/clay/` → 200).

| Slug | Post | Line |
|---|---|---|
| `zapier` | `2026-05-15-clay-vs-zapier-for-b2b-lead-enrichment-workflows.mdx` | 81 |
| `zapier` | `2026-06-05-pabbly-vs-zapier-vs-make-budget-automation-compared.mdx` | 91 |
| `canva` | `2026-06-08-adcreativeai-vs-canva-vs-creatify-which-ai-ad-tool-wins.mdx` | 83 |
| `creatify` | `2026-06-08-adcreativeai-vs-canva-vs-creatify-which-ai-ad-tool-wins.mdx` | 94 |

These are `affiliateSlug:` props inside `ComparisonTable` blocks (`ComparisonTable.astro:60-69 / 105-114`). A reader who clicks the comparison column's CTA — the site's own money button — lands on a 404. Worst-case conversion dead-end, currently live.

**Fix:** add `zapier`, `canva`, `creatify` to `affiliate-links.ts` as `no-program`/`pending` entries with `url: ''` + a homepage fallback (the exact pattern already used for `gong`/`outreach`/`salesforce`/`salesloft`/`substack`). `resolveDestination()` then routes them to homepage+UTM and `/go/<slug>` generates. ~10 minutes.

### C-2 — The QA gate can't see component-prop affiliate slugs (root cause of C-1)
`qa/lint-content.mjs:131` validates affiliate slugs with `/\/go\/([a-z0-9-]+)/g` — it only matches the **prose** `/go/...` link form. The component form `affiliateSlug: "zapier"` has no `/go/` prefix, so it is invisible to the gate. That is *why* C-1 shipped past CI, and why it will recur on the next engine-generated comparison post.

**Fix:** add a second matcher in `lint-content.mjs` for `/affiliateSlug:\s*['"]([a-z0-9-]+)['"]/g` and hard-fail each slug not in the affiliate set (same as the existing `/go/` check). This closes the class, not just the instances. Pair it with C-1 in one PR.

---

## Medium

### M-1 — WCAG color-contrast fails sitewide (accessibility)
Lighthouse a11y is 92-96 on every template (never 100); the recurring failure is **color-contrast**, 34 flagged elements on `/tools/` alone. The teal accent `#14a890` on light backgrounds fails AA, and white-on-teal buttons are borderline:

- affiliate-notice "Read the full disclosure" link — **2.71**
- hero eyebrow "TOOLS · REVIEWS · RECOMMENDATIONS" — **2.77**
- tool badges ("FREE TIER AVAILABLE" etc.) — **2.77**
- ghost-button CTAs "Try Make →" (white on teal) — **2.98**
- muted badge text `#8b929e` — **2.84**

This is the **same brand-token class HGC fixed (its M-4)**: introduce a darker teal-for-text token (HGC used teal-700 ≈ `#2D6E6A`) for text/icon strokes + badge text on light backgrounds, and darken button fills, while keeping the brand teal for decorative dots/borders/backgrounds. Token-level fix in `global.css`, broad blast radius, low risk. Highest-leverage medium.

### M-2 — No og:image / twitter:image fallback (SEO/social)
`BaseLayout.astro:139,145` only emit the social-image tags when `ogImage` is set. The homepage, `/blog`, `/about`, `/teams/*`, `/tools/*`, `/playbooks`, and the new `/reviews` render **zero** social image — link shares on LinkedIn/X/Slack and AI answer surfaces show a bare text card. (Blog posts are fine; they get a per-post `/og/<slug>.png`.) **Fix:** default `ogImage` to a branded `/og-default.png` in BaseLayout. One change, covers every non-post page. (Needs the default card asset created — none exists yet.) Still open from 2026-06-14.

### M-3 — 88 of 97 `<title>` tags exceed SERP width (SEO)
Titles run up to 105 chars including the 24-char ` — The Automations Guide` suffix, so Google truncates the differentiating end. Worst: the RevOps-stack-2026, Kit+n8n+Notion, and Zapier-vs-Make posts (92-105 chars). **Fix:** tighten engine-generated post titles toward ~55 chars pre-suffix, and/or drop the brand suffix on already-long titles. Structural (engine prompt + a lint warning). Count is up from 82/89 only because more posts shipped.

### M-4 — Inline prose affiliate links lack `rel="sponsored"` (conversion/SEO hygiene)
~111 in-body markdown affiliate links (`[Clay](/go/clay)`) render as bare `<a href="/go/clay">` — no `rel`, no `target`. The structured component CTAs (the primary conversion path) are already correct (`rel="noopener noreferrer sponsored"`). Mitigated because the link points at an internal, `noindex` `/go/` redirect rather than the raw affiliate URL, so this is best-practice, not an FTC gap. **Fix:** stamp `rel="sponsored noopener noreferrer"` on the `/go/[tool]` redirect's `<a>`, or a rehype plugin that marks any `<a href^="/go/">` at build. Low urgency.

### M-5 — Dead CSS in an untree-shaken bundle (code quality)
`src/styles/global.css` is ~47 KB / 1,824 lines and ships in full to every page (Astro doesn't tree-shake it). **11 classes have zero references** outside the definition file — the strongest cluster is a ~70-line **legacy EmailSignup block** (`email-input*`, `email-signup-inner/-launching/-form-placeholder`, lines ~1271-1341) that the CSS comment itself labels "Legacy"; `EmailSignup.astro` now uses the `beehiiv-form-wrapper` path. Also dead: `nav-dropdown-sep`, `tool-cta`, `hero-social-proof`, and the `mt-sm`/`mt-md`/`text-accent` utilities. **Fix:** delete the 8 high-confidence selectors + the legacy block; decide whether to keep the unused `mt-*` utility scale. Verify each against current source before deleting (the audit matched literal names; none are built via string concat, so it's reliable).

### M-6 — Astro is two majors behind; 4 high advisories (dependencies)
`npm audit`: **4 high / 7 moderate / 1 low, 0 critical.** All four highs chain from **Astro 4.16.19 (latest is 6.4.8)** — `astro`, transitive `vite` (esbuild dev-server), plus `devalue` and `fast-xml-builder`. The moderates are the build-time `js-yaml` chain. **Context:** these are overwhelmingly *build-time / dev-server* advisories; a static-output site that ships no server has minimal visitor-facing exposure. **Fix:** `npm audit fix` clears `devalue` + `fast-xml-builder` immediately (non-breaking, 2 of 4 highs gone). The rest needs the Astro 4→6 major upgrade — a real migration, defensibly deferred, but 4.x is heading to EOL so it should be tracked, not ignored.

---

## Low

- **L-1 — em-dash title separator.** `BaseLayout.astro:41` builds `${title} — ${siteName}` with an em dash on 96/97 titles, violating the no-em-dash house style. Swap ` — ` → ` | ` (also slightly shortens titles, helps M-3). One line, sitewide.
- **L-2 — heading-order on the homepage.** Sequence is `h1 → h3 h3 h3 h3 → h2` (the "Tools we cover" logo-strip `h3`s render before the first `h2`). Blog posts are clean. Fix: bump the strip `h3`s to `h2`, or precede them with an `h2`.
- **L-3 — a11y label-content-name-mismatch.** Footer "Published by Homegrown Growth Co" link's accessible name ≠ its visible text (`footer-bottom-publisher`). 1 element. Align the `aria-label`/text.
- **L-4 — a11y link-in-text-block.** The `/tools` affiliate-notice "Read the full disclosure" link is distinguishable from surrounding text by color only, at 1.94:1. Add an underline (resolves alongside M-1's contrast bump).
- **L-5 — a11y frame-title (beehiiv iframe).** The newsletter iframe has no `title`. It's injected by beehiiv's cross-origin `loader.js`, so it can't be set in our source — only via a post-injection JS shim (`wrap.querySelector('iframe').title = ...` after load) or accepted as a vendor limitation.
- **L-6 — 9 oldest tool hubs have no FAQPage schema.** `apollo, beehiiv, clay, hubspot, kit, make, n8n, pipedrive, smartlead` have no `faqs` in `tools.ts`, so `tools/[tool].astro` emits no FAQPage (the 34 LP-builder tools all do). These are the highest-traffic hubs. Backfill `faqs` for the 9. (Note: this corrects the 2026-06-14 audit's blanket "FAQPage on tool hubs" claim.)
- **L-7 — meta-description outliers.** 3 over/under SERP limits: `/blog/revops-automation-stack-2026/` (183), `/blog/2026-06-17-apollo-sequences-vs-hubspot-sequences-the-truth/` (169, new), `/terms/` (65, thin). Trim the long two; cap engine output length.
- **L-8 — og:type=website on blog posts.** `BaseLayout.astro:138` hardcodes `website` for all pages; posts should be `article`. BlogPosting JSON-LD already carries the real semantics, so impact is minor. Pass an `ogType` prop defaulting to `website`, set `article` from the post layout.
- **L-9 — 8 compared tools render without a brand logo** (`gong`, `outreach`, `salesloft`, `zapier`, `adcreative`, `canva`, `creatify`, plus pabbly-post `zapier`). Cosmetic; many are no-program/unknown tools with no brand asset.
- **L-10 — repeated inline-style idioms.** The banded-section treatment (`border-top:1px solid var(--border);background:var(--bg-secondary)`) repeats across ~5 sites (`index.astro:135,206,231`, `tools.astro:100`), and an empty-state idiom across 4 hub pages — both are small DRY-up candidates (`.section--banded`, `.empty-state`).
- **L-11 — latent newsletter fragility.** `EmailSignup.astro`'s injection fallback uses a document-wide `querySelector('.beehiiv-form-wrapper')`; if a page ever rendered two signup forms, the second would fail to inject. No page renders two today, so it's latent only. Robust fix: scope the fallback to the script's own section.

---

## What passed (coverage matrix)

| Dimension | Result | Evidence |
|---|---|---|
| **Performance / CWV** | ✅ PASS | Lighthouse mobile (prod): home/post Perf 94-99 LCP median 2.33s; tools-index 97/2.2s; tool-hub 97/2.3s; reviews 98/2.1s; teams 100/1.6s. **CLS 0 everywhere.** The 2026-06-14 CWV-critical (LCP ~7.5s) is fully resolved. |
| **Content quality (39 posts)** | ✅ PASS | 0 hard. Retired-DecisionTree leftovers (0), em/en-dashes (0), broken internal links (0), missing tldr (0), empty image alt (0), malformed component props (0), heading hierarchy in posts (0). |
| **Analytics integrity** | ✅ PASS | Live prod capture: PostHog `POST /e/` 200, GA4 `g/collect?en=page_view` 204, **Clarity `y.clarity.ms/collect` 204** (the exact endpoint that was CSP-blocked on HGC is flowing here). No silent breakage. |
| **Security headers / CSP** | ✅ PASS | `_headers` CSP tight + in-sync with what loads (PostHog/GA4/GTM/Clarity/beehiiv all allowlisted-and-used; Google Fonts correctly removed). HSTS (2yr+preload), X-Frame-Options DENY + frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy all present. |
| **Secrets / tabnabbing** | ✅ PASS | No real secrets in tracked source (exposed IDs are publishable-by-design); `.env` gitignored + untracked; 100% of `target="_blank"` carry `rel="noopener"`. |
| **Affiliate disclosure (FTC)** | ✅ PASS | `/disclosure/` page + global per-post disclosure (`BlogPostLayout.astro:173`) + `/tools` notice + footer link. No monetized page missing disclosure. |
| **Component affiliate CTAs** | ✅ PASS | Every component CTA (ComparisonTable/ChooseIf/IntentTable/ToolBreakdown/BottomLine, tool cards, tool hubs) uses `rel="noopener noreferrer sponsored" target="_blank"`. |
| **/go redirect integrity** | ✅ PASS | Build-time throw on unknown registry slug; homepage+UTM fallback for empty `url`; PostHog `affiliate_click` before redirect; `noindex,follow`. (Gap is only the unregistered component slugs — C-1.) |
| **Newsletter injection** | ✅ PASS | The Session-36 break is fixed; current sibling-lookup + `document.querySelector` fallback + IntersectionObserver + `<noscript>` are sound; form present on home + every post. |
| **Cross-device visual** | ✅ PASS | `mobile-overflow` 0/39 posts at 390px; home + /tools at 390px = no horizontal overflow, no broken images; nav (two dropdowns) verified earlier today. |
| **QA pipeline integrity** | ✅ PASS | `lint-content` 0 hard, `render-acceptance` 0 hard, `lint-logos` clean, `seo-scan` 0 hard (234 advisory = the title/meta-length class above). Auto-fixer `<style>`/wrapper injection fully guarded + MDX-only. |
| **Robots / sitemap** | ✅ PASS | robots points at the correct `sitemap-index.xml`; sitemap filter excludes `/go/*`, `/og/*`, and noindex paths; `/reviews` present + linked. |
| **Dead components / dup class attrs / console.logs** | ✅ PASS | 22/22 components imported; no duplicate `class` attributes (the HGC bug class is absent); no stray `console.log` in shipped code. |

---

## Suggested fix sequencing

1. **C-1 + C-2 together** (one PR) — stop the live affiliate 404s *and* close the gate gap so it can't recur. Highest priority; ~30 min.
2. **M-1 color-contrast** — port HGC's teal-text-token approach; biggest a11y + brand-trust win, one token-level change. Sweeps up L-4 too.
3. **M-2 og:image default + L-1 em-dash separator + L-8 og:type** — small BaseLayout batch, high SEO/social ROI.
4. **L-2 heading-order, L-3 label mismatch, L-6 tool-hub FAQs, L-7 meta trims** — quick deterministic wins.
5. **M-5 dead CSS + L-10 inline-style extraction** — code-quality cleanup PR.
6. **M-6 `npm audit fix`** now (non-breaking); schedule the Astro 4→6 upgrade as its own tracked project.
7. **M-3 title length** — engine-prompt change + lint warning; structural, lower urgency.

Fixes batch into revertable PRs by dimension. No fixes applied in this audit — findings only.

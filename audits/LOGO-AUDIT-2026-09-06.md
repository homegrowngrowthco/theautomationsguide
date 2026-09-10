# Logo Audit (banner-vs-icon retro) - 2026-09-06

> Trigger: TODO items "Audit older tool logos for the banner-vs-icon bug class" and the hand-dropped-mark items (pandadoc, activepieces, profound, justcall). Findings freeze at write time; remediation is tracked ONLY in TODO.md. Re-derive any number here with `node qa/audit-logos-retro.mjs` (added in this audit).

## Verdict up front

**10 of 77 raster logos failed the sourcing guard's banner rule; all 10 are fixed, and the rule now also runs in CI.** `qa/auto-register-tools.mjs` gained an OG-banner reject on 2026-08-20 (`width >= 600 AND width/height > 1.5`), but that guard only runs when a logo is first sourced. Logos registered before that date were never re-checked, and the CI gate (`qa/lint-logos.mjs`) had no banner rule at all, which is how `attio.png` (a 1200x630 OG card) sat on the site until it was found by hand on 8/31. Re-running the guard's exact rules over the whole `public/brand/tools/` population found 10 more.

The 10 split into two classes, which matter because they need different fixes:

- **5 true OG/social banners** (fillout, fullenrich, saleshandy, warmforge, zapier): captioned screenshots at 1.9:1, two of them (fullenrich, saleshandy) with white knocked-out text that is invisible on the cream cards. 2400x1260 / 1.1 MB in fullenrich's case.
- **5 genuine transparent wordmarks that only trip the rule on pixel width** (calendly, clay, rb2b, smartlead, salesforce). Re-sourcing these through the favicon path would have swapped a good wordmark for a 128px favicon, so they were downscaled below the 600px threshold instead (lanczos3, alpha preserved, bytes down 26% to 66% on four of five).

No logo failed the corner/luminance rules (the lint-logos gate already enforces opaque corners on every PR, so that class cannot accumulate). The informational visible-luminance column flags 5 pale marks (activecampaign 243, otter 242, customerio 232, lindy 231, voiceos 222) that pass every rule but read faint on cream; they are listed, not fixed, because the guard has no rule for them and inventing one is a separate decision.

## Guard rules audited (verbatim from the two sources)

| Rule | Source | Definition |
|---|---|---|
| guard.banner | `validateRasterLogo` | reject if `width >= 600 && width/height > 1.5` |
| guard.corners | `validateRasterLogo` | any corner alpha `< 8` passes as-is (no further checks) |
| guard.knockout | `validateRasterLogo` | all 4 corners opaque: key out corner[0] colour at RGB distance `< 40`; reject if kept `< 2%` of pixels or mean luminance of kept `> 215` |
| gate.opaque | `lint-logos` (HARD) | all 4 corners alpha `>= 250` |
| gate.aspect | `lint-logos` (WARN) | `width/height` outside `[0.4, 9.0]` |
| info.pale-mark | audit only, NOT a rule | mean luminance of visible pixels `> 215` on a transparent-corner logo |

SVGs are skipped by both sources and by the audit (19 at the start, 24 after).

## What changed

| slug | before | action | after | source |
|---|---|---|---|---|
| fillout | 960x504 png OG banner | re-sourced via `--logo-for --replace` | 48x48 png (Google favicon fallback) | script path |
| fullenrich | 2400x1260 png OG banner (1.1 MB, white text) | re-sourced via `--logo-for --replace` | svg favicon (black disc) | `https://www.fullenrich.com/_app/immutable/assets/favicon.qhQ-VE9A.svg` |
| saleshandy | 1200x630 png OG banner (white text) | re-sourced via `--logo-for --replace` | 128x128 png (Google favicon fallback) | script path |
| zapier | 1200x630 png OG banner (product screenshot) | script path failed (site favicon is .ico, Google favicon knocks out to a near-white mark, lum 227); hand-sourced | svg "earth" wordmark | `https://brand.zapier.com/` (asset `zapier-logo_earth.svg`) |
| warmforge | 1200x630 png | **logo removed** | text-wordmark fallback | warmforge.com is a WordPress.com blog; its favicon and og:image are WordPress's generic "W" assets, so the old file was a WordPress banner, not a WarmForge mark. Google favicon 404s. No vendor mark exists to source. |
| calendly | 661x160 png wordmark | downscaled | 560x136 png | same asset |
| clay | 694x219 webp wordmark | downscaled | 560x177 webp | same asset |
| rb2b | 943x279 png wordmark | downscaled | 560x166 png | same asset |
| smartlead | 756x160 webp wordmark | downscaled | 560x119 webp | same asset |
| salesforce | 1024x537 png cloud mark | downscaled | 560x294 png | same asset |
| pandadoc | none (near-white icon failed the guard; site 429s our UA) | hand-sourced | svg header wordmark (green box + dark text, lum 94) | `https://www.pandadoc.com/press/` links it: `https://images.ctfassets.net/a4zep9yar86b/66eeRH9nOKsKg51R8HbIFd/9869920f44f45e6e41182ef875a8dfad/pandadoc-logo-desktop.svg`. The press-kit PNG (`.../app/uploads/pandadoc-brand-logo.png`) is a clear-space usage diagram, not a clean mark; `logo.zip` on the press page 404s. |
| activepieces | none (near-white icon failed the guard) | hand-sourced | svg wordmark (dark grey text + purple mark, lum 69) | GitHub repo `activepieces/activepieces`, `docs/resources/logo/light.svg` (the light-background variant). No press page exists: `/press`, `/brand`, `/media-kit`, `/logo` all 404. |
| profound | none (near-white icon failed the guard) | hand-sourced | svg isotype (black, lum 0) | `https://www.tryprofound.com/brand` -> `Profound-Brand-Assets.zip` -> `isotypes/isotype-dark.svg` |
| justcall | 45x44 png favicon | hand-sourced | svg black wordmark (#101828, lum 23) | JustCall's own marketing CDN, linked from the homepage header: `https://cdn.justcall.io/assets-marketing/images/svg/justcall-logo-black.svg`. `/press`, `/media-kit`, `/newsroom`, `/brand` all 404 on justcall.io and saaslabs.co; the App Store icon (512x512) is a solid tile that fails the opaque-corners gate. |

Every hand-sourced SVG was rasterized (sharp, 400px wide) and run through the same guard: all have transparent corners and mean visible luminance well under 215. SVGs were scanned for `<script>`, `<image>`, external `href` and `foreignObject`: none.

## Script changes

- `qa/auto-register-tools.mjs`: `--logo-for` gains `--replace`, which re-sources a tool that already has a logo, swaps the registry path, and deletes the old file if the extension changed. Without it, every bad old logo was "skipped: already has a logo". Nothing else in the sourcing path changed.
- `qa/lint-logos.mjs`: the guard's banner rule is now a HARD check in CI (same constants: 600px / 1.5). Verified: passes the fixed tree (74 rasters, 0 hard) and fires on the pre-fix `zapier.png` and `calendly.png` pulled from HEAD.
- `qa/audit-logos-retro.mjs` (new): re-derives this whole table. Not a gate (exit 0); `--json` for machine output, `--dir` to point at candidates.

## Not done / open

- The 5 pale marks (activecampaign, otter, customerio, lindy, voiceos) pass every existing rule. If they look faint on the cards, the fix is a rule, not a one-off; see the info column below.
- `maildoso`, `canva`, `cognism`, `leadmagic` still WARN on 2/4 or 3/4 opaque corners (pre-existing, unchanged).
- WarmForge has no logo now. If a real mark surfaces (the vendor would need to publish one), `--logo-for warmforge --url-hint warmforge=<url>` re-sources it.

## Full audit table, BEFORE any change (77 rasters + 19 SVGs, 10 FAIL)

Columns: dimensions, aspect, bytes, corner state, knockout result (only when all 4 corners are opaque), mean luminance of visible pixels (informational), verdict.

| file | WxH | aspect | bytes | corners | knockout kept / lum | visible lum (info) | verdict |
|---|---|---|---|---|---|---|---|
| 11x.png | 256x256 | 1 | 4186 | transparent |  | 166 | pass |
| activecampaign.png | 192x192 | 1 | 4415 | transparent |  | 243 | pass (info.pale-mark) |
| adcreative.png | 256x256 | 1 | 19975 | transparent |  | 117 | pass |
| aircall.png | 152x152 | 1 | 5849 | transparent |  | 168 | pass |
| aisdr.png | 192x192 | 1 | 3536 | transparent |  | 109 | pass |
| aloware.png | 256x256 | 1 | 8057 | transparent |  | 76 | pass |
| apollo.svg | svg |  | 596 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| appy-ai.png | 116x116 | 1 | 13799 | transparent |  | 70 | pass |
| artisan.png | 128x128 | 1 | 3057 | transparent |  | 100 | pass |
| attio.png | 32x32 | 1 | 1386 | transparent |  | 159 | pass |
| avoma.png | 256x256 | 1 | 25027 | transparent |  | 179 | pass |
| bardeen.svg | svg |  | 1668 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| beehiiv.png | 447x113 | 3.96 | 3420 | transparent |  | 11 | pass |
| bettercontact.png | 512x512 | 1 | 145060 | transparent |  | 125 | pass |
| bland-ai.png | 32x32 | 1 | 273 | transparent |  | 211 | pass |
| bouncer.svg | svg |  | 4161 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| brevo.png | 128x128 | 1 | 1416 | transparent |  | 55 | pass |
| cal-com.png | 288x60 | 4.8 | 4893 | transparent |  | 41 | pass |
| calendly.png | 661x160 | 4.13 | 27547 | transparent |  | 100 | FAIL guard.banner |
| canva.png | 180x180 | 1 | 37500 | transparent |  | 124 | pass (gate.corners 3/4) |
| chili-piper.png | 256x256 | 1 | 3793 | transparent |  | 123 | pass |
| circleback.png | 1024x1024 | 1 | 74213 | transparent |  | 111 | pass |
| clay.webp | 694x219 | 3.17 | 9028 | transparent |  | 85 | FAIL guard.banner |
| clearscope.png | 48x48 | 1 | 2676 | transparent |  | 143 | pass |
| close.png | 256x256 | 1 | 12882 | transparent |  | 150 | pass |
| cognism.png | 192x192 | 1 | 35186 | transparent |  | 124 | pass (gate.corners 3/4) |
| creatify.svg | svg |  | 727 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| customerio.png | 128x128 | 1 | 1364 | transparent |  | 232 | pass (info.pale-mark) |
| factors-ai.png | 256x256 | 1 | 4848 | transparent |  | 104 | pass |
| fathom.png | 192x192 | 1 | 3298 | transparent |  | 187 | pass |
| fillout.png | 960x504 | 1.9 | 39015 | transparent |  | 192 | FAIL guard.banner |
| findymail.png | 128x128 | 1 | 813 | transparent |  | 143 | pass |
| fireflies.png | 512x512 | 1 | 86298 | transparent |  | 93 | pass |
| folk.png | 512x512 | 1 | 47329 | transparent |  | 193 | pass |
| frase.png | 180x180 | 1 | 4649 | transparent |  | 187 | pass |
| fullenrich.png | 2400x1260 | 1.9 | 1101825 | transparent |  | 159 | FAIL guard.banner |
| getaccept.png | 317x305 | 1.04 | 2855 | transparent |  | 160 | pass |
| getresponse.png | 180x180 | 1 | 5524 | transparent |  | 153 | pass |
| gong.png | 180x180 | 1 | 8915 | transparent |  | 112 | pass |
| gumloop.png | 48x48 | 1 | 3078 | transparent |  | 138 | pass |
| hubspot.svg | svg |  | 678 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| instantly.webp | 300x67 | 4.48 | 5780 | transparent |  | 123 | pass |
| justcall.png | 45x44 | 1.02 | 1079 | transparent |  | 64 | pass |
| kit.svg | svg |  | 739 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| krispcall.png | 512x512 | 1 | 134063 | transparent |  | 135 | pass |
| laxis.svg | svg |  | 8186 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| leadmagic.png | 512x512 | 1 | 19154 | transparent |  | 120 | pass (gate.corners 2/4) |
| lemlist.svg | svg |  | 5524 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| lindy.png | 512x512 | 1 | 99415 | transparent |  | 231 | pass (info.pale-mark) |
| linkedin-sales-navigator.svg | svg |  | 840 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| loops.png | 281x281 | 1 | 3269 | transparent |  | 112 | pass |
| lusha.svg | svg |  | 3788 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| mailchimp.png | 180x180 | 1 | 3660 | transparent |  | 45 | pass |
| maildoso.png | 180x180 | 1 | 33086 | transparent |  | 149 | pass (gate.corners 3/4) |
| mailforge.png | 512x512 | 1 | 22601 | transparent |  | 208 | pass |
| mailreach.svg | svg |  | 2743 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| mailshake.png | 180x180 | 1 | 7190 | transparent |  | 108 | pass |
| make.svg | svg |  | 613 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| moltsets.svg | svg |  | 821 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| motion.svg | svg |  | 4431 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| n8n.svg | svg |  | 1588 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| nutshell.png | 497x548 | 0.91 | 234080 | transparent |  | 113 | pass |
| otter.png | 256x256 | 1 | 3331 | transparent |  | 242 | pass (info.pale-mark) |
| outreach.png | 256x256 | 1 | 4953 | transparent |  | 95 | pass |
| pabbly.svg | svg |  | 7953 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| pipedrive.svg | svg |  | 3958 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| prospeo.png | 200x200 | 1 | 15235 | transparent |  | 166 | pass |
| quickmail.png | 512x512 | 1 | 57997 | transparent |  | 209 | pass |
| qwilr.png | 180x180 | 1 | 3828 | transparent |  | 146 | pass |
| rb2b.png | 943x279 | 3.38 | 40233 | transparent |  | 20 | FAIL guard.banner |
| relevance-ai.webp | 224x40 | 5.6 | 3322 | transparent |  | 69 | pass |
| reply-io.webp | 400x120 | 3.33 | 7640 | transparent |  | 91 | pass |
| runable.png | 16x16 | 1 | 320 | transparent |  | 16 | pass |
| salesflare.png | 512x512 | 1 | 12719 | transparent |  | 78 | pass |
| salesforce.png | 1024x537 | 1.91 | 105913 | transparent |  | 134 | FAIL guard.banner |
| saleshandy.png | 1200x630 | 1.9 | 40778 | transparent |  | 82 | FAIL guard.banner |
| salesloft.png | 32x32 | 1 | 2182 | transparent |  | 189 | pass |
| smartlead.webp | 756x160 | 4.72 | 6310 | transparent |  | 86 | FAIL guard.banner |
| storydoc.png | 152x152 | 1 | 24991 | transparent |  | 64 | pass |
| surfe.png | 192x192 | 1 | 7659 | transparent |  | 60 | pass |
| surfer.png | 512x512 | 1 | 8407 | transparent |  | 125 | pass |
| synthflow.png | 256x256 | 1 | 37858 | transparent |  | 83 | pass |
| tally.svg | svg |  | 1027 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| taplio.png | 256x256 | 1 | 4035 | transparent |  | 109 | pass |
| tl-dv.png | 64x64 | 1 | 1474 | transparent |  | 69 | pass |
| trigify.svg | svg |  | 1165 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| vapi.png | 180x180 | 1 | 3418 | transparent |  | 37 | pass |
| vector.png | 256x256 | 1 | 15661 | transparent |  | 106 | pass |
| voiceos.png | 128x128 | 1 | 4541 | transparent |  | 222 | pass (info.pale-mark) |
| warmforge.png | 1200x630 | 1.9 | 180716 | transparent |  | 131 | FAIL guard.banner |
| warmly.png | 256x256 | 1 | 4844 | transparent |  | 95 | pass |
| watermelon.png | 180x180 | 1 | 5752 | transparent |  | 173 | pass |
| wispr-flow.png | 48x48 | 1 | 924 | transparent |  | 63 | pass |
| zapier.png | 1200x630 | 1.9 | 246640 | transparent |  | 166 | FAIL guard.banner |
| zerobounce.webp | 512x512 | 1 | 8296 | transparent |  | 207 | pass |
| zoominfo.png | 512x512 | 1 | 2801 | transparent |  | 90 | pass |

audit-logos-retro: 96 file(s), 77 raster, 19 svg; 10 raster FAIL, 11 raster with warnings/info.

## Full audit table, AFTER (74 rasters + 24 SVGs, 0 FAIL)

| file | WxH | aspect | bytes | corners | knockout kept / lum | visible lum (info) | verdict |
|---|---|---|---|---|---|---|---|
| 11x.png | 256x256 | 1 | 4186 | transparent |  | 166 | pass |
| activecampaign.png | 192x192 | 1 | 4415 | transparent |  | 243 | pass (info.pale-mark) |
| activepieces.svg | svg |  | 11728 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| adcreative.png | 256x256 | 1 | 19975 | transparent |  | 117 | pass |
| aircall.png | 152x152 | 1 | 5849 | transparent |  | 168 | pass |
| aisdr.png | 192x192 | 1 | 3536 | transparent |  | 109 | pass |
| aloware.png | 256x256 | 1 | 8057 | transparent |  | 76 | pass |
| apollo.svg | svg |  | 596 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| appy-ai.png | 116x116 | 1 | 13799 | transparent |  | 70 | pass |
| artisan.png | 128x128 | 1 | 3057 | transparent |  | 100 | pass |
| attio.png | 32x32 | 1 | 1386 | transparent |  | 159 | pass |
| avoma.png | 256x256 | 1 | 25027 | transparent |  | 179 | pass |
| bardeen.svg | svg |  | 1668 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| beehiiv.png | 447x113 | 3.96 | 3420 | transparent |  | 11 | pass |
| bettercontact.png | 512x512 | 1 | 145060 | transparent |  | 125 | pass |
| bland-ai.png | 32x32 | 1 | 273 | transparent |  | 211 | pass |
| bouncer.svg | svg |  | 4161 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| brevo.png | 128x128 | 1 | 1416 | transparent |  | 55 | pass |
| cal-com.png | 288x60 | 4.8 | 4893 | transparent |  | 41 | pass |
| calendly.png | 560x136 | 4.12 | 14611 | transparent |  | 99 | pass |
| canva.png | 180x180 | 1 | 37500 | transparent |  | 124 | pass (gate.corners 3/4) |
| chili-piper.png | 256x256 | 1 | 3793 | transparent |  | 123 | pass |
| circleback.png | 1024x1024 | 1 | 74213 | transparent |  | 111 | pass |
| clay.webp | 560x177 | 3.16 | 30660 | transparent |  | 84 | pass |
| clearscope.png | 48x48 | 1 | 2676 | transparent |  | 143 | pass |
| close.png | 256x256 | 1 | 12882 | transparent |  | 150 | pass |
| cognism.png | 192x192 | 1 | 35186 | transparent |  | 124 | pass (gate.corners 3/4) |
| creatify.svg | svg |  | 727 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| customerio.png | 128x128 | 1 | 1364 | transparent |  | 232 | pass (info.pale-mark) |
| factors-ai.png | 256x256 | 1 | 4848 | transparent |  | 104 | pass |
| fathom.png | 192x192 | 1 | 3298 | transparent |  | 187 | pass |
| fillout.png | 48x48 | 1 | 1549 | transparent |  | 190 | pass |
| findymail.png | 128x128 | 1 | 813 | transparent |  | 143 | pass |
| fireflies.png | 512x512 | 1 | 86298 | transparent |  | 93 | pass |
| folk.png | 512x512 | 1 | 47329 | transparent |  | 193 | pass |
| frase.png | 180x180 | 1 | 4649 | transparent |  | 187 | pass |
| fullenrich.svg | svg |  | 3513 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| getaccept.png | 317x305 | 1.04 | 2855 | transparent |  | 160 | pass |
| getresponse.png | 180x180 | 1 | 5524 | transparent |  | 153 | pass |
| gong.png | 180x180 | 1 | 8915 | transparent |  | 112 | pass |
| gumloop.png | 48x48 | 1 | 3078 | transparent |  | 138 | pass |
| hubspot.svg | svg |  | 678 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| instantly.webp | 300x67 | 4.48 | 5780 | transparent |  | 123 | pass |
| justcall.svg | svg |  | 3615 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| kit.svg | svg |  | 739 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| krispcall.png | 512x512 | 1 | 134063 | transparent |  | 135 | pass |
| laxis.svg | svg |  | 8186 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| leadmagic.png | 512x512 | 1 | 19154 | transparent |  | 120 | pass (gate.corners 2/4) |
| lemlist.svg | svg |  | 5524 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| lindy.png | 512x512 | 1 | 99415 | transparent |  | 231 | pass (info.pale-mark) |
| linkedin-sales-navigator.svg | svg |  | 840 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| loops.png | 281x281 | 1 | 3269 | transparent |  | 112 | pass |
| lusha.svg | svg |  | 3788 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| mailchimp.png | 180x180 | 1 | 3660 | transparent |  | 45 | pass |
| maildoso.png | 180x180 | 1 | 33086 | transparent |  | 149 | pass (gate.corners 3/4) |
| mailforge.png | 512x512 | 1 | 22601 | transparent |  | 208 | pass |
| mailreach.svg | svg |  | 2743 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| mailshake.png | 180x180 | 1 | 7190 | transparent |  | 108 | pass |
| make.svg | svg |  | 613 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| moltsets.svg | svg |  | 821 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| motion.svg | svg |  | 4431 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| n8n.svg | svg |  | 1588 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| nutshell.png | 497x548 | 0.91 | 234080 | transparent |  | 113 | pass |
| otter.png | 256x256 | 1 | 3331 | transparent |  | 242 | pass (info.pale-mark) |
| outreach.png | 256x256 | 1 | 4953 | transparent |  | 95 | pass |
| pabbly.svg | svg |  | 7953 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| pandadoc.svg | svg |  | 5139 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| pipedrive.svg | svg |  | 3958 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| profound.svg | svg |  | 949 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| prospeo.png | 200x200 | 1 | 15235 | transparent |  | 166 | pass |
| quickmail.png | 512x512 | 1 | 57997 | transparent |  | 209 | pass |
| qwilr.png | 180x180 | 1 | 3828 | transparent |  | 146 | pass |
| rb2b.png | 560x166 | 3.37 | 17945 | transparent |  | 20 | pass |
| relevance-ai.webp | 224x40 | 5.6 | 3322 | transparent |  | 69 | pass |
| reply-io.webp | 400x120 | 3.33 | 7640 | transparent |  | 91 | pass |
| runable.png | 16x16 | 1 | 320 | transparent |  | 16 | pass |
| salesflare.png | 512x512 | 1 | 12719 | transparent |  | 78 | pass |
| salesforce.png | 560x294 | 1.9 | 35600 | transparent |  | 138 | pass |
| saleshandy.png | 128x128 | 1 | 905 | transparent |  | 78 | pass |
| salesloft.png | 32x32 | 1 | 2182 | transparent |  | 189 | pass |
| smartlead.webp | 560x119 | 4.71 | 16288 | transparent |  | 84 | pass |
| storydoc.png | 152x152 | 1 | 24991 | transparent |  | 64 | pass |
| surfe.png | 192x192 | 1 | 7659 | transparent |  | 60 | pass |
| surfer.png | 512x512 | 1 | 8407 | transparent |  | 125 | pass |
| synthflow.png | 256x256 | 1 | 37858 | transparent |  | 83 | pass |
| tally.svg | svg |  | 1027 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| taplio.png | 256x256 | 1 | 4035 | transparent |  | 109 | pass |
| tl-dv.png | 64x64 | 1 | 1474 | transparent |  | 69 | pass |
| trigify.svg | svg |  | 1165 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| vapi.png | 180x180 | 1 | 3418 | transparent |  | 37 | pass |
| vector.png | 256x256 | 1 | 15661 | transparent |  | 106 | pass |
| voiceos.png | 128x128 | 1 | 4541 | transparent |  | 222 | pass (info.pale-mark) |
| warmly.png | 256x256 | 1 | 4844 | transparent |  | 95 | pass |
| watermelon.png | 180x180 | 1 | 5752 | transparent |  | 173 | pass |
| wispr-flow.png | 48x48 | 1 | 924 | transparent |  | 63 | pass |
| zapier.svg | svg |  | 5066 |  |  |  | pass (skipped (vector; neither guard nor gate inspects SVG)) |
| zerobounce.webp | 512x512 | 1 | 8296 | transparent |  | 207 | pass |
| zoominfo.png | 512x512 | 1 | 2801 | transparent |  | 90 | pass |

audit-logos-retro: 98 file(s), 73 raster, 25 svg; 0 raster FAIL, 9 raster with warnings/info.

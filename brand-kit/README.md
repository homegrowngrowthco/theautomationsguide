# The Automations Guide — Brand & Design Kit

Everything you need to update the website and run the newsletter. Open **`design-system.html`** in a browser for the living style guide (logo, color, type, components, templates, tokens).

## What's here

```
design-system.html         The living style guide — start here
brand/
  tokens.css               Design tokens — paste into your site's global.css
  logos/
    wordmark-primary.svg   Logo, dark text on light (site header)
    wordmark-reversed.svg  Logo, light on dark (dark site / footer)
    wordmark-onecolor.svg  Logo, all-white + black dot (sponsor / merch)
  avatars/
    square-dark.svg        X / podcast profile (dark)
    square-light.svg       LinkedIn profile (light)
    circle-dark.svg        Pre-cropped circle (dark)
    circle-light.svg       Pre-cropped circle (light)
    circle-white.svg       Pre-cropped circle (white)
    circle-teal.svg        Accent circle (teal / merch)
    square-wordmark-dark.svg  1200×1200 social card
beehiiv/
  daily.html               Inbox-safe Daily template — import to Beehiiv
  weekly.html              Inbox-safe Weekly template — import to Beehiiv
  README.md                Beehiiv import guide
newsletters/
  daily.html               Design-fidelity Daily preview (web fonts)
  weekly.html              Design-fidelity Weekly preview (web fonts)
social/
  twitter-card.html        1200×675 share card
  linkedin-quote.html      1200×1200 quote graphic
  post-promo.html          1200×1200 post promo
  x-banner.html            1500×500 profile banner
```

## Updating the website

1. **Colors & type** — open `brand/tokens.css`, copy the `:root` + light/dark blocks into your `src/styles/global.css`, replacing the old token block. The site keeps its dark theme; the teal just shifts from `#2dd4bf` → `#14a890` (brand) / `#1ec3a4` (dark-mode accent).
2. **Logo** — drop `brand/logos/wordmark-reversed.svg` into the nav (dark site). Use `wordmark-primary.svg` anywhere on light backgrounds.
3. **Favicon** — export `brand/avatars/square-dark.svg` to PNG, or use it directly as `favicon.svg`.
4. **Fonts** — the wordmark uses **Outfit** (Google Fonts). Body/UI = Inter, headlines = Source Serif 4, code/labels = JetBrains Mono. All free on Google Fonts.

## Exporting avatars to PNG

SVGs are vector and infinite-scale. To upload to X / LinkedIn:
open any `brand/avatars/*.svg` in Figma / Illustrator / Preview → export PNG at **1024×1024** (or 400×400 for older platforms).

## Logo rules

- The wordmark is the logo. Don't add an abstract mark.
- **Automations** stays the dominant word; "The" and "Guide" stay small and quiet.
- The period is teal (`#0d8c78` on light, `#1ec3a4` on dark) — except the all-white one-color lockup, where it's black to pop.
- "Guide" sits under "Automations" right-aligned to end beneath the period in stacked lockups.
- Don't recolor the wordmark outside the provided variants.

## Fonts (all free, Google Fonts)

| Role | Family | Weights |
|---|---|---|
| Wordmark | Outfit | 500, 800 |
| Headlines | Source Serif 4 | 600 |
| Body / UI | Inter | 400, 500, 600, 700 |
| Labels / code | JetBrains Mono | 500 |

— Brand kit v2.2 · last updated May 29, 2026

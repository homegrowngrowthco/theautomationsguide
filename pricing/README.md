# pricing/

Builds the dataset behind **[/revops-automation-pricing/](../src/pages/revops-automation-pricing.astro)**, the site's
linkable asset: a maintained, cited price index for RevOps and GTM automation tooling.

The asset's entire value is that every figure traces to a vendor's own pricing page on a
stated date. So the design rule that outranks everything else is: **never guess.** A figure
that is not literally present in the page just fetched is recorded as `null` with a reason.
It is never inferred, never carried over from the previous run, and never filled in from the
model's own memory of the brand. A blank cell on the published page means "we could not
verify this", and the page says so in those words.

## Usage

```sh
node pricing/build-pricing-index.mjs --selftest              # offline extractor regression
node pricing/build-pricing-index.mjs --only zapier,clay      # dry run a couple of tools
node pricing/build-pricing-index.mjs                         # dry run everything
node pricing/build-pricing-index.mjs --apply                 # write the dataset
```

Flags: `--only <slugs>`, `--limit <n>`, `--concurrency <n>` (default 4),
`--model <id>` (default `claude-sonnet-5`).

Writes two copies of the same payload:

| Path | Purpose |
|---|---|
| `src/data/pricing-index.json` | what the Astro page imports |
| `public/data/revops-pricing-index.json` | stable public download URL, CC BY 4.0 |

Both are committed. The page renders a reviewable file rather than scraping at build time,
so a bad extraction shows up in a diff before it ships.

Needs `ANTHROPIC_API_KEY` (in the repo-root `.env`) for extraction. `--selftest` needs
nothing and hits no network, so CI can gate on it.

## Pipeline

1. **discover** — fetch the vendor homepage and look for a real link to a pricing page,
   preferring that over guessed paths like `/pricing`.
2. **fetch** — pull the pricing page with a browser-shaped header set.
3. **reduce** — flatten to visible text *plus* a digest of the page's embedded JSON.
4. **extract** — Claude reads only that text and returns strict JSON.
5. **validate** — every extracted price is re-checked against the source text; anything not
   found there is nulled and flagged.
6. **self-test** — 13 fixtures run before any live work; a failure aborts the run.

## Row statuses

| Status | Meaning |
|---|---|
| `ok` | pricing page read and parsed |
| `not-machine-readable` | page reachable, but its prices are not in the served response (client-side rendered) |
| `blocked` | vendor refuses automated requests (403/429 on every candidate URL) |
| `unreachable` | no candidate URL responded |
| `skipped` | no homepage in `affiliate-links.ts` |
| `error` | fetch or extraction threw |

Only `ok` rows appear in the main table. Everything else is listed on the page by name and
reason, because *which* tools are missing is itself information.

Each `ok` row also carries `extraction`: `automated` (scraped) or `assisted` (see below).

## manual-overrides.json

Some vendors block automated fetching outright. `make.com` returns 403 to every header
combination tried (self-identifying UA, browser UA, `Accept`, `Sec-Fetch-*`), because the
block keys on TLS/connection fingerprint rather than headers, so no header tweak will fix it.

Those rows are filled from `pricing/manual-overrides.json`: the same fields, read by hand
from the same vendor page, carrying the same `sourceUrl`. They render with a "read manually"
marker and are tagged `extraction: "assisted"` in the data. Kept in a separate file on
purpose, so a hand-entered figure can never be mistaken for a scraped one, and so the
builder stays the only thing that writes `pricing-index.json`.

Shape:

```json
{
  "tools": {
    "make": {
      "sourceUrl": "https://www.make.com/en/pricing",
      "currency": "USD",
      "hasFreeTier": true,
      "freeTierLimit": "1,000 operations/mo",
      "entryPaidPlan": { "name": "Core", "monthlyBilledMonthly": 12, "monthlyBilledAnnually": null, "unitIncluded": "10,000 operations/mo" },
      "pricingUnit": "credits",
      "enterpriseIsQuoteOnly": true,
      "notes": "Annual prices shown only after toggling billing period."
    }
  }
}
```

## Things learned the hard way

Each of these produced a confidently wrong or empty result first, and each is now locked
behind a self-test fixture:

1. **Stripping `<script>` destroys the data.** n8n's pricing page contains zero currency
   symbols in its markup and carries every number in a 115KB JSON blob; Tally is the same via
   `__NEXT_DATA__`. Reading only visible markup and reporting "no prices found" is a claim
   about the extractor disguised as a claim about the vendor.
2. **A price signal does not require a currency symbol.** schema.org `Offer` keeps the number
   and the currency in separate fields (`"price":"29","priceCurrency":"USD"`), so a
   symbol-adjacent-digit test wrote off Brevo, a page carrying 1,115 currency symbols and a
   full Offer list.
3. **Sibling context has to be bounded.** Emitting every scalar on any object containing a
   price keeps `name: Starter` attached to `priceMonthly: 24`, which is necessary, but applied
   to a 900-key i18n dictionary it ate the whole extraction budget with nav labels. Now capped
   at objects of 25 scalars or fewer, with candidate lines scored so money survives truncation.
4. **`max_tokens` was the cause of "no JSON object in model output".** The model spends part
   of the budget on thinking blocks, so at 1,200 tokens the JSON came back truncated, and the
   parse error pointed at an empty string. Now 4,000, and truncation is detected and named.
5. **`temperature` is rejected outright** by the current models (HTTP 400,
   "`temperature` is deprecated for this model").
6. **Under-extraction is the acceptable failure.** Zapier's entry price, free tier and Team
   price all extract correctly; its monthly-billed-monthly figure does not, and comes back
   `null` rather than approximated. That is the trade this whole script is built around.

## Refresh cadence

Vendors change pricing without notice, so the read date on each row is an expiry stamp.
Rebuild quarterly, and diff before committing: a large swing in one row is far more likely
to be an extraction regression than a real price change.

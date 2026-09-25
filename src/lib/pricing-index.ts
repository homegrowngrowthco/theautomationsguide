// Shared reader for src/data/pricing-index.json (built by pricing/build-pricing-index.mjs).
// Rule of the index: a figure absent from the vendor's page is null. Nothing here
// fills a gap; callers render null as "not stated" or omit it.
import index from '../data/pricing-index.json';

export type PricingPlan = {
  name?: string | null;
  monthlyBilledMonthly?: number | null;
  monthlyBilledAnnually?: number | null;
  unitIncluded?: string | null;
};
export type PricingRow = {
  slug: string;
  name: string;
  category: string;
  status: string;
  sourceUrl?: string;
  currency?: string | null;
  hasFreeTier?: boolean | null;
  freeTierLimit?: string | null;
  entryPaidPlan?: PricingPlan | null;
  pricingUnit?: string | null;
};

const data = index as unknown as {
  generatedAt: string;
  counts: Record<string, number>;
  tools: PricingRow[];
};

export const pricingReadDate: string = data.generatedAt;
export const pricingTotalVendors: number = Object.values(data.counts).reduce((a, b) => a + b, 0);
export const pricingPricedCount: number = data.counts.ok ?? 0;

const bySlug = new Map(data.tools.map((r) => [r.slug, r]));

/** The row for a tool, only when its status is 'ok'; otherwise undefined. */
export function pricedRow(slug: string): PricingRow | undefined {
  const r = bySlug.get(slug);
  return r && r.status === 'ok' ? r : undefined;
}

export function money(n: number | null | undefined, cur: string | null | undefined): string | null {
  if (n == null) return null;
  const sym = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$';
  return `${sym}${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

// Which tools a post compares, for the tools panel under the post title band
// (design program 2026-10; was inline in ToolStrip.astro, conversion audit F3/R7).
// Shared so BlogPostLayout knows before render whether the panel shows (the
// title band only "lifts" when it does).
//
// Tools come only from the post itself: the tools its "X vs Y" headline names,
// then the affiliateSlug values in its ComparisonTable/ToolBreakdown/ChooseIf/
// IntentTable blocks, in first-seen order. A tagline or a pick appears only when
// the post's own ComparisonTable states one; nothing is inferred or invented.
import { tools } from '../data/tools';
import { affiliateLinks } from '../data/affiliate-links';
import { pricedRow, money } from './pricing-index';

export interface ComparedTool {
  /** The /go/ slug (may be a deep-link variant such as instantly-vip). */
  slug: string;
  /** Registry tool slug (variants collapse to their parent). */
  key: string;
  name: string;
  logo?: string;
  /** Affiliate program status from the registry ('live', 'pending', ...). */
  status: string;
  /** "Best for ..." line, only from the post's own ComparisonTable. */
  tagline?: string;
  /** true only when the post's ComparisonTable marks this tool `highlight: true`. */
  pick: boolean;
  /** Entry price from the pricing index, when the index has one. */
  price?: { amount: string; plan?: string | null; note: string };
}

// "Otter" in a headline is the tool registered as "Otter.ai".
const nameVariants = (n: string) => [n, n.replace(/\.(ai|io|com|app|so)$/i, '')];

// Deep-link variants (e.g. instantly-vip) keep their own /go/ slug but display the
// parent tool's name + logo from the registry.
const toolFor = (slug: string) =>
  tools.find((t) => t.slug === slug) ||
  tools.filter((t) => slug.startsWith(t.slug + '-')).sort((a, b) => b.slug.length - a.slug.length)[0];

/** tagline + highlight per affiliateSlug, from the post's ComparisonTable blocks. */
function comparisonTableFacts(body: string): Map<string, { tagline?: string; pick: boolean }> {
  const out = new Map<string, { tagline?: string; pick: boolean }>();
  const blocks = body.match(/<ComparisonTable\b[\s\S]*?\/>/g) || [];
  for (const blk of blocks) {
    // Each tool object starts at a `name:` key; quote-agnostic (registry-parser bug class).
    const chunks = blk.split(/\n\s*\{\s*(?=name\s*:)/).slice(1);
    for (const ch of chunks) {
      const slug = ch.match(/affiliateSlug\s*:\s*["']([a-z0-9-]+)["']/)?.[1];
      if (!slug) continue;
      const tagline = ch.match(/tagline\s*:\s*"([^"]+)"/)?.[1] ?? ch.match(/tagline\s*:\s*'([^']+)'/)?.[1];
      const pick = /highlight\s*:\s*true/.test(ch);
      if (!out.has(slug)) out.set(slug, { tagline, pick });
    }
  }
  return out;
}

function priceFor(key: string): ComparedTool['price'] {
  const r = pricedRow(key);
  const p = r?.entryPaidPlan;
  if (!r || !p) return undefined;
  const annual = money(p.monthlyBilledAnnually, r.currency);
  const monthly = money(p.monthlyBilledMonthly, r.currency);
  if (annual) return { amount: annual, plan: p.name, note: monthly ? `billed annually (${monthly} monthly)` : 'billed annually' };
  if (monthly) return { amount: monthly, plan: p.name, note: 'billed monthly' };
  return undefined;
}

export function toolsCompared(body: string, title: string): ComparedTool[] {
  // On an "X vs Y" headline, the tools it names come first, in headline order. Only
  // the START of each vs-segment is matched (longest name wins), so title words like
  // "Close more deals" never pull in a tool. A lead-in before a colon
  // ("RB2B Alternatives: RB2B vs Warmly") is not a contender.
  const vsPart = (() => {
    const i = title.search(/\svs\.?\s/i);
    if (i < 0) return '';
    const colon = title.lastIndexOf(':', i);
    return colon >= 0 ? title.slice(colon + 1) : title;
  })();
  const segments = vsPart ? vsPart.split(/\s+vs\.?\s+/i).map((s) => s.trim()) : [];
  const titleTools: string[] = [];
  let unresolvedHeadlineTool = false;
  for (const seg of segments) {
    const hit = tools
      .flatMap((t) => [t.name, ...t.aliases].flatMap(nameVariants).map((n) => ({ slug: t.slug, n })))
      .filter(({ n }) => seg.startsWith(n) && !/[A-Za-z0-9]/.test(seg.charAt(n.length)))
      .sort((a, b) => b.n.length - a.n.length)[0];
    if (hit && affiliateLinks[hit.slug]) { if (!titleTools.includes(hit.slug)) titleTools.push(hit.slug); }
    else unresolvedHeadlineTool = true;
  }
  // A vs-headline naming a tool we can't show (e.g. Substack, no registry entry) gets
  // no panel at all rather than a partial one that silently drops a contender.
  if (unresolvedHeadlineTool) return [];

  const blocks = body.match(/<(ComparisonTable|ToolBreakdown|ChooseIf|IntentTable)\b[\s\S]*?\/>/g) || [];
  const slugs: string[] = [...titleTools];
  for (const blk of blocks) {
    for (const m of blk.matchAll(/affiliateSlug:\s*["']([a-z0-9-]+)["']/g)) {
      if (!slugs.includes(m[1]) && affiliateLinks[m[1]]) slugs.push(m[1]);
    }
  }

  const facts = comparisonTableFacts(body);
  // One entry per tool, in first-seen order; a later deep-link slug for the same tool
  // replaces the plain one (it is the page-specific link).
  const items: ComparedTool[] = [];
  for (const slug of slugs) {
    const tool = toolFor(slug);
    const key = tool?.slug ?? slug;
    const f = facts.get(slug) ?? facts.get(key);
    const it: ComparedTool = {
      slug, key,
      name: tool?.name ?? affiliateLinks[slug].name,
      logo: tool?.logo,
      status: affiliateLinks[slug]?.status ?? 'no-program',
      tagline: f?.tagline,
      pick: !!f?.pick,
      price: priceFor(key),
    };
    const prev = items.find((x) => x.key === it.key);
    if (!prev) items.push(it);
    else {
      if (prev.slug === prev.key && it.slug !== it.key) { prev.slug = it.slug; prev.status = it.status; }
      prev.tagline ??= it.tagline;
      prev.pick ||= it.pick;
    }
  }
  items.splice(4);
  // At most one pick: if a post highlights several, show none rather than guess.
  if (items.filter((x) => x.pick).length > 1) items.forEach((x) => (x.pick = false));
  return items.length >= 2 ? items : [];
}

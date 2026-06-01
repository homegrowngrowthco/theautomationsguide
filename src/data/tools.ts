// Central registry of the tools we feature, used by:
//   - /tools           (the index, grouped by category)
//   - /tools/<slug>     (per-tool hub page: intro + CTA + every article mentioning it)
//
// Each tool's `slug` matches its key in affiliate-links.ts, so the CTA routes
// through /go/<slug> for click tracking + affiliate resolution.

export interface Tool {
  /** Matches the affiliate-links.ts key and the /go/<slug> redirect. */
  slug: string;
  name: string;
  category: string;
  /** Short badge text shown on the card. */
  badge: string;
  /** True if the badge should use the teal "free" styling. */
  badgeFree?: boolean;
  /** One-paragraph description, shown on both the index card and the hub page. */
  blurb: string;
  /** CTA verb, e.g. "Try Make" / "Explore n8n". Arrow is appended in the template. */
  ctaLabel: string;
  /** True = primary (teal) button, false = ghost button. */
  ctaPrimary?: boolean;
  /**
   * Public path to the tool's full-color brand logo SVG, e.g. '/brand/tools/make.svg'.
   * Optional: when unset, the card and logo strip fall back to a styled text wordmark.
   */
  logo?: string;
  /** Strings to look for when deciding which posts "mention" this tool. */
  aliases: string[];
}

/** Render order for category sections on the /tools index. */
export const toolCategories = [
  'Workflow Automation',
  'CRM',
  'Outbound & Lead Generation',
  'Newsletter Platform',
];

export const tools: Tool[] = [
  {
    slug: 'make',
    name: 'Make',
    category: 'Workflow Automation',
    badge: 'Free tier available',
    badgeFree: true,
    blurb:
      'Make (formerly Integromat) is the best-in-class automation platform for RevOps teams that need complex logic, data transformation, and multi-path workflows. More powerful than Zapier at a fraction of the cost, with a visual canvas that makes it easy to reason about even the most complex flows.',
    ctaLabel: 'Try Make',
    ctaPrimary: true,
    logo: '/brand/tools/make.svg',
    aliases: ['Make', 'Integromat'],
  },
  {
    slug: 'n8n',
    name: 'n8n',
    category: 'Workflow Automation',
    badge: 'Free (self-hosted) or Cloud',
    badgeFree: true,
    blurb:
      "n8n is an open-source workflow automation tool you can self-host for full data control and no per-operation pricing. It's ideal for engineering-forward GTM teams that want Make-level power without ongoing platform costs, or a managed cloud option.",
    ctaLabel: 'Explore n8n',
    ctaPrimary: false,
    logo: '/brand/tools/n8n.svg',
    aliases: ['n8n'],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    badge: 'Free tier available',
    badgeFree: true,
    blurb:
      'HubSpot is the CRM at the center of most modern GTM stacks, with built-in workflow automation that handles lead routing, deal stage triggers, and sequences out of the box. The free tier is genuinely useful; paid tiers unlock the automation depth RevOps teams actually need.',
    ctaLabel: 'Try HubSpot',
    ctaPrimary: true,
    logo: '/brand/tools/hubspot.svg',
    aliases: ['HubSpot'],
  },
  {
    slug: 'pipedrive',
    name: 'Pipedrive',
    category: 'CRM',
    badge: '14-day free trial',
    badgeFree: true,
    blurb:
      "Pipedrive is the CRM HubSpot-skeptics pick. Lighter, sales-pipeline-first, with cleaner pricing at scale. Strong fit for SMB GTM teams that find HubSpot's free tier limiting but its paid tiers overpriced for what they actually use.",
    ctaLabel: 'Try Pipedrive',
    ctaPrimary: false,
    logo: '/brand/tools/pipedrive.svg',
    aliases: ['Pipedrive'],
  },
  {
    slug: 'clay',
    name: 'Clay',
    category: 'Outbound & Lead Generation',
    badge: 'Paid',
    blurb:
      "Clay combines a spreadsheet interface with 50+ enrichment data sources to help you build targeted, personalized outbound lists at scale. If your SDR team is manually researching accounts, Clay is the highest-leverage tool you're probably not using yet.",
    ctaLabel: 'Try Clay',
    ctaPrimary: true,
    logo: '/brand/tools/clay.webp',
    aliases: ['Clay'],
  },
  {
    slug: 'apollo',
    name: 'Apollo.io',
    category: 'Outbound & Lead Generation',
    badge: 'Free tier available',
    badgeFree: true,
    blurb:
      'Apollo combines a 275M+ contact database with built-in email sequencing, making it a one-stop shop for outbound GTM teams. The enrichment API also integrates cleanly with HubSpot for keeping CRM data current without manual data entry.',
    ctaLabel: 'Try Apollo',
    ctaPrimary: false,
    logo: '/brand/tools/apollo.svg',
    aliases: ['Apollo'],
  },
  {
    slug: 'smartlead',
    name: 'Smartlead',
    category: 'Outbound & Lead Generation',
    badge: 'Paid',
    blurb:
      "Smartlead is the cold email infrastructure RevOps teams actually use at scale: unlimited inboxes, built-in warmup, and pricing that doesn't punish you for sending volume. The right tool when you've outgrown Apollo's sequencer or Lemlist's caps.",
    ctaLabel: 'Try Smartlead',
    ctaPrimary: false,
    logo: '/brand/tools/smartlead.webp',
    aliases: ['Smartlead'],
  },
  {
    slug: 'beehiiv',
    name: 'Beehiiv',
    category: 'Newsletter Platform',
    badge: 'Free up to 2,500 subs',
    badgeFree: true,
    blurb:
      "Beehiiv is the newsletter platform built specifically for serious publishers, with a strong free tier, native referral programs, paid subscriptions, and built-in monetization via Boosts. We use it to publish The Automations Guide; it's the tool we'd pick again.",
    ctaLabel: 'Try Beehiiv',
    ctaPrimary: true,
    logo: '/brand/tools/beehiiv.png',
    aliases: ['Beehiiv'],
  },
  {
    slug: 'kit',
    name: 'Kit',
    category: 'Newsletter Platform',
    badge: 'Free up to 10,000 subs',
    badgeFree: true,
    blurb:
      'Kit (formerly ConvertKit) is the creator-first email platform built around automation, with visual sequence builders, tag-based segmentation, and a clean API that plays well with n8n and Make. A strong pick when your newsletter is part of a larger automated GTM motion rather than a standalone broadcast.',
    ctaLabel: 'Try Kit',
    ctaPrimary: false,
    logo: '/brand/tools/kit.svg',
    aliases: ['Kit', 'ConvertKit'],
  },
];

// Common English words that double as brand names — for these, a bare body
// mention isn't enough signal, so we require the capitalized form to appear at
// least twice (a passing "Make sure..." won't repeat as a standalone "Make").
const AMBIGUOUS = new Set(['Make', 'Clay', 'Kit', 'Guide']);

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type PostLike = {
  data: { title: string; tags?: string[] };
  body?: string;
};

/**
 * Whether a post genuinely mentions a tool. High precision over recall:
 *   - tag match (normalized)        — strongest signal
 *   - title word-boundary match     — case-insensitive
 *   - body match                    — case-insensitive for distinctive names;
 *                                      for ambiguous names, case-sensitive and ≥2 hits
 */
export function postMentionsTool(tool: Tool, post: PostLike): boolean {
  const tags = (post.data.tags ?? []).map(normalize);
  const title = post.data.title ?? '';
  const body = post.body ?? '';

  return tool.aliases.some((alias) => {
    const na = normalize(alias);
    if (tags.includes(na)) return true;
    if (new RegExp(`\\b${escapeRe(alias)}\\b`, 'i').test(title)) return true;

    if (AMBIGUOUS.has(alias)) {
      const hits = body.match(new RegExp(`\\b${escapeRe(alias)}\\b`, 'g'));
      return (hits?.length ?? 0) >= 2;
    }
    return new RegExp(`\\b${escapeRe(alias)}\\b`, 'i').test(body);
  });
}

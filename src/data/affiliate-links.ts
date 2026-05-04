// Central registry of affiliate links.
//
// USAGE:
//   - In any post or component, link to `/go/<slug>` instead of the raw affiliate URL.
//   - Update the `url` field here once you have your real affiliate link from each program.
//   - Until a program is approved, leave `url` as PENDING — the redirect page will route to
//     the tool's homepage with a UTM tag, so links still work.
//
// The /go/ redirect page fires a PostHog `affiliate_click` event before redirecting, so you
// get click counts per tool without depending on each affiliate platform's dashboard.

export interface AffiliateLink {
  /** Display name for the tool (used in /go/ page title) */
  name: string;
  /** Real affiliate URL once approved. Until then, set to '' and we'll fall back to homepageFallback */
  url: string;
  /** Tool homepage to fall back to until the affiliate link is approved */
  homepageFallback: string;
  /** Status of the affiliate program application */
  status: 'live' | 'applied' | 'pending' | 'no-program';
  /** Notes — commission rate, application date, etc. */
  notes?: string;
}

export const affiliateLinks: Record<string, AffiliateLink> = {
  hubspot: {
    name: 'HubSpot',
    url: '',
    homepageFallback: 'https://www.hubspot.com/',
    status: 'pending',
    notes: '30% recurring 12mo + welcome bonus. Email-based application.',
  },
  make: {
    name: 'Make',
    url: '',
    homepageFallback: 'https://www.make.com/',
    status: 'pending',
    notes: '35% for 12 months. Self-service via Make dashboard.',
  },
  n8n: {
    name: 'n8n',
    url: '',
    homepageFallback: 'https://n8n.io/',
    status: 'pending',
    notes: '30% for 12 months via PartnerStack. No paid ads allowed.',
  },
  apollo: {
    name: 'Apollo.io',
    url: '',
    homepageFallback: 'https://www.apollo.io/',
    status: 'pending',
    notes: '15% monthly / 20% annual for 12 months via PartnerStack.',
  },
  clay: {
    name: 'Clay',
    url: '',
    homepageFallback: 'https://www.clay.com/',
    status: 'pending',
    notes: '$50 one-time per Pro customer via Rewardful.',
  },
  beehiiv: {
    name: 'Beehiiv',
    url: '',
    homepageFallback: 'https://www.beehiiv.com/',
    status: 'pending',
    notes: '50-60% recurring (tiered) for 12 months.',
  },
  smartlead: {
    name: 'Smartlead',
    url: '',
    homepageFallback: 'https://www.smartlead.ai/',
    status: 'pending',
    notes: '15-35% recurring (tiered by volume).',
  },
  pipedrive: {
    name: 'Pipedrive',
    url: '',
    homepageFallback: 'https://www.pipedrive.com/',
    status: 'pending',
    notes: '20-30% recurring (tiered) for 12 months via PartnerStack.',
  },
  lemlist: {
    name: 'Lemlist',
    url: '',
    homepageFallback: 'https://lemlist.com/',
    status: 'pending',
    notes: 'Recurring on subscription, % varies.',
  },
  kit: {
    name: 'Kit',
    url: '',
    homepageFallback: 'https://kit.com/',
    status: 'pending',
    notes: '50% for 12 months via PartnerStack. Newsletter alt to Beehiiv.',
  },
};

/**
 * Resolve which URL to send a visitor to.
 * - If the affiliate link is live, use it.
 * - Otherwise, fall back to the tool homepage with a tag so we can still track inbound traffic
 *   on their analytics if they look.
 */
export function resolveDestination(slug: string): { url: string; isAffiliate: boolean } | null {
  const link = affiliateLinks[slug];
  if (!link) return null;
  if (link.url) return { url: link.url, isAffiliate: true };
  const sep = link.homepageFallback.includes('?') ? '&' : '?';
  return {
    url: `${link.homepageFallback}${sep}utm_source=theautomationsguide&utm_medium=referral`,
    isAffiliate: false,
  };
}

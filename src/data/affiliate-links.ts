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
  status: 'live' | 'applied' | 'pending' | 'rejected' | 'no-program';
  /** Notes — commission rate, application date, etc. */
  notes?: string;
}

export const affiliateLinks: Record<string, AffiliateLink> = {
  hubspot: {
    name: 'HubSpot',
    url: '',
    homepageFallback: 'https://www.hubspot.com/',
    status: 'rejected',
    notes: 'Rejected 2026-05-12 — likely traffic-related. Re-apply once monthly traffic builds (target ~1K visits/mo). Falls back to homepage + UTM tag in the meantime.',
  },
  make: {
    name: 'Make',
    url: 'https://www.make.com/en/register?pc=automationsguide',
    homepageFallback: 'https://www.make.com/',
    status: 'live',
    notes: '35% for 12 months. Approved 2026-05-12. Direct Make partner program (partner code `automationsguide`).',
  },
  n8n: {
    name: 'n8n',
    url: '',
    homepageFallback: 'https://n8n.io/',
    status: 'rejected',
    notes: 'Rejected 2026-05-12 — likely traffic-related. Re-apply once monthly traffic builds. Falls back to homepage + UTM tag in the meantime.',
  },
  apollo: {
    name: 'Apollo.io',
    url: 'https://get.apollo.io/k7n9run0vl50',
    homepageFallback: 'https://www.apollo.io/',
    status: 'live',
    notes: '15% monthly / 20% annual for 12 months via PartnerStack. Approved 2026-05-12.',
  },
  clay: {
    name: 'Clay',
    url: 'https://me.sh/?via=theautomationsguide',
    homepageFallback: 'https://www.clay.com/',
    status: 'live',
    notes: '$50 one-time per Pro customer via Rewardful. Approved 2026-05-12.',
  },
  beehiiv: {
    name: 'Beehiiv',
    url: 'https://www.beehiiv.com/?via=the-automations-guide',
    homepageFallback: 'https://www.beehiiv.com/',
    status: 'live',
    notes: '50-60% recurring (tiered) for 12 months. Approved 2026-05-12.',
  },
  smartlead: {
    name: 'Smartlead',
    url: 'https://smartlead.ai/?via=theautomationsguide',
    homepageFallback: 'https://www.smartlead.ai/',
    status: 'live',
    notes: '15-35% recurring (tiered by volume). Approved 2026-05-12.',
  },
  pipedrive: {
    name: 'Pipedrive',
    url: '',
    homepageFallback: 'https://www.pipedrive.com/',
    status: 'pending',
    notes: '20-30% recurring (tiered) for 12 months via PartnerStack. Gated behind PartnerStack Network approval (pending 2026-05-12).',
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
    url: 'https://partners.kit.com/nt9zrjmnck9y',
    homepageFallback: 'https://kit.com/',
    status: 'live',
    notes: '50% for 12 months via PartnerStack. Approved 2026-05-12.',
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

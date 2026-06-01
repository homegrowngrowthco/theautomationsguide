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
  substack: {
    name: 'Substack',
    url: '',
    homepageFallback: 'https://substack.com/',
    status: 'no-program',
    notes: 'No affiliate program available. Falls back to homepage + UTM tag so /go/substack still routes correctly.',
  },

  // --- Affiliate pipeline (Session 17). status:'pending' = identified + intended, not yet applied.
  // Each /go/<slug> falls back to the homepage + UTM until the real link is pasted into `url`.
  // Commission/platform notes are from June-2026 research; verify exact terms on application.
  instantly: {
    name: 'Instantly',
    url: '',
    homepageFallback: 'https://instantly.ai/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program available; verify commission + platform on application.',
  },
  aisdr: {
    name: 'AiSDR',
    url: '',
    homepageFallback: 'https://aisdr.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, ~20% first-year revenue share. Verify on application.',
  },
  rb2b: {
    name: 'RB2B',
    url: '',
    homepageFallback: 'https://www.rb2b.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). ~20% on referred deals via a third-party affiliate platform. Verify on application.',
  },
  warmly: {
    name: 'Warmly',
    url: '',
    homepageFallback: 'https://www.warmly.ai/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program available; verify commission + platform on application.',
  },
  'relevance-ai': {
    name: 'Relevance AI',
    url: '',
    homepageFallback: 'https://relevanceai.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program, no upfront fee. Verify commission on application.',
  },
  pabbly: {
    name: 'Pabbly',
    url: '',
    homepageFallback: 'https://www.pabbly.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program (recurring/lifetime, historically generous). Verify on application.',
  },
  lusha: {
    name: 'Lusha',
    url: '',
    homepageFallback: 'https://www.lusha.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, ~20% for first 12 months. Verify on application.',
  },
  synthflow: {
    name: 'Synthflow',
    url: '',
    homepageFallback: 'https://synthflow.ai/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, ~20% for 12 months. Verify on application.',
  },
  surfer: {
    name: 'Surfer',
    url: '',
    homepageFallback: 'https://surferseo.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, CPA-based (up to ~125% CPA per June-2026 research). Verify on application.',
  },
  'cal-com': {
    name: 'Cal.com',
    url: '',
    homepageFallback: 'https://cal.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). 20% recurring for 12 months (cal.com/affiliate-program). Verify on application.',
  },
  lindy: {
    name: 'Lindy',
    url: '',
    homepageFallback: 'https://www.lindy.ai/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program available; verify commission on application.',
  },
  'reply-io': {
    name: 'Reply.io',
    url: '',
    homepageFallback: 'https://reply.io/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate/partner program available; verify commission on application.',
  },
  krispcall: {
    name: 'KrispCall',
    url: '',
    homepageFallback: 'https://krispcall.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, ~30% lifetime. Verify on application.',
  },
  laxis: {
    name: 'Laxis',
    url: '',
    homepageFallback: 'https://www.laxis.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, up to ~35% (30% for first 12 months). Verify on application.',
  },
  close: {
    name: 'Close',
    url: '',
    homepageFallback: 'https://www.close.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program (recurring). Verify on application.',
  },
  nutshell: {
    name: 'Nutshell',
    url: '',
    homepageFallback: 'https://www.nutshell.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). PartnerStack, ~20-40% first year. Verify on application.',
  },
  getresponse: {
    name: 'GetResponse',
    url: '',
    homepageFallback: 'https://www.getresponse.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). ~40-60% recurring for 12 months, or a flat bounty option. Verify on application.',
  },
  adcreative: {
    name: 'AdCreative.ai',
    url: '',
    homepageFallback: 'https://www.adcreative.ai/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). ~30% recurring revenue share. Verify on application.',
  },
  motion: {
    name: 'Motion',
    url: '',
    homepageFallback: 'https://www.usemotion.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). ~$50 per paid subscriber. Verify on application.',
  },
  brevo: {
    name: 'Brevo',
    url: '',
    homepageFallback: 'https://www.brevo.com/',
    status: 'pending',
    notes: 'Pipeline (not yet applied). Affiliate program available; verify commission on application.',
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

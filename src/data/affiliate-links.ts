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
    url: 'https://get.lemlist.com/dj5hqvgo1g1g',
    homepageFallback: 'https://lemlist.com/',
    status: 'live',
    notes: 'Approved 2026-06-11. Referral link (get.lemlist.com). Recurring on subscription, % varies.',
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
  salesforce: {
    name: 'Salesforce',
    url: '',
    homepageFallback: 'https://www.salesforce.com/',
    status: 'no-program',
    notes: 'No consumer affiliate program (enterprise AppExchange/partner only). Falls back to homepage + UTM tag so /go/salesforce still routes and every comparison column links consistently.',
  },
  gong: {
    name: 'Gong',
    url: '',
    homepageFallback: 'https://www.gong.io/',
    status: 'no-program',
    notes: 'No public affiliate program (enterprise sales motion). Falls back to homepage + UTM tag so /go/gong still routes and comparison columns link consistently.',
  },
  outreach: {
    name: 'Outreach',
    url: '',
    homepageFallback: 'https://www.outreach.io/',
    status: 'no-program',
    notes: 'No public affiliate program (enterprise sales motion). Falls back to homepage + UTM tag so /go/outreach still routes and comparison columns link consistently.',
  },
  salesloft: {
    name: 'Salesloft',
    url: '',
    homepageFallback: 'https://www.salesloft.com/',
    status: 'no-program',
    notes: 'No public affiliate program (enterprise sales motion). Falls back to homepage + UTM tag so /go/salesloft still routes and comparison columns link consistently.',
  },

  // --- Affiliate pipeline (Session 17). status:'pending' = identified + intended, not yet applied.
  // Each /go/<slug> falls back to the homepage + UTM until the real link is pasted into `url`.
  // Commission/platform notes are from June-2026 research; verify exact terms on application.
  instantly: {
    name: 'Instantly',
    url: 'https://refer.instantly.ai/rpo8nmijrywl',
    homepageFallback: 'https://instantly.ai/',
    status: 'live',
    notes: 'Approved 2026-06-11. Referral link (refer.instantly.ai).',
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
    url: 'https://rb2b.com/?via=theautomationsguide',
    homepageFallback: 'https://www.rb2b.com/',
    status: 'live',
    notes: 'Approved 2026-06-09. Affiliate link via their referral program (?via=theautomationsguide).',
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
    url: 'https://relevanceai.com/?via=theautomationsguide',
    homepageFallback: 'https://relevanceai.com/',
    status: 'live',
    notes: 'Approved 2026-06-09. Affiliate link via their referral program (?via=theautomationsguide).',
  },
  pabbly: {
    name: 'Pabbly',
    url: 'https://payments.pabbly.com/api/affurl/RVYZ07kQyUZ0Z1HUKZ1m/LbwNxEMRwQxp5wyq?target=9Z2AHyhSldo6KI1Fn',
    homepageFallback: 'https://www.pabbly.com/',
    status: 'live',
    notes: 'Approved 2026-06-11. Points at Pabbly Connect (Recurring) — the automation product our content compares. Pabbly runs a separate affiliate link per product; the other 15 are parked in AFFILIATE_PIPELINE.md for product-specific posts.',
  },
  lusha: {
    name: 'Lusha',
    url: 'https://partnerstack.lusha.com/fn90rbodn3k4-omvn4r',
    homepageFallback: 'https://www.lusha.com/',
    status: 'live',
    notes: 'Approved 2026-06-11. PartnerStack link, ~20% for first 12 months.',
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
    url: 'https://refer.cal.com/theautomationsguide',
    homepageFallback: 'https://cal.com/',
    status: 'live',
    notes: 'Approved 2026-06-09. 20% recurring for 12 months. Affiliate link via refer.cal.com.',
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

  // --- LP-builder additions (pending; /go/<slug> falls back to homepage + UTM until approved). ---
  maildoso: {
    name: "Maildoso",
    url: '',
    homepageFallback: "https://www.maildoso.com/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  trigify: {
    name: "Trigify",
    url: '',
    homepageFallback: "https://www.trigify.io/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  fullenrich: {
    name: "FullEnrich",
    url: '',
    homepageFallback: "https://www.fullenrich.com/",
    status: 'pending',
    notes: "Pipeline (not yet applied). FullEnrich runs a referral or affiliate program; commission structure and terms should be verified directly on their partner page.",
  },
  moltsets: {
    name: "MoltSets",
    url: 'https://moltsets.com/?aff=theautomationsguide',
    homepageFallback: "https://moltsets.com/",
    status: 'live',
    notes: "Approved 2026-07-23. Referral link (?aff=theautomationsguide). $27/mo unlimited B2B contact-data API (US-only), built for Clay + Claude/MCP; founder Adam Robinson (RB2B/Retention.com). App at app.moltsets.com.",
  },
  attio: {
    name: "Attio",
    url: '',
    homepageFallback: "https://attio.com/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Attio runs a partner program; affiliate or referral terms should be confirmed directly with their partnerships team.",
  },
  'bland-ai': {
    name: "Bland AI",
    url: '',
    homepageFallback: "https://www.bland.ai/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },

  // --- LP-builder additions (pending; /go/<slug> falls back to homepage + UTM until approved). ---
  mailforge: {
    name: "Mailforge",
    url: '',
    homepageFallback: "https://www.mailforge.ai/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  surfe: {
    name: "Surfe",
    url: '',
    homepageFallback: "https://www.surfe.com/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Surfe runs a referral and affiliate program; commission structure and terms are available on application through their website.",
  },
  leadmagic: {
    name: "LeadMagic",
    url: '',
    homepageFallback: "https://www.leadmagic.io/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  bettercontact: {
    name: "BetterContact",
    url: '',
    homepageFallback: "https://www.bettercontact.rocks/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  vector: {
    name: "Vector",
    url: '',
    homepageFallback: "https://www.vector.co/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  vapi: {
    name: "Vapi",
    url: '',
    homepageFallback: "https://vapi.ai/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  circleback: {
    name: "Circleback",
    url: '',
    homepageFallback: "https://circleback.ai/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Affiliate program availability to verify on application.",
  },
  fillout: {
    name: "Fillout",
    url: '',
    homepageFallback: "https://www.fillout.com/",
    status: 'pending',
    notes: "Pipeline (not yet applied). Fillout runs an affiliate program; details on commission rates and terms are available through their website.",
  },

  // --- Comparison-reference tools (audit 2026-06-17, C-1). These appear ONLY as
  // ComparisonTable columns (affiliateSlug:) in head-to-head posts, not as tools we're
  // driving affiliate revenue for. Registered with url:'' so /go/<slug> still generates
  // and routes to homepage + UTM (the gong/outreach/salesforce pattern) — otherwise the
  // comparison column's CTA 404s, which it was doing live before this fix.
  zapier: {
    name: "Zapier",
    url: '',
    homepageFallback: "https://zapier.com/",
    status: 'pending',
    notes: "Comparison-reference column (Clay-vs-Zapier, Pabbly-vs-Zapier-vs-Make). Zapier runs a partner/referral program; not yet applied. Falls back to homepage + UTM so /go/zapier routes.",
  },
  canva: {
    name: "Canva",
    url: '',
    homepageFallback: "https://www.canva.com/",
    status: 'pending',
    notes: "Comparison-reference column (AdCreative-vs-Canva-vs-Creatify). Canva runs an affiliate program; not yet applied. Falls back to homepage + UTM so /go/canva routes.",
  },
  creatify: {
    name: "Creatify",
    url: '',
    homepageFallback: "https://creatify.ai/",
    status: 'pending',
    notes: "Comparison-reference column (AdCreative-vs-Canva-vs-Creatify). Creatify runs an affiliate program; not yet applied. Falls back to homepage + UTM so /go/creatify routes.",
  },
  justcall: {
    name: 'JustCall',
    url: '',
    homepageFallback: 'https://justcall.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  aircall: {
    name: 'Aircall',
    url: '',
    homepageFallback: 'https://aircall.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  fireflies: {
    name: 'Fireflies',
    url: '',
    homepageFallback: 'https://fireflies.ai/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  otter: {
    name: 'Otter.ai',
    url: '',
    homepageFallback: 'https://otter.ai/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  taplio: {
    name: 'Taplio',
    url: '',
    homepageFallback: 'https://taplio.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  loops: {
    name: 'Loops',
    url: '',
    homepageFallback: 'https://loops.so/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  activecampaign: {
    name: 'ActiveCampaign',
    url: '',
    homepageFallback: 'https://www.activecampaign.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  customerio: {
    name: 'Customer.io',
    url: '',
    homepageFallback: 'https://customer.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  quickmail: {
    name: 'QuickMail',
    url: '',
    homepageFallback: 'https://quickmail.com/',
    status: 'no-program',
    notes: 'Referenced in the 2026-07-12 cold-email-infra post but never registered, so /go/quickmail 404d in PRODUCTION (live broken CTA, found by the 2026-07-13 SEO audit). Registered with a homepage fallback so the route resolves. quickmail.io 301s to the apex. No affiliate program applied for yet.',
  },
  mailchimp: {
    name: 'Mailchimp',
    url: '',
    homepageFallback: 'https://mailchimp.com/pricing/marketing/',
    status: 'no-program',
    notes: 'Comparison-reference only. No affiliate program applied for yet. Falls back to pricing page + UTM so /go/mailchimp routes.',
  },
  'linkedin-sales-navigator': {
    name: 'LinkedIn Sales Navigator',
    url: '',
    homepageFallback: 'https://business.linkedin.com/sell?trk=visit-product-website&src=li-rev-prod',
    status: 'no-program',
    notes: 'Comparison-reference only. No public affiliate program (enterprise LinkedIn motion). Falls back to product page + UTM so /go/linkedin-sales-navigator routes.',
  },
  bouncer: {
    name: 'Bouncer',
    url: '',
    homepageFallback: 'https://bouncer.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  zerobounce: {
    name: 'ZeroBounce',
    url: '',
    homepageFallback: 'https://www.zerobounce.net/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  mailreach: {
    name: 'MailReach',
    url: '',
    homepageFallback: 'https://www.mailreach.co/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  folk: {
    name: 'folk',
    url: '',
    homepageFallback: 'https://www.folk.app/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  salesflare: {
    name: 'Salesflare',
    url: '',
    homepageFallback: 'https://salesflare.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  '11x': {
    name: '11x',
    url: '',
    homepageFallback: 'https://www.11x.ai/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  artisan: {
    name: 'Artisan',
    url: '',
    homepageFallback: 'https://www.artisan.co/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  calendly: {
    name: 'Calendly',
    url: '',
    homepageFallback: 'https://calendly.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  'chili-piper': {
    name: 'Chili Piper',
    url: '',
    homepageFallback: 'https://www.chilipiper.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  'factors-ai': {
    name: 'Factors.ai',
    url: '',
    homepageFallback: 'https://www.factors.ai/',
    status: 'pending',
    notes: 'S61 (PR #177) auto-registered the tools.ts half + logo but the affiliate-links entry never landed, so /go/factors-ai 404d on prod (caught by lint S62). Verify the affiliate program + commission on application.',
  },
  activepieces: {
    name: 'Activepieces',
    url: '',
    homepageFallback: 'https://activepieces.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  bardeen: {
    name: 'Bardeen',
    url: '',
    homepageFallback: 'https://www.bardeen.ai/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  warmforge: {
    name: 'Warmforge',
    url: '',
    homepageFallback: 'https://warmforge.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  frase: {
    name: 'Frase',
    url: '',
    homepageFallback: 'https://www.frase.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  clearscope: {
    name: 'Clearscope',
    url: '',
    homepageFallback: 'https://www.clearscope.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  aloware: {
    name: 'Aloware',
    url: '',
    homepageFallback: 'https://aloware.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  storydoc: {
    name: 'Storydoc',
    url: '',
    homepageFallback: 'https://www.storydoc.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  pandadoc: {
    name: 'PandaDoc',
    url: '',
    homepageFallback: 'https://www.pandadoc.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  qwilr: {
    name: 'Qwilr',
    url: '',
    homepageFallback: 'https://qwilr.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  getaccept: {
    name: 'GetAccept',
    url: '',
    homepageFallback: 'https://www.getaccept.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  profound: {
    name: 'Profound',
    url: '',
    homepageFallback: 'https://profound.app/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  fathom: {
    name: 'Fathom',
    url: '',
    homepageFallback: 'https://fathom.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  avoma: {
    name: 'Avoma',
    url: '',
    homepageFallback: 'https://www.avoma.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  'tl-dv': {
    name: 'tl;dv',
    url: '',
    homepageFallback: 'https://tldv.io/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  tally: {
    name: 'Tally',
    url: '',
    homepageFallback: 'https://tally.so/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  prospeo: {
    name: 'Prospeo',
    url: '',
    homepageFallback: 'https://prospeo.app/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
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

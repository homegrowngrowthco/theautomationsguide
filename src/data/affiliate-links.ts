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
    notes: '15% monthly / 20% annual for 12 months via PartnerStack. Approved 2026-05-12. #3 PartnerStack clicker (36 clicks as of 2026-08-21). Vanity equivalent get.apollo.io/tag exists; main kept on the proven link. Deep-link variants below: apollo-signup, apollo-pricing.',
  },
  // Apollo deep links (same program, page-specific destinations; added 2026-08-21).
  'apollo-signup': {
    name: 'Apollo Signup',
    url: 'https://get.apollo.io/sign-up-tag',
    homepageFallback: 'https://www.apollo.io/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the signup flow; hard-CTA use.',
  },
  'apollo-pricing': {
    name: 'Apollo Pricing',
    url: 'https://get.apollo.io/pricing-tag',
    homepageFallback: 'https://www.apollo.io/pricing',
    status: 'live',
    notes: 'Added 2026-08-21. Deep link to the pricing page; use in pricing/cost posts.',
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
    notes: '50% for 12 months via PartnerStack. Approved 2026-05-12. Top PartnerStack clicker (56 clicks as of 2026-08-21). Deep-link variants below: kit-vs-mailchimp, kit-convertkit.',
  },
  // Kit deep links (same program, page-specific destinations for contextual CTAs; added 2026-08-21).
  'kit-vs-mailchimp': {
    name: 'Kit vs Mailchimp',
    url: 'https://partners.kit.com/tag-kit-vs-mailchimp',
    homepageFallback: 'https://kit.com/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the Kit-vs-Mailchimp page; use in Mailchimp-alternatives posts.',
  },
  'kit-convertkit': {
    name: 'Kit (ConvertKit)',
    url: 'https://partners.kit.com/tag-convert-kit',
    homepageFallback: 'https://kit.com/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the ConvertKit-rebrand page; use where readers still know the ConvertKit name.',
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
    notes: 'Approved 2026-06-11. Referral link (refer.instantly.ai). #2 PartnerStack clicker (49 clicks as of 2026-08-21). Vanity equivalent refer.instantly.ai/tag exists; main kept on the proven link. Deep-link variants below: instantly-vip, instantly-crm, instantly-website-visitors.',
  },
  // Instantly deep links (same program, page-specific destinations; added 2026-08-21).
  'instantly-vip': {
    name: 'Instantly VIP',
    url: 'https://refer.instantly.ai/tag-vip',
    homepageFallback: 'https://instantly.ai/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the VIP offer page.',
  },
  'instantly-crm': {
    name: 'Instantly CRM',
    url: 'https://refer.instantly.ai/tag-crm',
    homepageFallback: 'https://instantly.ai/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the Instantly CRM (dealflow) page; use in CRM/unibox posts.',
  },
  'instantly-website-visitors': {
    name: 'Instantly Website Visitors',
    url: 'https://refer.instantly.ai/tag-website-visitors',
    homepageFallback: 'https://instantly.ai/',
    status: 'live',
    notes: 'Added 2026-08-21. Lands on the website-visitor-identification page; use in RB2B/Warmly-adjacent posts.',
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
    url: 'https://get.surferseo.com/tag',
    homepageFallback: 'https://surferseo.com/',
    status: 'live',
    notes: 'Approved (links generated 2026-08-21). PartnerStack, CPA-based (up to ~125% CPA per June-2026 research; confirm in dashboard). Deep-link variants below: surfer-ai, surfer-ai-detector, surfer-pricing.',
  },
  // Surfer deep links (same program, page-specific destinations for contextual CTAs).
  'surfer-ai': {
    name: 'Surfer AI',
    url: 'https://get.surferseo.com/ai-tag',
    homepageFallback: 'https://surferseo.com/ai/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the Surfer AI page; use in AI-writing posts.',
  },
  'surfer-ai-detector': {
    name: 'Surfer AI Content Detector',
    url: 'https://get.surferseo.com/ai-content-detector-tag',
    homepageFallback: 'https://surferseo.com/ai-content-detector/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the AI content detector; use in AI-detection posts.',
  },
  'surfer-pricing': {
    name: 'Surfer Pricing',
    url: 'https://get.surferseo.com/pricing-tag',
    homepageFallback: 'https://surferseo.com/pricing/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the pricing page; use in pricing/cost posts.',
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
    status: 'applied',
    notes: 'Applied 2026-08-19 (PartnerStack Creator Partners), awaiting response.',
  },
  'reply-io': {
    name: 'Reply.io',
    url: 'https://get.reply.io/tag',
    homepageFallback: 'https://reply.io/',
    status: 'live',
    notes: 'Approved 2026-08-19 (direct program, ~20% recurring). Two deep-link variants registered below: reply-io-pricing, reply-io-ai.',
  },
  // Reply.io deep links (same program, page-specific destinations for contextual CTAs).
  'reply-io-pricing': {
    name: 'Reply.io Pricing',
    url: 'https://get.reply.io/tag-pricing',
    homepageFallback: 'https://reply.io/pricing/',
    status: 'live',
    notes: 'Approved 2026-08-19. Deep link to the pricing page; use in pricing/cost posts.',
  },
  'reply-io-ai': {
    name: 'Reply.io AI Variables',
    url: 'https://get.reply.io/tag-ai',
    homepageFallback: 'https://reply.io/',
    status: 'live',
    notes: 'Approved 2026-08-19. Deep link to the AI variables page; use in AI-SDR/personalization posts.',
  },
  krispcall: {
    name: 'KrispCall',
    url: 'https://try.krispcall.com/tag',
    homepageFallback: 'https://krispcall.com/',
    status: 'live',
    notes: 'Approved 2026-08-21 (PartnerStack, ~30% lifetime; confirm in dashboard). Deep-link variant below: krispcall-pricing.',
  },
  'krispcall-pricing': {
    name: 'KrispCall Pricing',
    url: 'https://try.krispcall.com/pricing-tag',
    homepageFallback: 'https://krispcall.com/pricing/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the pricing page; use in pricing/cost posts.',
  },
  laxis: {
    name: 'Laxis',
    url: 'https://www.laxis.com/?via=tag',
    homepageFallback: 'https://www.laxis.com/',
    status: 'live',
    notes: 'Approved 2026-08-19 (25% first 12 months per Wave-2 research; confirm rate in dashboard).',
  },
  close: {
    name: 'Close',
    url: 'https://refer.close.com/fj3yu2z38zal-fetl0j',
    homepageFallback: 'https://www.close.com/',
    status: 'live',
    notes: 'Approved 2026-08-21 (PartnerStack, ~30% first 12mo; confirm in dashboard). Links are NOT customizable (opaque hashes). Main = Close homepage. Variants below: close-signup, close-chloe.',
  },
  // Close deep links (same program; PartnerStack would not let us customize these slugs).
  'close-signup': {
    name: 'Close Signup',
    url: 'https://refer.close.com/bt71sibgegvz',
    homepageFallback: 'https://www.close.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Lands on the Close signup flow; use as the hard-CTA where surrounding copy already sold the product.',
  },
  'close-chloe': {
    name: 'Close Chloe Signup',
    url: 'https://refer.close.com/pfwq09u57ghp-ndgghg',
    homepageFallback: 'https://www.close.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Lands on the Chloe (Close AI) signup; use in AI-SDR/AI-assistant posts.',
  },
  nutshell: {
    name: 'Nutshell',
    url: 'https://try.nutshell.com/tag',
    homepageFallback: 'https://www.nutshell.com/',
    status: 'live',
    notes: 'Approved 2026-08-21 (PartnerStack, ~20% recurring first year; confirm in dashboard). Deep-link variants below: nutshell-signup, nutshell-best-crm, nutshell-pricing, nutshell-features.',
  },
  // Nutshell deep links (same program, page-specific destinations for contextual CTAs).
  'nutshell-signup': {
    name: 'Nutshell Signup',
    url: 'https://try.nutshell.com/tag-signup',
    homepageFallback: 'https://www.nutshell.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Lands on the signup flow; hard-CTA use.',
  },
  'nutshell-best-crm': {
    name: 'Nutshell Best CRM',
    url: 'https://try.nutshell.com/tag-best-crm',
    homepageFallback: 'https://www.nutshell.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Lands on the best-CRM comparison page; use in CRM head-to-heads.',
  },
  'nutshell-pricing': {
    name: 'Nutshell Pricing',
    url: 'https://try.nutshell.com/tag-pricing',
    homepageFallback: 'https://www.nutshell.com/pricing',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the pricing page; use in pricing/cost posts.',
  },
  'nutshell-features': {
    name: 'Nutshell Features',
    url: 'https://try.nutshell.com/tag-features',
    homepageFallback: 'https://www.nutshell.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the features page.',
  },
  getresponse: {
    name: 'GetResponse',
    url: '',
    homepageFallback: 'https://www.getresponse.com/',
    status: 'applied',
    notes: 'Applied 2026-08-19 (PartnerStack, 40% recurring 12mo, scales to 60%), awaiting response.',
  },
  adcreative: {
    name: 'AdCreative.ai',
    url: '',
    homepageFallback: 'https://www.adcreative.ai/',
    status: 'applied',
    notes: 'Applied 2026-08-19 (PartnerStack, ~30% recurring), awaiting response.',
  },
  motion: {
    name: 'Motion',
    url: 'https://motion.so/?ref=tag',
    homepageFallback: 'https://www.usemotion.com/',
    status: 'live',
    notes: 'Approved 2026-08-19 (~$50 per paid subscription, 60-day cookie per Wave-2 research).',
  },
  brevo: {
    name: 'Brevo',
    url: '',
    homepageFallback: 'https://www.brevo.com/',
    status: 'applied',
    notes: 'Applied 2026-08-19 (PartnerStack, fixed bounty per paid referral), awaiting response.',
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
    url: 'https://trigify.io/?via=tag',
    homepageFallback: "https://www.trigify.io/",
    status: 'live',
    notes: "Approved 2026-08-19 (Rewardful, 20% recurring on all payments).",
  },
  fullenrich: {
    name: "FullEnrich",
    url: 'https://fullenrich.partnerlinks.io/tag',
    homepageFallback: "https://www.fullenrich.com/",
    status: 'live',
    notes: "Approved 2026-08-21 (PartnerStack, 15-25% tiered, 12mo, 90d cookie). Paid ads void payout — content-only.",
  },
  moltsets: {
    name: "MoltSets",
    url: 'https://moltsets.com/?aff=theautomationsguide',
    homepageFallback: "https://moltsets.com/",
    status: 'live',
    notes: "Approved 2026-07-23. Referral link (?aff=theautomationsguide). $27/mo unlimited B2B contact-data API (US-only), built for Clay + Claude/MCP; founder Adam Robinson (RB2B/Retention.com). App at app.moltsets.com.",
  },
  zoominfo: {
    name: "ZoomInfo",
    url: '',
    homepageFallback: "https://www.zoominfo.com/free-trial",
    status: 'no-program',
    notes: "No public affiliate program (enterprise sales motion). Routes to the free-trial page + UTM so /go/zoominfo works as a plain CTA in comparison columns (Ian-provided link 2026-07-23).",
  },
  attio: {
    name: "Attio",
    url: '',
    homepageFallback: "https://attio.com/",
    status: 'no-program',
    notes: "Verified 2026-08-19: no cash affiliate program. attio.com/partners lists App/Creator/Expert Partners (none pay commission); attio.com/refer is a $200-gift-card customer referral. /go/attio stays a plain CTA via homepage fallback.",
  },
  findymail: {
    name: "Findymail",
    url: 'https://www.findymail.com?via=tag',
    homepageFallback: "https://www.findymail.com/",
    status: 'live',
    notes: "Approved 2026-08-19 (Rewardful 'Friends of Findymail', 25% recurring, PayPal $50 min). Watch the first payout: unverified Trustpilot complaints allege unpaid commissions.",
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
    status: 'applied',
    notes: "Applied 2026-08-19 (Dub Partners, 20% recurring 1yr), awaiting response.",
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
    url: 'https://vapi.ai/?aff=tag',
    homepageFallback: "https://vapi.ai/",
    status: 'live',
    notes: "Approved 2026-08-19 (Tolt, 15% referral revenue).",
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
    status: 'applied',
    notes: 'Applied 2026-08-19 (FirstPromoter, up to 20% recurring 2yr, $100 min payout), awaiting response.',
  },
  aircall: {
    name: 'Aircall',
    url: '',
    homepageFallback: 'https://aircall.io/',
    status: 'rejected',
    notes: 'Rejected 2026-08-19 (PartnerStack affiliate program). Re-apply once traffic builds; the $75/lead program targets established review sites.',
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
    url: 'https://try.activecampaign.com/tag-email-marketing',
    homepageFallback: 'https://www.activecampaign.com/',
    status: 'live',
    notes: 'Approved 2026-08-21 (PartnerStack, 30% recurring 12mo). Main link lands on the email-marketing product page. Deep-link variants below: activecampaign-sms, activecampaign-pricing, activecampaign-pricing-calculator, activecampaign-free.',
  },
  // ActiveCampaign deep links (same program, page-specific destinations for contextual CTAs).
  'activecampaign-sms': {
    name: 'ActiveCampaign SMS Marketing',
    url: 'https://try.activecampaign.com/tag-sms-marketing',
    homepageFallback: 'https://www.activecampaign.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the SMS-marketing page; use in SMS/multichannel posts.',
  },
  'activecampaign-pricing': {
    name: 'ActiveCampaign Pricing',
    url: 'https://try.activecampaign.com/tag-pricing',
    homepageFallback: 'https://www.activecampaign.com/pricing',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the pricing page; use in pricing/cost posts.',
  },
  'activecampaign-pricing-calculator': {
    name: 'ActiveCampaign Email Pricing Calculator',
    url: 'https://try.activecampaign.com/tag-email-pricing-calculator',
    homepageFallback: 'https://www.activecampaign.com/pricing',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the email pricing calculator; use in pricing comparisons.',
  },
  'activecampaign-free': {
    name: 'ActiveCampaign Free Trial',
    url: 'https://try.activecampaign.com/tag-free',
    homepageFallback: 'https://www.activecampaign.com/',
    status: 'live',
    notes: 'Approved 2026-08-21. Deep link to the free-trial offer; use as the hard-CTA in migration guides.',
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
    url: 'https://www.zerobounce.net/partners?id=aff-209d4536738d4298',
    homepageFallback: 'https://www.zerobounce.net/',
    status: 'live',
    notes: "Approved 2026-08-19 (in-house program, 18% year 1 then 5% lifetime). url = vendor-provided affiliate landing page; direct signup link if ever preferred: https://www.zerobounce.net/members/signin/register?ref_code=aff-209d4536738d4298",
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
  cognism: {
    name: 'Cognism',
    url: '',
    homepageFallback: 'https://www.cognism.com/',
    status: 'pending',
    notes: 'Blocked 2026-08-19: application gated behind the pending PartnerStack Network approval (same blocker as Pipedrive). Apply at market.partnerstack.com/page/cognism once the network account clears.',
  },
  gumloop: {
    name: 'Gumloop',
    url: '',
    homepageFallback: 'https://www.gumloop.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  mailshake: {
    name: 'Mailshake',
    url: '',
    homepageFallback: 'https://mailshake.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },
  saleshandy: {
    name: 'Saleshandy',
    url: '',
    homepageFallback: 'https://saleshandy.com/',
    status: 'pending',
    notes: 'Auto-registered from a content PR (referenced before manual onboarding). Verify the affiliate program + commission on application.',
  },

  // --- Quick-approval batch, 2026-08-19 (Ian applied directly; all links verified resolving with attribution intact). ---
  // findymail intentionally NOT re-added here: its live entry is earlier in this object (a duplicate key would silently shadow it).
  watermelon: {
    name: "Watermelon",
    url: 'https://link.watermelon.ai/tag',
    homepageFallback: "https://watermelon.ai/",
    status: 'live',
    notes: "Approved 2026-08-19 (Dub referral). AI customer service agent platform; adjacent to core GTM coverage.",
  },
  'appy-ai': {
    name: "Appy.AI",
    url: 'https://refer.appy.ai/tag',
    homepageFallback: "https://appy.ai/",
    status: 'live',
    notes: "Approved 2026-08-19 (Dub referral). NOTE: referral link lands on the signup form (builder.appy.ai), not the marketing homepage, so surrounding copy must explain the product.",
  },
  voiceos: {
    name: "VoiceOS",
    url: 'https://voiceos.com/r?via=tag',
    homepageFallback: "https://www.voiceos.com/",
    status: 'live',
    notes: "Approved 2026-08-19 (first-party referral; referred users get 1 month VoiceOS Pro free). Mac voice-to-action assistant, NOT a phone/dialer product.",
  },
  runable: {
    name: "Runable",
    url: 'https://runable.link/tag',
    homepageFallback: "https://runable.com/",
    status: 'live',
    notes: "Approved 2026-08-19 (Dub referral). General-purpose AI agent (consumer/creator leaning), ~$15/mo yearly.",
  },
  'wispr-flow': {
    name: "Wispr Flow",
    url: 'https://ref.wisprflow.ai/the-automations-guide',
    homepageFallback: "https://wisprflow.ai/",
    status: 'live',
    notes: "Approved 2026-08-19 (Dub referral, slug the-automations-guide). Cross-platform AI dictation (Mac/Windows/iOS/Android).",
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

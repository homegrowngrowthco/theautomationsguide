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
  /**
   * Whether the tool appears in the homepage "Tools we cover" strip and the /tools
   * index grid. Defaults to true. Set false for pipeline tools whose hub page should
   * exist (and be indexable) but stay off the homepage/grid until they have an
   * approved affiliate link or a published article.
   */
  listed?: boolean;
  /** One-line "best for" summary, shown near the top of the hub page. */
  bestFor?: string;
  /** Longer positioning write-up for the hub page (2-3 paragraphs). */
  body?: string[];
  /** Hub-page FAQs. Also emitted as FAQPage structured data. */
  faqs?: { question: string; answer: string }[];
}

/** Render order for category sections on the /tools index. */
export const toolCategories = [
  'Workflow Automation',
  'CRM',
  'Outbound & Lead Generation',
  'Cold Email & Deliverability',
  'Lead Data & Enrichment',
  'Newsletter Platform',
  'Website Visitor ID & Signals',
  'AI Agents',
  'Scheduling',
];

/**
 * Slug for a category's in-page anchor on the /tools index. Shared by the index
 * page (section `id`) and the header "Tools" dropdown (jump-link `href`) so the
 * two never drift. e.g. 'Cold Email & Deliverability' -> 'cold-email-deliverability'.
 */
export const categoryAnchor = (category: string): string =>
  category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Curated subset of categories surfaced in the header "Tools" dropdown as
 * jump-links into the /tools index. Order matters. Deliberately a subset of
 * `toolCategories`: the singleton categories (Enrichment, Visitor ID, Scheduling)
 * are reached via the dropdown's "Browse all tools" tail link rather than
 * cluttering the menu with one-tool rows.
 */
export const navToolCategories = [
  'Workflow Automation',
  'CRM',
  'Outbound & Lead Generation',
  'Cold Email & Deliverability',
  'Newsletter Platform',
  'AI Agents',
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
    faqs: [
      {
        question: 'How does Make compare to Zapier?',
        answer:
          'Make offers more advanced logic, data transformation, and multi-step routing at a lower price point than Zapier. It is the better pick for complex workflows; Zapier is easier for simple one-step automations.',
      },
      {
        question: 'Is Make free?',
        answer:
          'Make has a free tier with 1,000 operations per month. Paid plans start at $9/month for 10,000 operations. Operations-based pricing makes it significantly cheaper than Zapier at volume.',
      },
      {
        question: 'Can Make connect to HubSpot?',
        answer:
          'Yes. Make has a native HubSpot integration covering contacts, deals, companies, workflows, and custom objects. Syncing HubSpot with other GTM tools is one of the most common RevOps use cases.',
      },
    ],
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
    faqs: [
      {
        question: 'What is n8n and who is it for?',
        answer:
          'n8n is an open-source workflow automation tool you can self-host for free or run on their managed cloud. It is ideal for engineering-forward RevOps teams who want full data control, no per-operation pricing, and the ability to write custom code nodes.',
      },
      {
        question: 'Is n8n really free?',
        answer:
          'The self-hosted version is free and open-source with no usage limits. The managed cloud plan starts at $20/month. Self-hosting eliminates ongoing SaaS costs entirely, though it requires server management.',
      },
      {
        question: 'How does n8n compare to Make?',
        answer:
          'Both are more powerful than Zapier for complex workflows. n8n wins on self-hosting (zero platform cost, full data control, no operation caps); Make wins on a more polished UI and broader native integration library. Teams with engineering resources often prefer n8n; teams without them prefer Make.',
      },
    ],
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
    faqs: [
      {
        question: 'What does HubSpot automate for RevOps teams?',
        answer:
          'HubSpot automates lead routing, deal stage progressions, contact lifecycle changes, email sequences, internal notifications, and data sync across your GTM stack. The workflow builder handles most RevOps automation use cases without requiring a separate tool.',
      },
      {
        question: 'Is HubSpot free?',
        answer:
          'HubSpot has a genuinely useful free CRM tier. Automation workflows, sequences, and reporting depth require Starter ($20/month) or higher. Most RevOps teams run on Professional ($890/month) for full workflow automation.',
      },
      {
        question: 'How does HubSpot compare to Salesforce?',
        answer:
          'HubSpot is easier to set up, maintain, and use for mid-market GTM teams. Salesforce is more customizable and better for enterprise-scale data models. Most teams under $50M ARR get more value from HubSpot; above that, the calculus depends on your ops complexity.',
      },
    ],
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
    faqs: [
      {
        question: 'Who is Pipedrive best suited for?',
        answer:
          'Pipedrive is best for sales-led B2B teams that want a clean, pipeline-first CRM without HubSpot complexity or price. It is a strong fit for SMBs and mid-market teams where the sales rep experience matters more than marketing automation depth.',
      },
      {
        question: 'Does Pipedrive have automation?',
        answer:
          "Yes. Pipedrive's Automations feature handles deal stage triggers, activity creation, email sending, and contact updates. It covers the core sales automation use cases starting on the Essential plan ($14/seat/month).",
      },
      {
        question: 'How does Pipedrive compare to HubSpot?',
        answer:
          'Pipedrive is simpler, more opinionated, and cheaper per seat than HubSpot. HubSpot has deeper marketing automation, reporting, and ecosystem integrations. Pipedrive wins when the priority is a clean pipeline view for reps; HubSpot wins when RevOps needs to automate across marketing, sales, and CS.',
      },
    ],
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
    faqs: [
      {
        question: 'What does Clay do?',
        answer:
          'Clay is a data enrichment and prospecting platform that combines 50+ data sources (Clearbit, Apollo, LinkedIn, and more) in a spreadsheet-like interface. RevOps and sales teams use it to build targeted outbound lists, enrich CRM data, and trigger personalized messaging at scale.',
      },
      {
        question: 'How much does Clay cost?',
        answer:
          'Clay pricing starts at $149/month (Starter) and scales with the number of credits (data lookups) you consume. Most high-volume outbound teams land on $349 to $699/month. It typically replaces several point-solution data tools, so the ROI math works for teams doing serious outbound.',
      },
      {
        question: 'Is Clay better than Apollo for enrichment?',
        answer:
          'They serve different use cases. Apollo includes its own contact database plus sequencing as a one-stop outbound platform. Clay is a data orchestration layer that can pull from Apollo and 50+ other sources, giving you more enrichment depth and flexibility. High-performance outbound teams often use both.',
      },
    ],
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
    faqs: [
      {
        question: 'What is Apollo.io used for?',
        answer:
          'Apollo is an all-in-one outbound platform combining a 275M+ B2B contact database, email sequencing, and CRM enrichment. RevOps teams use it to find prospects, run email campaigns, and keep HubSpot data current through its enrichment API.',
      },
      {
        question: 'Is Apollo free?',
        answer:
          'Apollo has a free tier that includes limited contact credits, email sequences, and basic sequencing. Paid plans start at $49/user/month for more credits, calling, and automation. The free tier is genuinely usable for early-stage outbound.',
      },
      {
        question: 'How does Apollo compare to ZoomInfo?',
        answer:
          'Apollo is significantly cheaper and offers a better free tier; ZoomInfo has a larger database and stronger data quality at the enterprise level. For most SMB and mid-market RevOps teams, Apollo delivers 80% of ZoomInfo value at 20% of the cost.',
      },
    ],
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
    faqs: [
      {
        question: 'What is Smartlead used for?',
        answer:
          'Smartlead is a cold email infrastructure platform built for high-volume outbound. It supports unlimited email inboxes, built-in warmup, inbox rotation, and detailed deliverability analytics. RevOps and sales teams use it to send at scale without burning domains.',
      },
      {
        question: 'How does Smartlead compare to Instantly?',
        answer:
          'Smartlead and Instantly are the two dominant cold email platforms. Both support unlimited inboxes and warmup. Instantly has a cleaner UI and stronger community; Smartlead has more granular deliverability controls and more flexible API access.',
      },
      {
        question: 'Does Smartlead integrate with HubSpot?',
        answer:
          'Yes. Smartlead integrates with HubSpot to sync contact data, update lead statuses when prospects reply, and trigger sequences based on CRM stage changes. You can also connect via Zapier, Make, or n8n for custom automation.',
      },
    ],
  },
  {
    slug: 'lemlist',
    name: 'Lemlist',
    category: 'Outbound & Lead Generation',
    badge: 'Free trial',
    ctaLabel: 'Try Lemlist',
    ctaPrimary: false,
    listed: true,
    logo: '/brand/tools/lemlist.svg',
    aliases: ['Lemlist'],
    blurb:
      'Lemlist is a multichannel sequencer built around personalization, with image and video personalization, LinkedIn steps, and Lemwarm warmup baked into the sequence builder.',
    bestFor:
      'Teams whose reply rates depend on standout, personalized outreach to mid-market or enterprise buyers, not raw volume.',
    body: [
      'Lemlist sits in a different category than pure volume senders like Instantly or Smartlead. Its personalization engine, which includes dynamic images, video thumbnails, and custom landing pages, is genuinely best-in-class and can move reply rates materially on campaigns where generic outreach flatlines.',
      'The tradeoff is cost and throughput: pricing is per user and the platform is not built for bulk plain-text sending. It is the right pick when the lever is message quality and multichannel touches (email plus LinkedIn) rather than how many inboxes you can run.',
    ],
    faqs: [
      {
        question: 'What makes Lemlist different from Instantly or Smartlead?',
        answer:
          'Lemlist leads on personalization (images, video, landing pages) and multichannel steps, where Instantly and Smartlead focus on high-volume email deliverability.',
      },
      {
        question: 'Does Lemlist include email warmup?',
        answer:
          'Yes. Lemwarm is built in, with a decent warmup pool, though it is smaller than dedicated infrastructure tools like Smartlead.',
      },
      {
        question: 'Is Lemlist expensive?',
        answer:
          'It is priced per user, so a multi-seat SDR team adds up quickly. The math works best when average deal size is high and personalization drives the conversion.',
      },
    ],
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
    faqs: [
      {
        question: 'What makes Beehiiv different from Mailchimp or Substack?',
        answer:
          'Beehiiv is built specifically for serious newsletter publishers. It includes a native referral program, Boosts (paid cross-promotion network), paid subscriptions, and a strong free tier up to 2,500 subscribers. Substack is simpler but takes a revenue cut; Mailchimp lacks the publisher-specific monetization features.',
      },
      {
        question: 'Is Beehiiv free?',
        answer:
          "Beehiiv's Launch plan is free for up to 2,500 subscribers with no revenue share. Paid plans start at $39/month (Scale) for growth features like referral programs and custom domains. It is one of the most generous free tiers in the newsletter space.",
      },
      {
        question: 'Can Beehiiv integrate with my CRM?',
        answer:
          'Beehiiv connects to HubSpot and other platforms via Zapier, Make, and its native API. Common use cases include syncing new subscribers to HubSpot contacts and triggering CRM sequences when a subscriber hits a specific segment.',
      },
    ],
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
    faqs: [
      {
        question: 'Who is Kit best for?',
        answer:
          'Kit is built for content creators and solo operators who want simple email sequences, audience segmentation, and clean subscriber management. It is a strong fit for newsletter writers, course creators, and solopreneurs rather than enterprise GTM teams.',
      },
      {
        question: 'How does Kit compare to Beehiiv?',
        answer:
          'Kit is better for automation and audience segmentation; Beehiiv is better for native newsletter monetization (referral programs, Boosts, paid subscriptions). Kit wins when the priority is complex email sequences and tagging logic; Beehiiv wins when the goal is newsletter growth and direct monetization.',
      },
      {
        question: 'Is Kit free?',
        answer:
          "Kit's free plan supports up to 10,000 subscribers with unlimited emails and one automation. Paid plans start at $25/month for advanced automations, integrations, and reporting. The free tier is one of the most generous in the email marketing category.",
      },
    ],
  },

  // --- Affiliate pipeline (Session 17). listed:false keeps these off the homepage
  // strip + /tools grid, but the hub pages still generate and are indexable. Flip
  // listed:true (and add a logo) once each has an approved program or an article.
  {
    slug: 'instantly',
    name: 'Instantly',
    category: 'Cold Email & Deliverability',
    badge: 'Free trial',
    ctaLabel: 'Try Instantly',
    ctaPrimary: true,
    listed: true,
    logo: '/brand/tools/instantly.webp',
    aliases: ['Instantly'],
    blurb:
      'Instantly is a high-volume cold email platform built around deliverability, with unlimited sending accounts, built-in warmup, and a B2B lead database in one place.',
    bestFor:
      'Founders and lean outbound teams that want deliverability-first sending without stitching together separate warmup and inbox tools.',
    body: [
      'Instantly sits in the same lane as Smartlead: it is built for operators running many inboxes at once who care more about landing in the primary tab than about heavy CRM features. You get unlimited connected mailboxes, automatic warmup, inbox rotation, and a unified inbox to manage replies across every sending account.',
      'Where it tends to win is onboarding speed and the bundled lead finder, which lets smaller teams source and send from one tool. Heavier RevOps teams usually still pair it with a dedicated enrichment layer like Clay or Apollo, then use Instantly purely as the sending engine.',
    ],
    faqs: [
      {
        question: 'Is Instantly better than Smartlead?',
        answer:
          'They overlap heavily. Instantly is usually faster to onboard and bundles a lead database, while Smartlead leans toward agencies managing many client workspaces.',
      },
      {
        question: 'Does Instantly include email warmup?',
        answer:
          'Yes. Warmup runs automatically across all connected accounts, which is the main reason teams pick it over a bare sequencer.',
      },
      {
        question: 'Who should not use Instantly?',
        answer:
          'Teams that need deep CRM logic, multichannel sequencing across LinkedIn and phone, or enterprise reporting will outgrow it and should look at a full sales engagement platform.',
      },
    ],
  },
  {
    slug: 'aisdr',
    name: 'AiSDR',
    category: 'AI Sales Agents',
    badge: 'Paid',
    ctaLabel: 'Try AiSDR',
    ctaPrimary: true,
    listed: false,
    aliases: ['AiSDR'],
    blurb:
      'AiSDR is an AI sales agent that researches prospects in real time and sends outreach that reads like a human rep wrote it, focused on lead quality over raw volume.',
    bestFor:
      'Small teams that want an always-on outbound motion without hiring a full SDR, and operators evaluating the new AI-SDR category.',
    body: [
      'AiSDR is one of the more accessible entrants in the AI SDR wave, where an agent handles prospecting, personalization, and follow-up that a human SDR would normally own. It pulls signals from across the web to find people with a problem you solve, then drafts and sends outreach tuned to your voice.',
      'The honest framing in 2026 is that fully autonomous AI SDRs have not replaced human teams at scale, and most buyers run them as a hybrid layer for top-of-funnel coverage. AiSDR is worth comparing against Artisan, 11x, and Reply.io Jason for anyone deciding where an AI agent fits versus a traditional sequencer.',
    ],
    faqs: [
      {
        question: 'What does an AI SDR like AiSDR actually do?',
        answer:
          'It automates the repetitive parts of outbound: finding fit prospects, writing personalized first touches, and running follow-up sequences, with a human steering strategy and reviewing replies.',
      },
      {
        question: 'How is AiSDR different from 11x or Artisan?',
        answer:
          'AiSDR is priced for mid-market and emphasizes message quality, while 11x and Artisan target larger budgets. Artisan also lost automated LinkedIn outreach in early 2026, which narrows its channel mix.',
      },
      {
        question: 'Do I still need a data tool with AiSDR?',
        answer:
          'It includes prospecting, but teams with strict ICP criteria often still feed it lists built in Clay or Apollo for tighter targeting.',
      },
    ],
  },
  {
    slug: 'rb2b',
    name: 'RB2B',
    category: 'Website Visitor ID & Signals',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try RB2B',
    ctaPrimary: true,
    logo: '/brand/tools/rb2b.png',
    listed: true,
    aliases: ['RB2B'],
    blurb:
      'RB2B identifies the individual people visiting your website (not just the company) and pushes those person-level signals straight to Slack so sales can act in minutes.',
    bestFor:
      'US-focused B2B teams that want the fastest, cheapest path to person-level website visitor signal.',
    body: [
      'RB2B made its name as the simplest way to turn anonymous US traffic into named LinkedIn profiles, with a setup that takes minutes and a free tier that lets you try the signal before paying. The pitch is speed: a visitor hits a key page, and the person shows up in Slack while intent is still warm.',
      'It is deliberately narrow. RB2B identifies and routes, but it does not orchestrate full playbooks the way Warmly or Common Room aim to, and its match coverage is US-centric. That makes the "RB2B vs Vector" and "RB2B vs Warmly" comparisons the natural decision points for buyers.',
    ],
    faqs: [
      {
        question: 'What makes RB2B different from company-level visitor tools?',
        answer:
          'Most tools tell you which company visited. RB2B resolves traffic to individual people, which is far more actionable for 1:1 sales follow-up.',
      },
      {
        question: 'Does RB2B work outside the US?',
        answer:
          'Coverage is strongest for US-based visitors. Teams selling primarily into Europe should check match rates carefully before committing.',
      },
      {
        question: 'Is there a free version of RB2B?',
        answer:
          'Yes, there is a free tier, which is part of why it is an easy first visitor-ID tool to test.',
      },
    ],
  },
  {
    slug: 'warmly',
    name: 'Warmly',
    category: 'Website Visitor ID & Signals',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Warmly',
    ctaPrimary: true,
    listed: false,
    aliases: ['Warmly'],
    blurb:
      'Warmly combines website visitor identification with AI-driven sales orchestration, turning de-anonymized traffic into automated plays and live prospecting.',
    bestFor:
      'Teams that want visitor ID plus the automation to act on it (alerts, sequences, and chat) in one platform.',
    body: [
      'Warmly is the orchestration-heavy end of the visitor-ID category. It identifies who is on your site, layers in intent and enrichment, then triggers plays: routing hot accounts to reps, kicking off sequences, or opening a live chat when a high-fit visitor is browsing. A free tier lets you identify a capped number of visitors per month to prove value.',
      'Compared with RB2B, Warmly does more after identification, which is the trade-off: more capability and more to configure. It is a strong fit for teams that already know they want to automate the response, not just see the signal.',
    ],
    faqs: [
      {
        question: 'How is Warmly different from RB2B?',
        answer:
          'RB2B focuses on fast, cheap person-level identification. Warmly adds orchestration on top: intent scoring, routing, sequences, and live chat triggered by who is on your site.',
      },
      {
        question: 'Does Warmly have a free plan?',
        answer:
          'Yes, it includes a free tier that identifies a limited number of visitors per month, which is a low-risk way to test fit.',
      },
      {
        question: 'What does Warmly pair well with?',
        answer:
          'It commonly sits alongside a CRM and a sending tool, using identified visitors as the trigger for outbound and ABM plays.',
      },
    ],
  },
  {
    slug: 'relevance-ai',
    name: 'Relevance AI',
    category: 'AI Agents',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Relevance AI',
    ctaPrimary: true,
    logo: '/brand/tools/relevance-ai.webp',
    listed: true,
    aliases: ['Relevance AI'],
    blurb:
      'Relevance AI is a no-code platform for building AI agents and multi-step "AI teams" that do real GTM work, from research to data entry to outreach drafting.',
    bestFor:
      'Operators who already think in workflows (Make, n8n) and want to add reasoning-heavy AI agents to the stack.',
    body: [
      'Relevance AI lets you assemble AI agents that chain tools, reasoning, and data into repeatable jobs without writing code. For GTM teams that is account research, list enrichment, inbound triage, or first-draft personalization, the kind of work that is too fuzzy for a rigid Zapier path but too repetitive to do by hand.',
      'It is a natural complement to the automation tools this site covers most. Where Make and n8n move data on triggers, Relevance handles the judgment steps in between. There is no upfront fee to join its program, and it ships a free tier so you can build a first agent before committing.',
    ],
    faqs: [
      {
        question: 'How is Relevance AI different from Make or n8n?',
        answer:
          'Make and n8n are deterministic automation: if this, then that. Relevance AI adds agents that reason over a task, which suits research and unstructured decisions better than fixed flows.',
      },
      {
        question: 'Do I need to code to use Relevance AI?',
        answer:
          'No. Agents and AI teams are built in a no-code interface, though it rewards people who understand how to scope a workflow.',
      },
      {
        question: 'What GTM jobs is it good for?',
        answer:
          'Account and prospect research, list enrichment and cleanup, inbound lead triage, and drafting personalized outreach at the first-touch stage.',
      },
    ],
  },
  {
    slug: 'pabbly',
    name: 'Pabbly',
    category: 'Workflow Automation',
    badge: 'Paid (lifetime deals)',
    ctaLabel: 'Try Pabbly',
    ctaPrimary: true,
    listed: true,
    logo: '/brand/tools/pabbly.svg',
    aliases: ['Pabbly'],
    blurb:
      'Pabbly Connect is a budget-friendly Zapier alternative with flat pricing that does not charge per internal step, popular for high-volume automations on a fixed cost.',
    bestFor:
      'Cost-sensitive teams running lots of simple-to-moderate automations that want predictable pricing.',
    body: [
      'Pabbly Connect competes with Zapier and Make on price. Its pricing does not meter every internal action the way some competitors do, and it frequently runs one-time deals, which makes it attractive for operators who want a lot of task volume without a climbing monthly bill.',
      'It will not match Make or n8n for complex branching, data transformation, or developer control, so it lands best as the workhorse for straightforward connect-A-to-B jobs. For this audience it is a useful "third option" in any Zapier vs Make vs n8n comparison.',
    ],
    faqs: [
      {
        question: 'Is Pabbly a good Zapier alternative?',
        answer:
          'For high-volume, straightforward automations on a budget, yes. Its pricing model is the main draw over Zapier.',
      },
      {
        question: 'How does Pabbly compare to Make and n8n?',
        answer:
          'Make and n8n offer deeper logic and data handling. Pabbly trades some of that power for lower, more predictable cost.',
      },
      {
        question: 'Does Pabbly charge per step?',
        answer:
          'It does not meter internal steps the way some tools do, which is why teams running many multi-step flows look at it.',
      },
    ],
  },
  {
    slug: 'lusha',
    name: 'Lusha',
    category: 'Lead Data & Enrichment',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Lusha',
    ctaPrimary: true,
    listed: true,
    logo: '/brand/tools/lusha.svg',
    aliases: ['Lusha'],
    blurb:
      'Lusha is a B2B contact data tool known for accurate direct dials and emails, with a browser extension that pulls verified contacts straight from LinkedIn.',
    bestFor:
      'Reps and small teams that need quick, accurate direct dials and emails without a heavy data contract.',
    body: [
      'Lusha is the grab-a-contact tool: its extension surfaces verified phone numbers and emails while you browse LinkedIn or a company site, and a free tier covers light usage. For SDRs who live in LinkedIn Sales Navigator, it is a fast way to turn a profile into a dialable number.',
      'At the team level it competes with Apollo and Cognism. Apollo bundles sequencing and a larger database, while Lusha leans on contact accuracy and ease of use. It slots cleanly into comparisons with the enrichment tools this site already covers.',
    ],
    faqs: [
      {
        question: 'What is Lusha best known for?',
        answer:
          'Accurate direct-dial phone numbers and verified emails, delivered through a simple browser extension.',
      },
      {
        question: 'Lusha vs Apollo: which should I pick?',
        answer:
          'Apollo is the broader all-in-one with sequencing and a bigger database. Lusha is lighter and prized for contact accuracy and speed.',
      },
      {
        question: 'Is there a free version of Lusha?',
        answer:
          'Yes, a free tier covers a small number of credits per month, enough to test data quality.',
      },
    ],
  },
  {
    slug: 'synthflow',
    name: 'Synthflow',
    category: 'AI Voice & Dialers',
    badge: 'Paid',
    ctaLabel: 'Try Synthflow',
    ctaPrimary: true,
    listed: false,
    aliases: ['Synthflow'],
    blurb:
      'Synthflow lets you build no-code AI voice agents that answer and make calls, qualify leads, and book meetings, without a developer.',
    bestFor:
      'Teams testing AI voice for inbound qualification, appointment setting, or after-hours coverage.',
    body: [
      'Synthflow is part of the brand-new AI voice category: instead of routing calls to humans, you configure an AI agent that holds a natural phone conversation, captures the outcome, and hands off when needed. The no-code builder makes it reachable for RevOps teams rather than only voice engineers.',
      'Because the category is so young, neutral comparison content barely exists, which is exactly the early-traffic opening this site is chasing. Synthflow is worth framing against developer-first voice infrastructure like Vapi and Bland for buyers deciding between configure-it and build-it.',
    ],
    faqs: [
      {
        question: 'What is an AI voice agent?',
        answer:
          'It is software that conducts a real phone conversation, handling inbound or outbound calls to qualify, answer, or book, then logs the result.',
      },
      {
        question: 'Do I need developers to use Synthflow?',
        answer:
          'No. It is built no-code, which is the main difference from infrastructure tools like Vapi or Bland that assume engineering effort.',
      },
      {
        question: 'What are good first use cases?',
        answer:
          'Inbound lead qualification, appointment setting, and after-hours coverage are the lowest-risk places to start.',
      },
    ],
  },
  {
    slug: 'surfer',
    name: 'Surfer',
    category: 'SEO & Content',
    badge: 'Paid',
    ctaLabel: 'Try Surfer',
    ctaPrimary: true,
    listed: false,
    aliases: ['Surfer SEO', 'Surfer'],
    blurb:
      'Surfer is an SEO content platform that scores and optimizes your writing against what is already ranking, blending AI drafting with on-page guidance.',
    bestFor:
      'Content-led teams and operators (like this site) who publish regularly and want a repeatable on-page SEO process.',
    body: [
      'Surfer turns ranking research into a checklist: it analyzes the current top results for a query and tells you the terms, structure, and depth your page needs to compete. For a publishing motion it shortens the gap between "draft" and "optimized" without guessing.',
      'It is directly relevant to the way this site grows, which makes it easy to write about from real use rather than theory. Natural comparisons are Surfer vs Clearscope and Surfer vs Frase, with Frase pushing hardest on the newer GEO and AI-search-visibility angle.',
    ],
    faqs: [
      {
        question: 'What does Surfer do?',
        answer:
          'It grades your content against the pages currently ranking for a keyword and gives concrete on-page guidance to close the gap.',
      },
      {
        question: 'Surfer vs Clearscope vs Frase?',
        answer:
          'All three optimize content. Surfer is strong on workflow and value, Clearscope on enterprise polish, and Frase on GEO and AI-visibility tracking.',
      },
      {
        question: 'Does Surfer write content too?',
        answer:
          'It includes AI drafting, but most teams use it mainly to optimize human-written or human-edited drafts.',
      },
    ],
  },
  {
    slug: 'cal-com',
    name: 'Cal.com',
    category: 'Scheduling',
    badge: 'Free (open source)',
    badgeFree: true,
    ctaLabel: 'Try Cal.com',
    ctaPrimary: true,
    logo: '/brand/tools/cal-com.png',
    listed: true,
    aliases: ['Cal.com'],
    blurb:
      'Cal.com is the open-source scheduling platform, an extensible Calendly alternative you can self-host or run as a hosted product, with deep routing and workflow hooks.',
    bestFor:
      'Teams that want Calendly-style scheduling with more control, routing logic, or self-hosting.',
    body: [
      'Cal.com covers the familiar scheduling job, sharing availability and booking meetings, but its open-source core and API make it the choice for teams that want to customize routing, embed booking deeply, or avoid per-seat lock-in. Round-robin, routing forms, and workflow triggers cover the RevOps cases that matter for inbound speed-to-lead.',
      'For this audience the hook is that it plugs cleanly into automation: a booking can fire an n8n or Make workflow to enrich, route, and notify. Unlike Calendly, it also has a public affiliate program, which is part of why it earns a spot on the apply-first list.',
    ],
    faqs: [
      {
        question: 'How is Cal.com different from Calendly?',
        answer:
          'Cal.com is open source and far more extensible, with self-hosting and deeper routing. Calendly is more polished out of the box but less customizable.',
      },
      {
        question: 'Can I self-host Cal.com?',
        answer:
          'Yes. The self-hosted option is free and gives full control over data, with a hosted plan available if you do not want to run it.',
      },
      {
        question: 'Does Cal.com support lead routing?',
        answer:
          'Yes, including round-robin and routing forms, which makes it useful for inbound speed-to-lead workflows.',
      },
    ],
  },
  {
    slug: 'lindy',
    name: 'Lindy',
    category: 'AI Agents',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Lindy',
    ctaPrimary: true,
    listed: false,
    aliases: ['Lindy'],
    blurb:
      'Lindy is an AI assistant builder for creating agents that handle email, scheduling, CRM updates, and outreach across your tools, triggered by events or on a schedule.',
    bestFor:
      'Operators who want AI agents wired into their existing stack with less setup than a raw workflow tool.',
    body: [
      'Lindy lets you spin up task-specific AI agents ("Lindies") that watch for a trigger, an inbound email, a new meeting, a CRM change, and then take action across connected apps. It targets the same instinct as Relevance AI but leans toward ready-made assistant templates over building from scratch.',
      'For GTM it shows up in inbox triage, meeting prep and follow-up, and keeping the CRM current. It pairs naturally with the workflow tools this site covers, handling the judgment steps while Make or n8n move the data.',
    ],
    faqs: [
      {
        question: 'What is Lindy used for in GTM?',
        answer:
          'Common jobs are email triage and drafting, meeting prep and follow-up, CRM updates, and light outreach, all run by event-triggered agents.',
      },
      {
        question: 'Lindy vs Relevance AI?',
        answer:
          'Both build AI agents. Lindy emphasizes ready-to-use assistant templates and integrations, while Relevance AI leans toward custom multi-agent builds.',
      },
      {
        question: 'Is there a free plan?',
        answer:
          'Yes, a free tier lets you build and run a first agent before upgrading.',
      },
    ],
  },
  {
    slug: 'reply-io',
    name: 'Reply.io',
    category: 'Sales Engagement',
    badge: 'Free trial',
    ctaLabel: 'Try Reply.io',
    ctaPrimary: true,
    listed: false,
    logo: '/brand/tools/reply-io.webp',
    aliases: ['Reply.io'],
    blurb:
      'Reply.io is a multichannel sales engagement platform with email, LinkedIn, and calls, plus Jason, an AI SDR layer that automates prospecting and replies.',
    bestFor:
      'Teams that want true multichannel sequencing in one tool, with an optional AI SDR on top.',
    body: [
      'Reply.io is a mature sequencer that coordinates touches across email, LinkedIn, and phone, with the deliverability and reporting that heavier outbound teams expect. That breadth is the difference from email-only tools like Instantly or Smartlead.',
      'Its Jason AI agent puts Reply.io in the AI SDR conversation too, automating research, first drafts, and follow-up inside the same platform you already sequence in. For buyers that means one comparison can cover both "best multichannel sequencer" and "AI SDR built into my engagement tool."',
    ],
    faqs: [
      {
        question: 'What channels does Reply.io support?',
        answer:
          'Email, LinkedIn, and calls in coordinated sequences, which is its main edge over email-only senders.',
      },
      {
        question: 'What is Jason in Reply.io?',
        answer:
          'Jason is Reply.io’s AI SDR layer that automates prospecting, multichannel outreach, and meeting booking inside the platform.',
      },
      {
        question: 'Reply.io vs Instantly or Smartlead?',
        answer:
          'Instantly and Smartlead focus on high-volume email deliverability. Reply.io adds multichannel sequencing and a built-in AI SDR.',
      },
    ],
  },
  {
    slug: 'krispcall',
    logo: '/brand/tools/krispcall.png',
    name: 'KrispCall',
    category: 'AI Voice & Dialers',
    badge: 'Paid',
    ctaLabel: 'Try KrispCall',
    ctaPrimary: true,
    listed: false,
    aliases: ['KrispCall'],
    blurb:
      'KrispCall is a cloud phone system and dialer for sales and support teams, with international numbers, call automation, and CRM integrations at SMB pricing.',
    bestFor:
      'SMB sales and support teams that need a modern business phone and dialer without enterprise pricing.',
    body: [
      'KrispCall provides the calling layer many small teams need: business numbers across many countries, a power dialer, call recording, and integrations that log activity to the CRM. It targets the affordable end of the market rather than the high-volume parallel dialers like Nooks and Orum.',
      'For a RevOps stack it is the practical pick when you want reliable calling and basic automation without a five-figure commitment. It compares against JustCall and CloudTalk in the SMB dialer tier.',
    ],
    faqs: [
      {
        question: 'What is KrispCall used for?',
        answer:
          'A cloud business phone and sales dialer with international numbers, call recording, automation, and CRM logging.',
      },
      {
        question: 'How does it compare to Nooks or Orum?',
        answer:
          'Nooks and Orum are high-volume parallel dialers priced for enterprise SDR floors. KrispCall is an affordable phone-and-dialer for smaller teams.',
      },
      {
        question: 'Does KrispCall integrate with CRMs?',
        answer:
          'Yes, it integrates with common CRMs so calls and outcomes are logged automatically.',
      },
    ],
  },
  {
    slug: 'laxis',
    logo: '/brand/tools/laxis.svg',
    name: 'Laxis',
    category: 'Meeting Intelligence',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Laxis',
    ctaPrimary: true,
    listed: false,
    aliases: ['Laxis'],
    blurb:
      'Laxis is an AI meeting assistant and sales copilot that records, transcribes, and summarizes calls, then turns them into CRM updates and follow-up drafts.',
    bestFor:
      'Customer-facing teams that want meeting notes to flow straight into CRM updates and follow-ups.',
    body: [
      'Laxis captures and summarizes conversations like other notetakers, but leans toward the revenue use case: pulling action items, syncing structured notes to the CRM, and drafting follow-up messages so reps spend less time on admin. A free tier covers light usage.',
      'It competes with Fathom, Fireflies, tl;dv, and Avoma. The differentiator to test is how well its CRM sync and follow-up automation hold up, since that is where meeting intelligence either saves real time or just produces another transcript.',
    ],
    faqs: [
      {
        question: 'What does Laxis do?',
        answer:
          'It records, transcribes, and summarizes meetings, extracts action items, and can update the CRM and draft follow-ups automatically.',
      },
      {
        question: 'How is Laxis different from Fireflies or Fathom?',
        answer:
          'All transcribe and summarize. Laxis emphasizes the sales copilot angle: CRM sync and follow-up drafting rather than notes alone.',
      },
      {
        question: 'Is there a free plan?',
        answer:
          'Yes, a free tier lets you try transcription and summaries before upgrading.',
      },
    ],
  },
  {
    slug: 'close',
    logo: '/brand/tools/close.png',
    name: 'Close',
    category: 'CRM',
    badge: 'Free trial',
    ctaLabel: 'Try Close',
    ctaPrimary: true,
    listed: false,
    aliases: ['Close CRM', 'Close.com'],
    blurb:
      'Close is a sales-first CRM with built-in calling, SMS, and email sequencing, designed for SMB teams that want to sell from one screen instead of bolting tools onto a generic CRM.',
    bestFor:
      'Inside sales and SMB teams that live in the CRM and want calling plus sequencing built in.',
    body: [
      'Close is built for reps who spend the day working a list. Calling, SMS, and email sequences are native, so the CRM is also the dialer and the sequencer, which removes a lot of the integration glue that HubSpot or Salesforce setups accumulate.',
      'It is opinionated toward high-activity inside sales rather than complex marketing operations, which is the trade-off against HubSpot. For SMB GTM teams it is a strong "sell from one screen" alternative and a clean comparison target against Pipedrive and Nutshell.',
    ],
    faqs: [
      {
        question: 'Who is Close CRM for?',
        answer:
          'SMB and inside sales teams that want calling, SMS, and email sequencing built into the CRM rather than added through integrations.',
      },
      {
        question: 'Close vs HubSpot?',
        answer:
          'HubSpot is broader across marketing and service. Close is narrower and sales-first, with native communication tools and a faster rep workflow.',
      },
      {
        question: 'Does Close include a dialer?',
        answer:
          'Yes, calling and SMS are built in, which is one of its main selling points.',
      },
    ],
  },
  {
    slug: 'nutshell',
    logo: '/brand/tools/nutshell.png',
    name: 'Nutshell',
    category: 'CRM',
    badge: 'Free trial',
    ctaLabel: 'Try Nutshell',
    ctaPrimary: true,
    listed: false,
    aliases: ['Nutshell'],
    blurb:
      'Nutshell is an easy-to-use SMB CRM that bundles pipeline management, email sequences, and basic marketing, aimed at small teams that find HubSpot heavy and overpriced.',
    bestFor:
      'Small teams that want a friendly, affordable CRM with sequencing and light marketing in one place.',
    body: [
      'Nutshell targets the small business that wants a CRM they will actually use: simple pipelines, built-in email sequences, and reporting that does not require an admin. It bundles light marketing features so very small teams can avoid a separate email tool early on.',
      'It plays in the same SMB tier as Pipedrive and Close. The decision usually comes down to how much native communication and marketing you want bundled versus how lightweight you want the core CRM to stay.',
    ],
    faqs: [
      {
        question: 'Is Nutshell a good HubSpot alternative for small teams?',
        answer:
          'For many small teams, yes. It covers pipeline, sequences, and light marketing at lower cost and complexity than HubSpot.',
      },
      {
        question: 'Nutshell vs Pipedrive?',
        answer:
          'Both are SMB-friendly. Nutshell bundles more marketing and email features, while Pipedrive is leaner and pipeline-first.',
      },
      {
        question: 'Does Nutshell include email marketing?',
        answer:
          'It includes sequences and light marketing features, enough for small teams to start without a separate platform.',
      },
    ],
  },
  {
    slug: 'getresponse',
    name: 'GetResponse',
    category: 'Email & Marketing Automation',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try GetResponse',
    ctaPrimary: true,
    listed: false,
    aliases: ['GetResponse'],
    blurb:
      'GetResponse is an email marketing and automation platform with landing pages, funnels, and webinars, aimed at SMBs that want marketing in one suite.',
    bestFor:
      'SMBs and creators who want email automation, landing pages, and funnels under one roof.',
    body: [
      'GetResponse is a broad SMB marketing suite: list management, automation flows, landing pages, and even webinars sit in one product, which appeals to small teams that do not want to assemble a stack. Automation is visual and approachable for non-technical marketers.',
      'For this audience it is a comparison point against Brevo, ActiveCampaign, and the creator-first tools like Kit. The deciding factor is usually how much of the all-in-one suite you will actually use versus a more focused tool.',
    ],
    faqs: [
      {
        question: 'What is GetResponse best for?',
        answer:
          'Small teams that want email marketing, automation, landing pages, and funnels in a single platform.',
      },
      {
        question: 'GetResponse vs Brevo or ActiveCampaign?',
        answer:
          'All three do email automation. GetResponse leans all-in-one with landing pages and webinars, while the others differ on pricing model and automation depth.',
      },
      {
        question: 'Is there a free plan?',
        answer:
          'Yes, GetResponse offers a free tier for small lists to get started.',
      },
    ],
  },
  {
    slug: 'adcreative',
    name: 'AdCreative.ai',
    category: 'Advertising & Creative',
    badge: 'Free trial',
    ctaLabel: 'Try AdCreative.ai',
    ctaPrimary: true,
    listed: false,
    aliases: ['AdCreative.ai', 'AdCreative'],
    blurb:
      'AdCreative.ai generates conversion-focused ad creative and copy in bulk, scoring variants so performance marketers can ship more tests faster.',
    bestFor:
      'Performance marketers and small teams that need a steady volume of on-brand ad creative without a designer.',
    body: [
      'AdCreative.ai automates the creative bottleneck in paid acquisition: it produces ad visuals and copy at volume, predicts which variants are likely to perform, and keeps output on-brand once you set up your assets. For lean GTM teams that is more tests live with less design dependency.',
      'It is a clean fit for content that ties demand generation to the rest of the automation stack, and the recurring revenue-share program makes it attractive to write about. Natural comparisons are against other AI creative tools and the native creative features inside ad platforms.',
    ],
    faqs: [
      {
        question: 'What does AdCreative.ai do?',
        answer:
          'It generates ad visuals and copy in bulk and scores variants for likely performance, speeding up creative testing.',
      },
      {
        question: 'Who is it for?',
        answer:
          'Performance marketers and small teams that need consistent ad creative volume without a dedicated designer.',
      },
      {
        question: 'Does it keep creative on-brand?',
        answer:
          'Yes, once you load your brand assets, generated creative follows your colors, fonts, and style.',
      },
    ],
  },
  {
    slug: 'motion',
    name: 'Motion',
    category: 'Scheduling & Productivity',
    badge: 'Free trial',
    ctaLabel: 'Try Motion',
    ctaPrimary: true,
    listed: false,
    aliases: ['Motion'],
    blurb:
      'Motion is an AI calendar and project planner that auto-schedules tasks, meetings, and deadlines into your day, rebuilding the plan as things change.',
    bestFor:
      'Founders and individual operators who want their tasks and calendar planned automatically.',
    body: [
      'Motion blends a calendar, task manager, and project tool, then uses AI to slot work into open time and reshuffle automatically when a meeting or priority shifts. The pitch is that you stop manually time-blocking and let the planner protect focus time around your meetings.',
      'It is less a GTM-specific tool and more a productivity layer for the people running GTM, which still makes it a relevant recommendation and an easy, broadly appealing affiliate to feature in workflow and productivity content.',
    ],
    faqs: [
      {
        question: 'What does Motion do?',
        answer:
          'It automatically schedules your tasks, meetings, and deadlines into your calendar and re-plans as things change.',
      },
      {
        question: 'Who benefits most from Motion?',
        answer:
          'Founders and individual contributors with packed calendars who want planning handled for them.',
      },
      {
        question: 'Is Motion a CRM or sales tool?',
        answer:
          'No, it is a productivity and planning tool. It supports the people doing GTM rather than running the GTM motion itself.',
      },
    ],
  },
  {
    slug: 'brevo',
    logo: '/brand/tools/brevo.png',
    name: 'Brevo',
    category: 'Email & Marketing Automation',
    badge: 'Free tier available',
    badgeFree: true,
    ctaLabel: 'Try Brevo',
    ctaPrimary: true,
    listed: false,
    aliases: ['Brevo', 'Sendinblue'],
    blurb:
      'Brevo (formerly Sendinblue) is an affordable email, SMS, and marketing automation platform with a CRM, billing on volume rather than per contact.',
    bestFor:
      'Cost-conscious SMBs that want email plus SMS and light CRM without paying per contact.',
    body: [
      'Brevo is the value pick in marketing automation. Its send-based pricing (rather than per-contact) suits teams with large lists and modest send volume, and it bundles email, SMS, a basic CRM, and automation into one affordable platform.',
      'For this audience it slots into the same comparisons as GetResponse and ActiveCampaign, and as a budget alternative to heavier suites. The deciding factor is usually pricing model fit and how much automation depth you need.',
    ],
    faqs: [
      {
        question: 'What is Brevo?',
        answer:
          'Formerly Sendinblue, it is an email, SMS, and marketing automation platform with a basic CRM, known for affordable, volume-based pricing.',
      },
      {
        question: 'Why does Brevo pricing differ from competitors?',
        answer:
          'It bills primarily on email volume rather than per contact, which can be much cheaper for large lists that send infrequently.',
      },
      {
        question: 'Does Brevo include automation?',
        answer:
          'Yes, it has visual marketing automation alongside email and SMS, suitable for SMB needs.',
      },
    ],
  },

  // --- LP-builder additions (listed:false; flip to listed:true + add a logo once approved/published). ---
  {
    slug: "maildoso",
    name: "Maildoso",
    category: "Cold Email & Deliverability",
    badge: "Free trial",
    ctaLabel: "Try Maildoso",
    ctaPrimary: true,
    listed: false,
    aliases: ["Maildoso", "maildoso"],
    blurb: "Maildoso provisions and warms cold email inboxes and sending domains so outbound teams avoid the spam folder without managing infrastructure themselves.",
    bestFor: "Outbound sales teams or agencies that send high volumes of cold email and want managed domain and inbox setup without a dedicated deliverability engineer.",
    body: [
      "Maildoso sits in what is still a relatively new and narrowing category: managed inbox and domain infrastructure for cold email. Rather than requiring users to manually purchase domains, configure DNS records, and run warmup sequences, Maildoso handles provisioning, warmup, and ongoing reputation monitoring as a service. The angle is operational simplicity for teams that want clean sending infrastructure without owning the plumbing. It targets agencies running multi-client campaigns and in-house SDR teams scaling past a handful of sending accounts.",
      "In a RevOps stack, Maildoso sits one layer below the sequencer. Teams typically connect it alongside tools like Instantly, Smartlead, or Lemlist, which handle sequence logic and personalization, while Maildoso supplies the warmed inboxes. Buyers comparing options in this infrastructure layer will also look at Inframail, Mailreef, and the managed inbox features built into Instantly itself. The differentiator to evaluate is how many inboxes are included per billing tier, what warmup methodology is used, and whether the tool monitors deliverability reactively or proactively rotates domains under pressure.",
    ],
    faqs: [
      {
        question: "What exactly does Maildoso do?",
        answer: "Maildoso creates and warms email inboxes and sending domains on your behalf, so you can plug ready-to-send accounts into your cold email sequencer without manual DNS setup or warmup campaigns.",
      },
      {
        question: "How does Maildoso compare to Inframail or Instantly's built-in inboxes?",
        answer: "All three provision inboxes for cold email, but the differences come down to pricing model (per inbox vs. flat fee), warmup approach, and how tightly the inboxes are coupled to a specific sequencing platform. Maildoso is sequencer-agnostic, which matters if you switch tools or run multiple senders.",
      },
      {
        question: "Who should probably not use Maildoso?",
        answer: "Teams sending fewer than a few hundred emails per week will likely find the overhead of a dedicated inbox infrastructure tool unnecessary compared to simply warming inboxes manually inside their existing sequencer.",
      },
    ],
  },
  {
    slug: "trigify",
    name: "Trigify",
    category: "Website Visitor ID & Signals",
    badge: "Free trial",
    ctaLabel: "Try Trigify",
    ctaPrimary: true,
    listed: false,
    aliases: ["Trigify", "trigify.io"],
    blurb: "Trigify surfaces LinkedIn and social activity signals so sales teams can trigger outreach at the moment a prospect shows relevant buying behavior.",
    bestFor: "B2B sales teams doing LinkedIn-led outreach who want to prioritize prospects based on real-time social engagement rather than static list data.",
    body: [
      "Trigify is in a new and still-forming category that sits at the intersection of social listening and sales signal detection. It monitors LinkedIn activity, including job changes, post engagement, and company-level signals, and turns those events into outreach triggers. The core value proposition is timing: rather than reaching out to a cold list, reps contact prospects at a moment when a signal suggests relevance or intent. This distinguishes it from traditional website visitor identification tools, which are IP-based and limited to people who land on your own domain.",
      "In a GTM stack, Trigify typically feeds a sales engagement platform or a CRM workflow, passing enriched signal data to a sequencer or alerting an SDR directly. Buyers evaluating this category will compare it against Aware (LinkedIn engagement tracking), Taplio for personal brand analytics, and broader intent platforms like Bombora or G2 Buyer Intent that capture different signal types. The honest trade-off is coverage versus signal specificity: social signals from Trigify are high-intent but narrower in volume than IP-based or third-party intent networks.",
    ],
    faqs: [
      {
        question: "What kind of signals does Trigify track?",
        answer: "Trigify primarily tracks LinkedIn-based signals such as post engagement, profile activity, job changes, and company hiring patterns, then surfaces these as triggers for outreach workflows.",
      },
      {
        question: "How does Trigify compare to a traditional website visitor ID tool like Clearbit Reveal or Leadfeeder?",
        answer: "Website visitor ID tools identify companies visiting your own site via IP lookup, while Trigify captures off-site social signals regardless of whether a prospect has visited your domain. The two approaches are complementary rather than directly competitive.",
      },
      {
        question: "Who is Trigify not a good fit for?",
        answer: "Teams selling into markets where prospects are not active on LinkedIn, or companies that lack the SDR capacity to act on real-time signals, will not get full value from the tool.",
      },
    ],
  },
  {
    slug: "fullenrich",
    name: "FullEnrich",
    category: "Lead Data & Enrichment",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try FullEnrich",
    ctaPrimary: true,
    listed: false,
    aliases: ["FullEnrich", "Full Enrich", "fullenrich"],
    blurb: "FullEnrich runs contact enrichment queries across multiple data providers in sequence, improving email and phone match rates compared to relying on a single source.",
    bestFor: "RevOps teams and growth marketers who need high match-rate contact data but want to avoid paying for a full Clay subscription or managing multiple data provider contracts separately.",
    body: [
      "FullEnrich is a waterfall enrichment tool, a category that has emerged clearly only in the last two years. The idea is straightforward: instead of querying one data provider and accepting whatever match rate that vendor offers, the tool fires the same lookup sequentially (or in parallel) across multiple providers, Apollo, Hunter, Dropcontact, and others, and returns the first verified result. This materially improves match rates for email and mobile phone data, particularly for European contacts where US-centric databases have historically poor coverage. FullEnrich packages this logic into a relatively simple interface with CSV upload, API access, and CRM integrations.",
      "The most common comparison a buyer will run is FullEnrich versus Clay. Clay is a broader data orchestration and workflow platform that also supports waterfall enrichment but requires more setup and carries a higher price point, making it better suited to teams who want to build complex enrichment and personalization workflows. FullEnrich is narrower in scope and positioned for teams that specifically want better contact data match rates without the learning curve. Other comparisons include Findymail (email-focused waterfall), Prospeo, and Enrow. The deciding factors are usually the provider mix in the waterfall, credit pricing, and CRM or sequencer native integrations.",
    ],
    faqs: [
      {
        question: "What is waterfall enrichment and why does it matter?",
        answer: "Waterfall enrichment means querying multiple data sources in sequence until a verified result is found, which consistently produces higher match rates than any single provider can deliver on its own.",
      },
      {
        question: "How does FullEnrich compare to Clay?",
        answer: "Clay is a full data orchestration platform where waterfall enrichment is one feature among many, while FullEnrich focuses specifically on contact enrichment match rates with a simpler setup. Teams wanting just better email and phone data will find FullEnrich faster to implement; teams wanting to build conditional workflows, AI personalization, or complex multi-step automations will likely outgrow it.",
      },
      {
        question: "Does FullEnrich work for non-US contact lists?",
        answer: "Yes, and European coverage is one of the explicit selling points, since the waterfall includes providers with stronger EMEA data than purely US-centric databases like Apollo.",
      },
    ],
  },
  {
    slug: "attio",
    name: "Attio",
    category: "CRM",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try Attio",
    ctaPrimary: true,
    listed: false,
    aliases: ["Attio", "attio"],
    blurb: "Attio is a flexible, data-model-first CRM built for modern GTM teams that need custom objects, real-time enrichment, and AI-assisted workflows without heavy admin overhead.",
    bestFor: "Fast-growing B2B startups and scale-ups that have outgrown spreadsheets but find Salesforce or HubSpot too rigid or too expensive to configure for their specific sales motion.",
    body: [
      "Attio takes a different structural approach from legacy CRMs by treating the data model as a first-class concern rather than an afterthought. Users can define custom objects, attributes, and relationships without needing a Salesforce admin, and the interface surfaces records, lists, and views in a way that resembles a modern database tool more than a traditional sales CRM. The platform has added AI features progressively, including automated data enrichment on contact and company records, AI-assisted note summarization, and workflow triggers based on record changes. It also has a developer-friendly API, which matters for RevOps teams connecting it to enrichment tools, product analytics, or data warehouses.",
      "Attio competes most directly with HubSpot CRM (at the free and starter tiers), Pipedrive, and newer entrants like Twenty (open source) and Folk. At the enterprise end, teams will compare it against Salesforce, though Attio is explicitly not targeting that complexity level yet. The strongest case for Attio over HubSpot is schema flexibility and a cleaner interface without the addon-driven cost creep that HubSpot is known for. The strongest case for HubSpot over Attio is ecosystem maturity, the number of native integrations, and marketing automation depth. Attio is growing fast and is worth evaluating for any team starting a CRM search in 2025 or 2026.",
    ],
    faqs: [
      {
        question: "Is Attio a real CRM or more of a database tool?",
        answer: "Attio is a fully functional CRM with pipelines, contact and company management, email sync, and workflow automation, but its data model flexibility means it can also behave like a structured database, which is intentional and a core differentiator.",
      },
      {
        question: "How does Attio compare to HubSpot?",
        answer: "HubSpot has a much larger native integration library and more mature marketing automation, while Attio offers more flexible data modeling and tends to be more cost-predictable at early growth stages. Teams that primarily need CRM plus sales engagement will often find Attio sufficient; teams wanting CRM plus email marketing plus ads management in one platform will find HubSpot more complete.",
      },
      {
        question: "Does Attio work for non-SaaS or non-tech companies?",
        answer: "The product is general enough to work outside tech, but the interface and positioning skew toward software-native teams; companies that rely heavily on phone-based sales or field sales workflows may find the tool less optimized for their motion.",
      },
    ],
  },
  {
    slug: "bland-ai",
    name: "Bland AI",
    category: "AI Voice & Dialers",
    badge: "Paid",
    ctaLabel: "Try Bland AI",
    ctaPrimary: true,
    listed: false,
    aliases: ["Bland AI", "Bland.ai", "bland-ai"],
    blurb: "Bland AI is an AI phone calling platform that lets businesses deploy programmable voice agents for inbound and outbound calls at scale without human agents on every line.",
    bestFor: "Operations and RevOps teams that need to automate high-volume phone touchpoints, including lead qualification, appointment reminders, or inbound triage, where call scripting is predictable enough for an AI agent to handle.",
    body: [
      "Bland AI sits in what is genuinely a brand-new category as of 2024 and 2025: AI voice infrastructure for business calling. The platform provides an API and a no-code interface to build voice agents that can conduct real phone calls, handle turn-based conversation, process responses, and take defined actions such as booking a meeting or routing to a human. Voice quality and latency have improved significantly at the infrastructure level, making conversational AI calling plausible for scripted workflows in a way that was not commercially viable two years ago. Bland AI positions itself as infrastructure, meaning it targets developers and RevOps builders as much as end-user sales teams.",
      "The AI voice calling category has several credible players emerging simultaneously, and buyers should compare Bland AI against Vapi (also developer-focused voice API infrastructure), Retell AI (similar positioning), and ElevenLabs Conversational AI (which adds voice quality depth). On the sales-tool side, traditional dialers like Aircall, Kixie, and Orum are adding AI features, but they are building from a human-agent-first model. The honest buyer question is whether the use case requires full AI autonomy (Bland, Vapi, Retell) or AI assist on top of human calls (Orum, Kixie). Compliance around AI calling disclosure requirements (TCPA in the US and equivalents elsewhere) is a real due-diligence item in this category.",
    ],
    faqs: [
      {
        question: "What is Bland AI and how is it different from a regular auto-dialer?",
        answer: "Bland AI conducts full two-way phone conversations using an AI voice agent, not just automated playback. Unlike a predictive dialer that connects a human rep when someone answers, Bland AI's agent handles the conversation end-to-end based on a defined script or prompt.",
      },
      {
        question: "How does Bland AI compare to Vapi or Retell AI?",
        answer: "All three are developer-oriented AI voice infrastructure platforms with similar core capabilities; differences come down to latency benchmarks, supported telephony providers, pricing per minute, voice model options, and the depth of their no-code workflow builders for non-developer users.",
      },
      {
        question: "Are there legal risks to using AI calling tools like Bland AI?",
        answer: "Yes, regulations including TCPA in the US require disclosure that a caller is an AI in many contexts, and rules vary by country and call type. Buyers should verify compliance requirements for their specific use case before deploying at volume.",
      },
    ],
  },

  // --- LP-builder additions (listed:false; flip to listed:true + add a logo once approved/published). ---
  {
    slug: "mailforge",
    name: "Mailforge",
    category: "Cold Email & Deliverability",
    badge: "Free trial",
    ctaLabel: "Try Mailforge",
    ctaPrimary: true,
    listed: false,
    aliases: ["Mailforge", "mailforge.ai"],
    blurb: "Mailforge provisions and warms cold email inboxes and domains at scale, built as part of the Salesforge ecosystem for high-volume outbound teams.",
    bestFor: "Outbound teams running multi-inbox cold email campaigns who need infrastructure management separate from their sequencing tool.",
    body: [
      "Mailforge handles the infrastructure layer of cold email: domain purchasing, mailbox provisioning, DNS configuration, and warmup sequences. It sits inside the Salesforge product family, meaning it is designed to feed sending capacity directly into Salesforge sequences, though the inboxes it creates can be routed to other senders. The tool is aimed at teams that want to scale sending volume without manually managing dozens of Google Workspace or Microsoft 365 accounts.",
      "In a RevOps stack, Mailforge occupies the deliverability and inbox layer that tools like Instantly and Smartlead bundle into their platforms but that many teams prefer to keep modular. Buyers comparing options will typically look at Instantly's inbox management features, Smartlead's agency infrastructure, and Infraforge (also in the Salesforge ecosystem) alongside Mailforge, depending on whether they want an all-in-one or a separated infra layer.",
    ],
    faqs: [
      {
        question: "What does Mailforge actually do?",
        answer: "Mailforge automates the setup and warmup of cold email domains and inboxes, removing the manual work of configuring DNS records and gradually increasing send volume to build sender reputation.",
      },
      {
        question: "How does Mailforge compare to Instantly for inbox management?",
        answer: "Instantly bundles inbox rotation and warmup inside its sequencing platform, while Mailforge is a standalone infrastructure tool inside the Salesforge ecosystem, which suits teams that want to separate infra from sequencing.",
      },
      {
        question: "Who should not use Mailforge?",
        answer: "Teams already satisfied with the inbox management inside Instantly or Smartlead may not need a separate infra tool. Mailforge makes the most sense if you are using Salesforge for sequencing or want modular control over your sending infrastructure.",
      },
    ],
  },
  {
    slug: "surfe",
    name: "Surfe",
    category: "Lead Data & Enrichment",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try Surfe",
    ctaPrimary: true,
    listed: false,
    aliases: ["Surfe", "Surfe.com"],
    blurb: "Surfe is a Chrome extension that syncs LinkedIn activity directly to your CRM and enriches contacts with verified email and phone data in one click.",
    bestFor: "Sales reps who prospect on LinkedIn and want contact data and CRM updates to happen without leaving the browser.",
    body: [
      "Surfe embeds a sidebar inside LinkedIn that lets reps push profiles, messages, and notes into HubSpot, Salesforce, Pipedrive, or other connected CRMs without switching tabs. It also surfaces contact enrichment data, including work email and mobile number, directly on the LinkedIn profile page. The enrichment layer pulls from multiple data providers, which puts it in the emerging waterfall enrichment category where sequential data sources are queried until a verified result is returned. Waterfall enrichment as a defined product category is relatively new, with purpose-built tools emerging since roughly 2023.",
      "In a GTM stack, Surfe replaces the manual copy-paste workflow between LinkedIn and CRM and reduces the need for a separate prospecting tool for reps who live in LinkedIn. Buyers will naturally compare it to Dux-Soup and Phantombuster for LinkedIn automation, to Clay for enrichment depth, and to the native LinkedIn Sales Navigator CRM integrations, depending on how much of the workflow they want automated versus controlled.",
    ],
    faqs: [
      {
        question: "What is Surfe?",
        answer: "Surfe is a Chrome extension that adds a CRM sync panel to LinkedIn, letting sales reps save contacts, log messages, and enrich email and phone data without leaving the LinkedIn interface.",
      },
      {
        question: "How does Surfe compare to Clay for enrichment?",
        answer: "Clay is a workflow builder that runs enrichment at scale across large lists using hundreds of data sources, while Surfe is rep-facing and optimized for one-at-a-time prospecting directly from LinkedIn profiles.",
      },
      {
        question: "Does Surfe work with CRMs other than Salesforce and HubSpot?",
        answer: "Surfe supports several CRMs including Pipedrive and Copper in addition to Salesforce and HubSpot; buyers should confirm current integration availability on the Surfe website before committing.",
      },
    ],
  },
  {
    slug: "leadmagic",
    name: "LeadMagic",
    category: "Lead Data & Enrichment",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try LeadMagic",
    ctaPrimary: true,
    listed: false,
    aliases: ["LeadMagic", "leadmagic.io"],
    blurb: "LeadMagic is a pay-as-you-go enrichment API and waterfall tool that finds verified work emails and mobile numbers from LinkedIn profiles and company data.",
    bestFor: "RevOps teams and growth engineers who want low-cost, credits-based enrichment they can plug into Clay, n8n, or custom workflows.",
    body: [
      "LeadMagic provides enrichment as a service through an API and a simple UI, covering work email lookup, mobile number finding, and LinkedIn profile resolution. It is positioned in the waterfall enrichment category, a relatively new segment (prominent since 2023 to 2024) where multiple underlying data vendors are queried in sequence to maximize match rates without the buyer paying for a single expensive exclusive data license. Pricing is credits-based and designed to be cost-competitive against sourcing the same data through tools with larger feature sets bundled in.",
      "LeadMagic fits RevOps stacks as a data sourcing node inside Clay tables, Make or n8n workflows, or any system that accepts API calls. Teams compare it directly to Datagma, Prospeo, and Hunter for email finding, and to Waterfall (the standalone product) or Clay's own waterfall logic for multi-source enrichment. Its advantage is usually cost per verified contact; its limitation is that it provides less workflow orchestration than Clay and less CRM context than Surfe.",
    ],
    faqs: [
      {
        question: "What is LeadMagic and how does it work?",
        answer: "LeadMagic is a credits-based enrichment service that takes LinkedIn URLs or company domain inputs and returns verified work emails and mobile numbers by querying multiple underlying data sources.",
      },
      {
        question: "How does LeadMagic compare to Clay for enrichment?",
        answer: "Clay is a full workflow and enrichment orchestration platform with a spreadsheet interface, while LeadMagic is a focused enrichment API best used as a data node inside Clay or another automation tool.",
      },
      {
        question: "Who should not use LeadMagic?",
        answer: "Teams that want a self-contained prospecting platform with sequencing, CRM sync, and enrichment in one place will find LeadMagic too narrow; it is built for technical buyers comfortable using APIs or no-code automation builders.",
      },
    ],
  },
  {
    slug: "bettercontact",
    name: "BetterContact",
    category: "Lead Data & Enrichment",
    badge: "Free trial",
    ctaLabel: "Try BetterContact",
    ctaPrimary: true,
    listed: false,
    aliases: ["BetterContact", "Better Contact", "bettercontact.rocks"],
    blurb: "BetterContact is a waterfall enrichment tool that runs contact lists through 20-plus data sources sequentially to return the highest-confidence email and phone matches.",
    bestFor: "Outbound teams and agencies that have contact lists with gaps and want to maximize verified mobile and email match rates before sequencing.",
    body: [
      "BetterContact is built specifically around the waterfall enrichment model, a category that has formalized over 2023 to 2025 as a response to the fragmentation of B2B contact data across many competing vendors. Rather than locking buyers into one data provider, BetterContact queries Apollo, Dropcontact, Hunter, Datagma, and a range of other sources in a defined priority order, stopping when a verified result is found and billing only for successful matches. The result is typically a higher match rate on mobile numbers in particular, which is harder to source from any single provider.",
      "In a GTM stack, BetterContact is most commonly placed between a list-building or ICP filtering step and a cold email or calling sequence. Teams using Clay will compare BetterContact to building their own waterfall logic inside Clay using individual API enrichment steps; the tradeoff is setup time versus flexibility. Other direct comparisons include Findymail for email-only enrichment and Prospeo. BetterContact's differentiation is the managed multi-source waterfall with a simple CSV or API interface that does not require workflow-building skill.",
    ],
    faqs: [
      {
        question: "What is waterfall enrichment and why does BetterContact use it?",
        answer: "Waterfall enrichment means querying multiple data providers in sequence and stopping when a verified result is found, which improves match rates compared to relying on a single data source. BetterContact manages this process so buyers do not have to build it themselves.",
      },
      {
        question: "How does BetterContact compare to building a waterfall inside Clay?",
        answer: "Clay gives more control over enrichment logic and connects to broader workflow automation, but requires setup time; BetterContact is faster to deploy for teams whose only goal is maximizing contact match rates.",
      },
      {
        question: "Does BetterContact charge for failed enrichment attempts?",
        answer: "BetterContact's model is designed to charge only for successful matches, but buyers should confirm the exact credit and billing rules on their current pricing page before running large lists.",
      },
    ],
  },
  {
    slug: "vector",
    name: "Vector",
    category: "Website Visitor ID & Signals",
    badge: "Free trial",
    ctaLabel: "Try Vector",
    ctaPrimary: true,
    listed: false,
    aliases: ["Vector", "vector.co"],
    blurb: "Vector identifies the individual people visiting your website, not just companies, and routes that signal data into outbound workflows for timely follow-up.",
    bestFor: "B2B sales and marketing teams that want to act on person-level website intent signals rather than account-level company identification alone.",
    body: [
      "Vector sits in the website visitor identification category and focuses on person-level identification, meaning it attempts to resolve individual visitor identities rather than only the company or IP range. Person-level visitor ID is a relatively new capability in this space, enabled by identity graph partnerships and pixel-based matching, and it carries meaningful privacy and compliance considerations that buyers should evaluate carefully for their region. Vector surfaces identified visitors with contact details and integrates with CRMs and sequencing tools so SDRs can prioritize outreach to people who have already shown intent.",
      "The search query 'RB2B vs Vector' has meaningful demand, which reflects that RB2B is the most direct competitor in the person-level identification niche. Buyers will also compare Vector to Clearbit Reveal and Koala for account-level intent, to 6sense and Bombora for broader intent data, and to Warmly for a more orchestration-heavy approach to visitor identification and routing. Vector's positioning leans toward simplicity of setup and actionable person-level output rather than deep account intelligence.",
    ],
    faqs: [
      {
        question: "What does Vector do differently from standard website visitor ID tools?",
        answer: "Most visitor ID tools return a company name and firmographics; Vector focuses on resolving the individual person visiting the page, which allows outbound teams to reach a specific contact rather than just the account.",
      },
      {
        question: "How does Vector compare to RB2B?",
        answer: "Both tools target person-level website visitor identification and are frequently compared directly; buyers typically evaluate match rates, integration depth, pricing model, and geographic coverage to choose between them.",
      },
      {
        question: "Are there privacy or compliance concerns with person-level visitor ID?",
        answer: "Yes, identifying individual website visitors involves data privacy considerations that vary by jurisdiction, particularly under GDPR in Europe; buyers should review their legal obligations before deploying any person-level identification tool.",
      },
    ],
  },
  {
    slug: "vapi",
    name: "Vapi",
    category: "AI Voice & Dialers",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try Vapi",
    ctaPrimary: true,
    listed: false,
    aliases: ["Vapi", "vapi.ai"],
    blurb: "Vapi is a developer-first API platform for building and deploying AI voice agents that can make and receive phone calls with low latency and configurable voices.",
    bestFor: "Developers and technical GTM teams building custom AI calling workflows, appointment setters, or inbound voice agents without managing telephony infrastructure.",
    body: [
      "Vapi provides the infrastructure layer for AI voice: telephony, speech-to-text, LLM routing, and text-to-speech assembled into a single API that developers call to spin up voice agents. AI voice as a product category is genuinely new, with meaningful commercial adoption accelerating from 2024 onward, and Vapi is positioned as the infrastructure provider rather than a packaged sales dialer. Builders connect their own LLM prompts, choose voice providers such as ElevenLabs or Deepgram, and define call flows, meaning the final agent behavior is determined by what the builder configures.",
      "In a GTM stack, Vapi enables use cases ranging from AI-powered outbound prospecting calls to inbound lead qualification and scheduling. Teams evaluate it against Bland AI and Retell AI, which occupy the same developer-focused AI voice infra space, and against higher-level packaged tools like AirCall's AI features or Dialpad AI for teams that want less configuration. The tradeoff is clear: Vapi gives more flexibility and lower per-minute cost at the expense of requiring engineering resources to build the agent experience.",
    ],
    faqs: [
      {
        question: "What is Vapi and what can it be used for?",
        answer: "Vapi is an API platform for building AI phone call agents; common use cases include outbound prospecting, inbound lead qualification, appointment booking, and customer support automation.",
      },
      {
        question: "How does Vapi compare to Bland AI?",
        answer: "Both are developer-focused AI voice infrastructure platforms; buyers typically compare them on latency, supported voice providers, pricing per minute, and the quality of their documentation and SDKs.",
      },
      {
        question: "Who should not use Vapi?",
        answer: "Non-technical sales or marketing teams without developer resources should look at packaged AI dialer products instead; Vapi requires meaningful engineering work to configure and maintain a production-quality voice agent.",
      },
    ],
  },
  {
    slug: "circleback",
    name: "Circleback",
    category: "Meeting Intelligence",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try Circleback",
    ctaPrimary: true,
    listed: false,
    aliases: ["Circleback", "circleback.ai"],
    blurb: "Circleback is an AI meeting notetaker that records, transcribes, and summarizes calls, then writes structured follow-up actions and can push them to your CRM automatically.",
    bestFor: "Sales reps and customer success teams who want accurate meeting summaries and automatic CRM updates without manually logging call notes.",
    body: [
      "Circleback joins meetings via a bot or native integration, produces a transcript, and then generates opinionated summaries that include action items attributed to specific participants. Its differentiation from older transcription tools is the post-meeting automation layer: it can draft follow-up emails, log call outcomes to CRM fields, and push tasks to project management tools, reducing the manual work that follows a sales or CS call. The product is newer to a category that also includes well-established tools, which means it is actively developing integrations and features.",
      "In a RevOps stack, Circleback fits between the calendar and CRM, capturing conversation data that would otherwise require manual entry. Buyers compare it most directly to Otter.ai, Fireflies.ai, and Fathom for transcription and summaries, and to Gong and Chorus (now ZoomInfo Conversation Intelligence) for teams that also want revenue intelligence, deal risk scoring, and manager coaching tools. Circleback's positioning is generally lighter-weight and faster to deploy than Gong, with a focus on workflow automation over sales analytics.",
    ],
    faqs: [
      {
        question: "What is Circleback and how does it differ from basic transcription tools?",
        answer: "Circleback records and transcribes meetings but also generates structured summaries, action items, and automated CRM updates, going further than tools that only produce a raw transcript.",
      },
      {
        question: "How does Circleback compare to Fathom?",
        answer: "Both are AI notetakers with free tiers targeting sales and GTM teams; buyers typically compare them on summary quality, CRM integration depth, and pricing for team plans.",
      },
      {
        question: "Does Circleback work with all video conferencing platforms?",
        answer: "Circleback supports major platforms including Zoom, Google Meet, and Microsoft Teams; buyers should verify current integration coverage and bot join behavior on the Circleback website.",
      },
    ],
  },
  {
    slug: "fillout",
    name: "Fillout",
    category: "Scheduling",
    badge: "Free tier available",
    badgeFree: true,
    ctaLabel: "Try Fillout",
    ctaPrimary: true,
    listed: false,
    aliases: ["Fillout", "fillout.com"],
    blurb: "Fillout is a form builder and scheduling tool that combines customizable multi-step forms with calendar booking and lead routing, designed for GTM and product teams.",
    bestFor: "Revenue teams that want flexible forms with built-in scheduling and routing logic without stitching together separate form and booking tools.",
    body: [
      "Fillout lets teams build forms that go beyond simple data collection: conditional logic, multi-step flows, payment collection, and calendar scheduling can all live inside a single Fillout form without external integrations. It connects natively to tools including HubSpot, Salesforce, Airtable, and Notion, and includes logic for routing form respondents to different calendar owners based on their answers, which replaces a common hack of combining Typeform with Calendly and a separate routing layer. The product is newer to its category and has grown partly by targeting teams frustrated by the limitations or pricing of established form tools.",
      "In a GTM stack, Fillout covers inbound lead capture, demo request routing, and scheduling in one place. Buyers compare it to Typeform for form UX, to Tally for cost and simplicity, to Calendly for scheduling, and to Chili Piper for enterprise-grade meeting routing with more CRM integration depth. Fillout's position is between the simplicity of Tally and the complexity of Chili Piper, making it relevant for growth-stage teams that need more than a basic form but less than a full revenue routing platform.",
    ],
    faqs: [
      {
        question: "What is Fillout and what makes it different from Typeform?",
        answer: "Fillout is a form and scheduling platform that adds built-in calendar booking and conditional routing to the form flow, whereas Typeform focuses on the form experience and requires separate tools for scheduling.",
      },
      {
        question: "How does Fillout compare to Chili Piper for meeting routing?",
        answer: "Chili Piper is focused on enterprise revenue routing with deep Salesforce integration and round-robin assignment logic, while Fillout is a broader form platform with scheduling included, suited to smaller or less complex routing needs.",
      },
      {
        question: "Who should not use Fillout?",
        answer: "Enterprise teams with complex territory-based routing rules, SLA requirements, and deep Salesforce workflow dependencies will likely need a dedicated routing tool like Chili Piper or LeanData rather than Fillout.",
      },
    ],
  },
  {
    slug: 'justcall',
    name: 'JustCall',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try JustCall',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/justcall.png',
    aliases: ['JustCall'],
    blurb:
      'JustCall is the AI-powered phone and SMS platform built for sales and support teams. Automate calls, texts, and follow-ups with 100+ integrations. Trusted by 6,000+ businesses. Try free.',
  },
  {
    slug: 'aircall',
    name: 'Aircall',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Aircall',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/aircall.png',
    aliases: ['Aircall'],
    blurb:
      'AI-powered customer communications platform to unify channels, automate tasks, & provide insights. Integrate with CRM & helpdesk. 250+ integrations like Hubspot, Salesforce.',
  },
  {
    slug: 'fireflies',
    name: 'Fireflies',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Fireflies',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/fireflies.png',
    aliases: ['Fireflies'],
    blurb:
      'Fireflies takes notes, manages tasks, and automates workflows across meetings, email, chat, CRM, and your apps. Build a searchable knowledge base of your team’s work in one place.',
  },
  {
    slug: 'otter',
    name: 'Otter.ai',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Otter.ai',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/otter.png',
    aliases: ['Otter.ai'],
    blurb:
      'Otter.ai is featured in a comparison on The Automations Guide.',
  },
  {
    slug: 'taplio',
    name: 'Taplio',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Taplio',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/taplio.png',
    aliases: ['Taplio'],
    blurb:
      'Taplio is featured in a comparison on The Automations Guide.',
  },
  {
    slug: 'loops',
    name: 'Loops',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Loops',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/loops.png',
    aliases: ['Loops'],
    blurb:
      'Loops is email marketing software for SaaS teams to send marketing, lifecycle, and transactional email from one product.',
  },
  {
    slug: 'activecampaign',
    name: 'ActiveCampaign',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try ActiveCampaign',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/activecampaign.png',
    aliases: ['ActiveCampaign'],
    blurb:
      'Go beyond marketing automation with ActiveCampaign\'s autonomous marketing platform. Your team of AI agents handles email, SMS, WhatsApp and more for you, backed by billions of data points.',
  },
  {
    slug: 'customerio',
    name: 'Customer.io',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Customer.io',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/customerio.png',
    aliases: ['Customer.io', 'Customerio'],
    blurb:
      'Customer.io is a messaging platform for sending behavioral emails, push notifications, and SMS to engage and retain your customers.',
  },
  {
    slug: 'bouncer',
    name: 'Bouncer',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try Bouncer',
    ctaPrimary: false,
    listed: false,
    aliases: ['Bouncer'],
    blurb:
      'Bouncer is featured in a comparison on The Automations Guide.',
  },
  {
    slug: 'zerobounce',
    name: 'ZeroBounce',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try ZeroBounce',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/zerobounce.webp',
    aliases: ['ZeroBounce'],
    blurb:
      'ZeroBounce is featured in a comparison on The Automations Guide.',
  },
  {
    slug: 'mailreach',
    name: 'MailReach',
    category: 'Sales Engagement',
    badge: 'Paid',
    ctaLabel: 'Try MailReach',
    ctaPrimary: false,
    listed: false,
    logo: '/brand/tools/mailreach.png',
    aliases: ['MailReach'],
    blurb:
      'MailReach is featured in a comparison on The Automations Guide.',
  },
];

// Common English words that double as brand names — for these, a bare body
// mention isn't enough signal, so we require the capitalized form to appear at
// least twice (a passing "Make sure..." won't repeat as a standalone "Make").
const AMBIGUOUS = new Set(['Make', 'Clay', 'Kit', 'Guide', 'Close', 'Motion', 'Warmly', 'Instantly']);

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

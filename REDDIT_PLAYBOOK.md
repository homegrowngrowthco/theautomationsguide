# Reddit Playbook — The Automations Guide

Last updated: 2026-07-06

This is the audit and the operating manual for using Reddit as a distribution channel for The Automations Guide (TAG). Part 1 is the honest reality check. Part 2 is profile setup. Part 3 is the subreddit map. Part 4 is the weekly operating rhythm. Part 5 is what will get you banned. Part 6 is the light-automation plan that sits on top of the `PR + Backlink Monitor` n8n workflow you already run.

Read Part 1 before doing anything. Reddit is the single highest-risk, highest-reward off-site channel, and the failure mode is not "it doesn't work," it is "you get shadowbanned and never find out."

---

## Part 1 — The reality check (read this first)

**Reddit is not a posting channel. It is a participation channel.** Every affiliate site that treats Reddit as a place to drop links gets filtered, downvoted, or shadowbanned inside a week. The mechanics that punish you:

- **The 9:1 rule.** The informal community standard (and the written rule in most relevant subs) is that no more than 1 in 10 of your contributions can be self-promotional. Realistically, for a commercial site, run closer to 20:1. Your job on Reddit is to be a genuinely useful automation practitioner who occasionally has a relevant link.
- **Shadowbans are silent.** You keep posting, everything looks normal to you, and nobody else can see any of it. New accounts that post links early are the number one trigger. Check status any time at `reddit.com/user/<you>` while logged out, or via `r/ShadowBan`.
- **The domain spam filter is per-subreddit and sitewide.** If `theautomationsguide.com` gets reported a few times as spam, AutoModerator starts auto-removing every link to it across Reddit before a human ever sees it. This is very hard to reverse. You get exactly one reputation for the domain, so protect it.
- **Brand accounts get downvoted on sight.** Reddit rewards a real person with a history, not a logo. Post as Ian, an operator who builds this stuff, not as "The Automations Guide."

**What actually works for a tool-comparison site:** answering "what is the best X for Y" and "has anyone used X vs Y" threads with a genuinely useful, specific, non-salesy breakdown, and linking to your comparison post only when the rules allow it and the link truly answers the question better than your comment alone. That is 90% of the value you will ever extract from Reddit. The occasional standalone text post (a teardown, a lessons-learned writeup) is the other 10%.

**Honest expectation setting:** Reddit will not be a top-3 traffic source. It is a slow trust-and-backlink play plus a live focus group for what your audience actually argues about (which is free content-idea fuel). Treat referral traffic as a bonus and the topic intelligence as the real prize.

---

## Part 2 — Profile setup

Do all of this on the account you will actually use, in one sitting, then let it age.

**Account identity**
- **Use a personal account, as Ian.** Do not create a "TheAutomationsGuide" brand account. If you already made one, retire it for commenting and keep it only as a claimed presence.
- **Username:** a real-sounding handle is fine (e.g. `ianbuildsautomations`, `ian_revops`, or just your existing personal handle). Avoid the exact brand name as the username, it reads as a marketing account.
- **Display name:** "Ian (The Automations Guide)" is acceptable once you have karma. On a fresh account, drop the parenthetical until you are established.

**Profile fields (these are your one allowed always-on link)**
- **Bio / About:** one honest line. Example: "I build sales and revops automations and write up tool comparisons. Happy to help with n8n / Make / Zapier questions." Disclose that you run a site. Do not hard-sell.
- **Social links:** add `theautomationsguide.com` and your `x.com/the_automations` here. Links in your profile are allowed and are not counted as spam, this is the safe place for your URL. Many people who like your comment will click through to your profile.
- **Avatar:** a real photo of you, or a clean personal avatar. Not the TAG logo.
- **Verify your email**, enable a display name, and make the profile public/followable so a good comment can convert into a profile follow.

**Before you post a single link, hit these minimums**
- Account age: at least 2 to 4 weeks.
- Comment karma: at least 100 to 200, earned by being useful (see Part 4). Most of the good subreddits gate link/self posts behind karma and age thresholds via AutoModerator, and you will not even see the removal reason.
- Have a comment history in the target subreddit before you ever post to it.

---

## Part 3 — Subreddit map for TAG's niche

Ranked by fit. **Always read the subreddit rules and the pinned "no self-promo" / "promo thread" posts before contributing.** Rules vary wildly and change often.

**Tier 1 — core audience, high fit, strict rules**
- **r/n8n** — your single best fit. Highly active builders, tool questions daily. Be genuinely helpful with workflow advice; link a relevant teardown only when it directly answers. This is also where your product comparisons carry the most weight.
- **r/RevOps** — exactly your ICP. Rules are strict on self-promo (the checklist already flags this). Comment-only for a long while, link rarely.
- **r/automation** — broad, matches many of your posts. Mixed quality, moderate promo tolerance.
- **r/nocode** and **r/lowcode** — Zapier/Make/n8n crowd, tool-shopping mindset.

**Tier 2 — adjacent, good for specific posts**
- **r/Zapier**, **r/msp**, **r/marketingautomation**, **r/Emailmarketing**, **r/coldemail** — topic-specific. Link only when your post is the literal answer to the thread.
- **r/sales**, **r/salesforce** — your revops/handoff content lands here, but these are promo-hostile. Pure participation.
- **r/SaaS**, **r/Entrepreneur**, **r/smallbusiness** — huge, lower fit, occasional relevance. Good for a well-crafted text post (a genuine case study), bad for link drops.

**Tier 3 — launch-only / special cases**
- **Indie Hackers** and **Hacker News (Show HN)** — not Reddit, but same discipline. HN only for a substantial launch, never for a blog post.
- Vendor subs (r/hubspot, r/Airtable, etc.) — participate when a post naturally involves that tool.

**Practical rule:** never post the same link to more than one subreddit within a short window. Cross-posting identical links is the classic spam signal.

---

## Part 4 — The weekly operating rhythm

Aim for roughly 20 to 30 minutes, 3 times a week. Consistency beats volume.

1. **Monitor (automated, Part 6).** Your `PR + Backlink Monitor` already surfaces fresh Reddit threads matching your keywords into `#backlinks` with a drafted response. Start each session there.
2. **Comment first, always.** For each surfaced thread, write a genuinely useful reply in your own voice. Personalize the drafted response, do not paste it. Add specifics only an operator would know. Link only if the rules allow and the link adds something your comment cannot.
3. **Answer 3 to 5 threads per session** where you add value, link on at most one.
4. **Post rarely.** At most one standalone text post every 1 to 2 weeks, in the single most relevant subreddit, and make it a real contribution (a teardown, "I compared X vs Y across 40 workflows, here is what I found"), not a repackaged blog headline. If you link your full writeup, put it in a comment or at the bottom with context, not as the whole post.
5. **Reply to every reply.** Engagement is what earns the trust that makes the occasional link acceptable.

**Content angles that fit Reddit's grain (pull from existing TAG posts):**
- Tool-vs-tool breakdowns (Make vs Zapier vs n8n, Clay vs Zapier, Apollo vs Clay) rewritten as a lived opinion, not an SEO article.
- "Here is the actual stack I would build for $X/mo" (you already have this post).
- Mistakes / anti-patterns ("5 revops automation mistakes") do very well as text posts.

---

## Part 5 — What will get you banned (the do-not list)

- Posting a link from an account younger than a few weeks or under ~100 karma.
- Dropping the same URL across multiple subreddits.
- Leading with the link instead of the value. Link-first comments read as ads.
- Ignoring a subreddit's self-promo rule or its dedicated promo thread.
- Deleting and reposting to "try again" (looks like spam evasion).
- Using multiple accounts to upvote yourself or seed comments (vote manipulation, sitewide ban).
- Auto-posting anything (see Part 6). Reddit is aggressive about detecting automated submissions.
- Being defensive when downvoted. Take the L, the sub's norms won.

If you suspect a shadowban: log out, visit your profile URL, and check whether your recent posts are visible. Cross-check in `r/ShadowBan`. If the domain itself is filtered, contact the specific subreddit's mods politely, and as a last resort file with Reddit admins, but prevention is the only real fix.

---

## Part 6 — Light-automation plan (human-in-the-loop only)

**Guiding principle: automate the monitoring and the drafting, never the posting.** Auto-submitting to Reddit is the fastest way to a domain-level ban, and from n8n Cloud it also fails technically (shared IP gets rate-limited at 429 by the second or third request, per prior testing). Every post and comment goes out by hand, from Ian's account, personalized.

**What you already have:** the `PR + Backlink Monitor` workflow (n8n) fetches Reddit threads matching your keywords, calls Claude to draft a response, and posts the match plus draft into `#backlinks` (now branded with the `🤖 The Automations Guide` header). This is exactly the right shape. Keep it.

**Recommended enhancements, in priority order:**
1. **Keyword tuning.** Make sure the monitor covers your money terms: `n8n`, `Make vs Zapier`, `Clay alternative`, `cold email tool`, `revops stack`, `Apollo vs`, `lead enrichment`, `marketing automation tool`, plus each Tier-1 tool name you have an affiliate deal with. Watch for false positives (the word "make" is a nightmare, require it paired with an automation term).
2. **Respect the Reddit-from-n8n-Cloud limits.** One consolidated feed request per run using a multireddit (combine your Tier-1 subs into a single `reddit.com/user/<you>/m/<multi>/.json` pull), not one request per subreddit. Run the cron off the top of the hour to avoid the shared-IP crush. Keep any Code node under the 60-second cap. (These match the constraints documented from prior Reddit-on-n8n work.)
3. **Weekly digest, not just real-time pings.** Add a Monday summary to `#backlinks`: the top 5 highest-relevance threads from the past week that you have not engaged yet, so nothing good slips by. This is a read-only pull, zero posting risk.
4. **Dedup and cooldown.** Track thread IDs you have already been shown (the workflow already dedups) and suppress re-surfacing a thread you have replied to.
5. **Attribution.** When you do share a link, append a UTM (`?utm_source=reddit&utm_medium=social&utm_campaign=<subreddit>`) so PostHog attributes the click and any `affiliate_click` downstream. This tells you which subreddits actually convert, so you can spend your 20 minutes where it pays.

**Explicitly out of scope (do not build):** auto-commenting, auto-posting, scheduled submissions, upvote automation, or anything that acts on Reddit without Ian pressing the button. The moment automation touches the write path, the whole domain is at risk.

---

## Quick-start checklist

- [ ] Set up / clean up the personal account per Part 2 (photo, bio, profile links to site + X, verified email).
- [ ] Let it age 2 to 4 weeks while earning 100+ comment karma by being helpful in r/n8n and r/automation.
- [ ] Read the rules + pinned promo posts for every Tier-1 subreddit before contributing.
- [ ] Start each session in `#backlinks`, comment-first, link at most 1 in 5 threads.
- [ ] Tune the `PR + Backlink Monitor` keywords (Part 6.1) and add the Monday digest (Part 6.3).
- [ ] Add UTM tags to any shared links; review reddit source in PostHog monthly.
- [ ] Check for shadowban monthly (logged-out profile view).

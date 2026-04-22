---
title: "How to Automate Your Sales-to-CS Handoff with HubSpot and Slack"
description: "A step-by-step playbook for building a reliable, automated sales handoff workflow using HubSpot workflows, Slack notifications, and Make."
pubDate: 2025-04-18
author: "The Automations Guide"
tags: ["HubSpot", "Slack", "Workflow", "Playbook"]
---

The sales-to-customer-success handoff is one of the highest-stakes moments in the customer lifecycle — and one of the most commonly botched.

A rep closes a deal. The customer is excited. Somewhere between the signed contract and the first onboarding call, something gets dropped. The CSM gets a Slack message with a name and a deal value. The customer gets a generic welcome email. The relationship starts on the wrong foot before anyone realizes it.

This doesn't have to happen. Here's a complete automation playbook for building a reliable handoff using HubSpot and Slack — no custom code required.

## What the automation will do

When a deal moves to **Closed Won** in HubSpot, the automation will:

1. Pull key deal and contact data from HubSpot
2. Assign the CS owner based on your routing rules
3. Create a follow-up task for the assigned CSM
4. Send a structured Slack message to your CS channel with full context
5. Log the handoff in HubSpot with a note

The whole thing runs in under 30 seconds from deal close to CSM notification.

## What you'll need

- HubSpot (Sales Hub Starter or above for workflow automation)
- Slack workspace with a dedicated `#cs-handoffs` channel
- Make account (free tier works to get started)
- 30–60 minutes

## Step 1: Set up the HubSpot trigger

In HubSpot, navigate to **Automation → Workflows → Create workflow**.

- Set the enrollment trigger to: **Deal stage is Closed Won**
- Choose "Re-enroll" as "No" (you don't want this firing twice)

At this point, you have a workflow that will fire every time a deal closes. Now you need to decide: do you want to build the entire flow in HubSpot, or hand off to Make?

**If your handoff logic is simple** (one CSM pool, round-robin assignment), HubSpot workflows alone can handle it.

**If your logic is complex** (territory-based routing, weighted assignment, custom Slack message formatting), route to Make via webhook.

For this playbook, we'll use the Make webhook path — it gives you the most control.

## Step 2: Add a webhook action in HubSpot

In your HubSpot workflow, add an action:

1. **Action type:** Send a webhook
2. **Method:** POST
3. **URL:** (paste your Make webhook URL — you'll create this in the next step)
4. **Request body:** Include the deal properties you need:

```
{
  "deal_name": "{{deal.dealname}}",
  "deal_value": "{{deal.amount}}",
  "close_date": "{{deal.closedate}}",
  "contact_name": "{{contact.firstname}} {{contact.lastname}}",
  "contact_email": "{{contact.email}}",
  "company_name": "{{company.name}}",
  "deal_owner": "{{deal.hubspot_owner_id}}",
  "deal_id": "{{deal.hs_object_id}}"
}
```

Save but don't activate the workflow yet — you'll need the Make scenario running first.

## Step 3: Build the Make scenario

In Make, create a new scenario and add a **Webhooks → Custom webhook** trigger. Copy the webhook URL and paste it into your HubSpot workflow from Step 2.

Now add modules:

### Module 2: Parse and route

Use a **Router** module to branch your logic. For example:
- If `deal_value > 50000` → assign to Enterprise CS pool
- Otherwise → assign to SMB CS pool

If you're doing simple assignment, skip the router and go straight to Slack.

### Module 3: Send Slack message

Add a **Slack → Send a message** module.

- **Channel:** `#cs-handoffs`
- **Message:** Build a structured Block Kit message (Make has a Slack message builder) or use plain text:

```
:handshake: *New Closed Won — Handoff Ready*

*Account:* {{company_name}}
*Contact:* {{contact_name}} ({{contact_email}})
*Deal value:* ${{deal_value}}
*Closed by:* {{deal_owner_name}}
*HubSpot deal:* <link>

CS owner, please create the kickoff meeting within 24 hours.
```

### Module 4: Create HubSpot task

Add a **HubSpot → Create a task** module:

- **Subject:** `Onboarding kickoff — {{company_name}}`
- **Owner:** (map to your CSM assignment logic)
- **Due date:** (today + 3 business days)
- **Associated deal ID:** `{{deal_id}}`

### Module 5: Log a note in HubSpot

Add a **HubSpot → Create a note** module:

- **Body:** `Automated handoff initiated on {{timestamp}}. CS notified via Slack. Task created for kickoff meeting.`
- **Associated deal ID:** `{{deal_id}}`

## Step 4: Test the end-to-end flow

Before activating in production:

1. Turn on your Make scenario
2. Move a test deal in HubSpot to Closed Won
3. Confirm the webhook fires (check Make's "Run history")
4. Confirm the Slack message appears in `#cs-handoffs`
5. Confirm the task and note appear on the deal in HubSpot

If anything breaks, Make's error logs will show you exactly where. Common issues: missing deal properties, Slack OAuth not configured, HubSpot field names spelled wrong.

## What to add next

Once the core flow is working, these extensions are high-value:

- **Kickoff email trigger:** Send a templated email from the CS owner's address immediately on close
- **Onboarding checklist creation:** Automatically spin up a checklist in Notion, Asana, or ClickUp
- **Day-1 nudge:** Schedule a Slack reminder to the CSM 24 hours after assignment if the kickoff hasn't been booked

The pattern is the same each time: trigger on a signal, enrich the data, take action, log the outcome.

## The payoff

Teams that automate this handoff typically see:

- First outreach time drop from 24–48 hours to under 1 hour
- No more dropped deals due to miscommunication
- CSMs starting calls with full context, not guessing
- Sales reps spending zero time on post-close admin

It's one of the highest-ROI automations a RevOps team can ship. Build it once, and it pays for itself every closed deal.

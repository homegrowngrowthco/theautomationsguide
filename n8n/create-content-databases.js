#!/usr/bin/env node
// Creates the two Notion databases the Blog Post Engine needs:
//   1. Content Calendar — queue of topics to generate
//   2. Content Drafts — Twitter threads & video scripts saved for review
//
// Usage:
//   NOTION_TOKEN=ntn_xxx NOTION_PARENT_PAGE_ID=xxx node create-content-databases.js
//
// The parent page ID is the 32-char ID from the URL of the Notion page where
// you want the databases created. You can use the existing 90-day plan page or
// a new "Content Engine" page.

import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

if (!NOTION_TOKEN || !NOTION_PARENT_PAGE_ID) {
  console.error('Missing env vars. Set NOTION_TOKEN and NOTION_PARENT_PAGE_ID.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

async function createContentCalendar() {
  console.log('Creating Content Calendar database...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '📅' },
    title: [{ type: 'text', text: { content: 'Content Calendar' } }],
    initial_data_source: {
      properties: {
        Topic: { title: {} },
        Status: {
          select: {
            options: [
              { name: 'Suggested', color: 'pink' },
              { name: 'Queued', color: 'blue' },
              { name: 'Generating', color: 'yellow' },
              { name: 'In Review', color: 'orange' },
              { name: 'Published', color: 'green' },
              { name: 'Skipped', color: 'gray' },
            ],
          },
        },
        Priority: {
          select: {
            options: [
              { name: 'High', color: 'red' },
              { name: 'Medium', color: 'yellow' },
              { name: 'Low', color: 'gray' },
            ],
          },
        },
        Tag: {
          select: {
            options: [
              { name: 'revops', color: 'purple' },
              { name: 'automation', color: 'blue' },
              { name: 'tools', color: 'green' },
              { name: 'comparison', color: 'orange' },
              { name: 'guide', color: 'pink' },
            ],
          },
        },
        'Target Keyword': { rich_text: {} },
        Notes: { rich_text: {} },
        'PR URL': { url: {} },
        'Pub Date': { date: {} },
        Created: { created_time: {} },
      },
    },
  });
  console.log(`Content Calendar created: ${db.id}`);
  if (db.url) console.log(`URL: ${db.url}`);
  return db.id;
}

async function createDraftsDatabase() {
  console.log('Creating Content Drafts database...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: NOTION_PARENT_PAGE_ID },
    icon: { type: 'emoji', emoji: '✏️' },
    title: [{ type: 'text', text: { content: 'Content Drafts (Social)' } }],
    initial_data_source: {
      properties: {
        Name: { title: {} },
        Status: {
          select: {
            options: [
              { name: 'Draft – Needs Review', color: 'orange' },
              { name: 'Script – Needs Review', color: 'orange' },
              { name: 'Approved', color: 'yellow' },
              { name: 'Posted', color: 'green' },
              { name: 'Skipped', color: 'gray' },
            ],
          },
        },
        Type: {
          select: {
            options: [
              { name: 'Twitter Thread', color: 'blue' },
              { name: 'Video Script', color: 'pink' },
              { name: 'LinkedIn Post', color: 'purple' },
            ],
          },
        },
        'PR URL': { url: {} },
        'Pub Date': { date: {} },
      },
    },
  });
  console.log(`Content Drafts created: ${db.id}`);
  if (db.url) console.log(`URL: ${db.url}`);
  return db.id;
}

async function seedSampleTopics(databaseId) {
  console.log('Seeding 3 sample topics...');
  const samples = [
    {
      topic: 'Make vs Zapier vs n8n in 2026: which automation platform RevOps teams should actually pick',
      tag: 'comparison',
      keyword: 'make vs zapier vs n8n',
      priority: 'High',
      notes: 'Compare on: pricing at scale, error handling, AI nodes, self-host option, learning curve. Be opinionated.',
    },
    {
      topic: 'How to automate inbound lead routing with Clay + HubSpot in under an hour',
      tag: 'guide',
      keyword: 'automate inbound lead routing',
      priority: 'High',
      notes: 'Walkthrough: webhook from form → Clay enrich → HubSpot create deal + assign owner by territory. Include the actual Clay table setup.',
    },
    {
      topic: 'The RevOps automation stack we would build with $500/mo in 2026',
      tag: 'tools',
      keyword: 'revops automation stack budget',
      priority: 'Medium',
      notes: 'Specific tool selection at a real budget. Show monthly cost breakdown. Recommend HubSpot free + n8n cloud + Apollo basic + Smartlead.',
    },
  ];

  for (const s of samples) {
    await notion.pages.create({
      parent: { type: 'database_id', database_id: databaseId },
      properties: {
        Topic: { title: [{ text: { content: s.topic } }] },
        Status: { select: { name: 'Queued' } },
        Priority: { select: { name: s.priority } },
        Tag: { select: { name: s.tag } },
        'Target Keyword': { rich_text: [{ text: { content: s.keyword } }] },
        Notes: { rich_text: [{ text: { content: s.notes } }] },
      },
    });
    console.log(`  - Seeded: ${s.topic.substring(0, 60)}...`);
  }
}

async function main() {
  try {
    const calendarId = await createContentCalendar();
    const draftsId = await createDraftsDatabase();
    await seedSampleTopics(calendarId);

    console.log('\n--- Done ---');
    console.log('\nPaste these IDs into the n8n workflow Config node:');
    console.log(`  topicsDatabaseId: ${calendarId}`);
    console.log(`  draftsDatabaseId: ${draftsId}`);
    console.log('\nMake sure your Notion integration has access to the parent page (Share → Connect to integration).');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.body) console.error('Details:', JSON.stringify(err.body, null, 2));
    process.exit(1);
  }
}

main();

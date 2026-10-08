// Retire the n8n Topic Suggestor (vfEeiQg3TsPlD24J): deactivate it in place, keep the
// workflow and its history, so topic discovery has ONE owner, the data-fed backlog
// builder (backlog/build-backlog.mjs, GitHub Actions Sun + Wed 06:00 UTC).
//
// Decided by Ian on 2026-10-08 (Session 110): the Suggestor had no performance input,
// read 100 of ~460 calendar rows unpaginated, saw 1 of 177 posts (it kept only .md
// filenames) and produced 15 of the 63 Suggested rows on 10/08 as duplicates.
//
//   node --env-file=../growth-engine/.env n8n/retire-suggestor.mjs          # dry run: prints live state
//   node --env-file=../growth-engine/.env n8n/retire-suggestor.mjs --apply  # backup, deactivate, verify
//   node --env-file=../growth-engine/.env n8n/retire-suggestor.mjs --reactivate --apply   # revert
//
// Backups land in ~/.n8n-backups/ (outside the repo: live exports carry the Slack
// webhook URL). The committed n8n/topic-suggestor.json stays as the archive.
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { api } from './live-patch.mjs';

const ID = 'vfEeiQg3TsPlD24J';
const APPLY = process.argv.includes('--apply');
const REACTIVATE = process.argv.includes('--reactivate');

const live = await api('GET', `/workflows/${ID}`);
console.log(`## ${live.name} (${ID}): active=${live.active}, nodes=${live.nodes.length}, errorWorkflow=${live.settings?.errorWorkflow || '-'}`);
const want = REACTIVATE;
if (live.active === want) { console.log(`  already ${want ? 'active' : 'inactive'}; nothing to do`); process.exit(0); }
console.log(`  ~ ${want ? 'activate' : 'deactivate'} (POST /workflows/${ID}/${want ? 'activate' : 'deactivate'})`);
if (!APPLY) { console.log('  DRY RUN, not applied'); process.exit(0); }

const dir = join(homedir(), '.n8n-backups');
mkdirSync(dir, { recursive: true });
const bak = join(dir, `${ID}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(bak, JSON.stringify(live, null, 2));
console.log('  backup: ' + bak);

await api('POST', `/workflows/${ID}/${want ? 'activate' : 'deactivate'}`);
const v = await api('GET', `/workflows/${ID}`);
const ok = v.active === want && v.nodes.length === live.nodes.length;
console.log(`  verify: active=${v.active}, nodes ${v.nodes.length}/${live.nodes.length} -> ${ok ? 'OK' : 'MISMATCH'}`);
if (!ok) { console.error(`  revert: node --env-file=../growth-engine/.env n8n/retire-suggestor.mjs ${want ? '' : '--reactivate '}--apply`); process.exit(1); }

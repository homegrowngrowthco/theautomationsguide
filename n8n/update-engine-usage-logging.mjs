// Idempotent updater (same pattern as update-engine-*.mjs): adds real Anthropic
// token-usage / cost logging to the Blog Post Engine.
//
// The engine makes 3 Claude calls per article: Generate Draft + Humanize
// (claude-sonnet-4-6) and Generate Social Outputs (claude-haiku-4-5). Each
// httpRequest node returns the full Messages-API body, so usage.{input_tokens,
// output_tokens, cache_creation_input_tokens, cache_read_input_tokens} is
// readable downstream via $('Node').first().json.usage.
//
// This adds a tail off the SOCIAL branch (Parse Social Outputs is the last node
// to run with all three usage objects available — the existing "Slack
// Notification" runs in PARALLEL with "Generate Social Outputs" so the Haiku
// usage is not yet available there):
//   Parse Social Outputs -> Compute Cost (code) -> Log Cost to Slack (http)
// PURELY ADDITIVE: the existing Parse Social Outputs -> Save Twitter/LinkedIn
// edges are untouched, so this can never break the post/PR/social happy path
// (same safety posture as update-engine-daily-and-empty-alert.mjs).
//
// "Compute Cost" is a plain jsCode node (NOT an n8n ={{ }} expression), so it is
// immune to the {{ / backtick tokenizer breaks that have bitten this engine
// before. It carries NO `{{`/`}}`/backtick tokens. "Log Cost to Slack" reuses
// the exact single-expression Slack pattern from the Queue-Empty node.
//
// Pricing per 1M tokens, confirmed via the claude-api skill on 2026-06-11:
//   Sonnet 4.6: $3 in / $15 out      Haiku 4.5: $1 in / $5 out
//   Cache multipliers on the INPUT rate: 5-min cache write 1.25x, cache read 0.1x
//
//   node n8n/update-engine-usage-logging.mjs        # writes blog-post-engine.json
// then deploy:
//   node --env-file=../growth-engine/.env n8n/deploy-engine.mjs --apply

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, 'blog-post-engine.json');
const wf = JSON.parse(readFileSync(FILE, 'utf8'));

const COMPUTE_NODE = 'Compute Cost';
const SLACK_NODE = 'Log Cost to Slack';
const PARSE_NODE = 'Parse Social Outputs';

// Plain JS for the Code node. No backticks, no `{{`/`}}` — string concatenation
// only, so the engine's expression tokenizer can never choke on it.
const COMPUTE_JS = [
  "// Sum Anthropic token usage across the 3 Claude calls in this run and compute",
  "// an estimated USD cost. Pricing per 1M tokens (claude-api skill, 2026-06-11):",
  "// Sonnet 4.6 $3 in / $15 out; Haiku 4.5 $1 in / $5 out. Cache multipliers on the",
  "// input rate: 5-min cache write 1.25x, cache read 0.1x.",
  "function usageOf(j) {",
  "  const u = (j && j.usage) || {};",
  "  return {",
  "    inp: u.input_tokens || 0,",
  "    out: u.output_tokens || 0,",
  "    cw: u.cache_creation_input_tokens || 0,",
  "    cr: u.cache_read_input_tokens || 0,",
  "  };",
  "}",
  "function costOf(u, inRate, outRate) {",
  "  return (u.inp * inRate + u.cw * inRate * 1.25 + u.cr * inRate * 0.1 + u.out * outRate) / 1e6;",
  "}",
  "let draftJson = {}, humanJson = {}, socialJson = {}, carry = {};",
  "try { draftJson = $('Generate Draft').first().json || {}; } catch (e) {}",
  "try { humanJson = $('Humanize').first().json || {}; } catch (e) {}",
  "try { socialJson = $('Generate Social Outputs').first().json || {}; } catch (e) {}",
  "try { carry = $('Parse Social Outputs').first().json || {}; } catch (e) {}",
  "const draft = usageOf(draftJson), human = usageOf(humanJson), social = usageOf(socialJson);",
  "const SONNET_IN = 3, SONNET_OUT = 15, HAIKU_IN = 1, HAIKU_OUT = 5;",
  "const costDraft = costOf(draft, SONNET_IN, SONNET_OUT);",
  "const costHuman = costOf(human, SONNET_IN, SONNET_OUT);",
  "const costSocial = costOf(social, HAIKU_IN, HAIKU_OUT);",
  "const total = costDraft + costHuman + costSocial;",
  "const sonnetIn = draft.inp + draft.cw + draft.cr + human.inp + human.cw + human.cr;",
  "const sonnetOut = draft.out + human.out;",
  "const haikuIn = social.inp + social.cw + social.cr;",
  "const haikuOut = social.out;",
  "const cacheRead = draft.cr + human.cr + social.cr;",
  "function k(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); }",
  "const title = carry.title || carry.blogTopic || 'post';",
  "let costLine = ':moneybag: *Cost ~$' + total.toFixed(3) + '* for \"' + title + '\"  |  ' +",
  "  'Sonnet ' + k(sonnetIn) + ' in / ' + k(sonnetOut) + ' out  |  ' +",
  "  'Haiku ' + k(haikuIn) + ' in / ' + k(haikuOut) + ' out';",
  "if (cacheRead > 0) costLine = costLine + '  |  ' + k(cacheRead) + ' cache-read';",
  "return [{ json: Object.assign({}, carry, {",
  "  costLine: costLine,",
  "  costUsd: Number(total.toFixed(4)),",
  "  costBreakdown: {",
  "    draft: Number(costDraft.toFixed(4)),",
  "    humanize: Number(costHuman.toFixed(4)),",
  "    social: Number(costSocial.toFixed(4)),",
  "  },",
  "  tokens: { sonnetIn: sonnetIn, sonnetOut: sonnetOut, haikuIn: haikuIn, haikuOut: haikuOut },",
  "}) }];",
].join('\n');

// Single-expression Slack body, byte-identical pattern to the Queue-Empty node.
const SLACK_BODY = "={{ JSON.stringify({ text: $('Compute Cost').first().json.costLine }) }}";

const changed = [];

const haveCompute = wf.nodes.some((n) => n.name === COMPUTE_NODE);
const haveSlack = wf.nodes.some((n) => n.name === SLACK_NODE);

if (!haveCompute || !haveSlack) {
  const parse = wf.nodes.find((n) => n.name === PARSE_NODE);
  if (!parse) throw new Error(`"${PARSE_NODE}" node not found; aborting.`);
  const [px, py] = parse.position || [3980, 600];

  if (!haveCompute) {
    wf.nodes.push({
      parameters: { jsCode: COMPUTE_JS },
      id: 'tag00001-0000-0000-0000-0000000000fb',
      name: COMPUTE_NODE,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [px + 220, py + 200],
    });
    changed.push(`added "${COMPUTE_NODE}" code node`);
  }

  if (!haveSlack) {
    wf.nodes.push({
      parameters: {
        method: 'POST',
        url: "={{ $('Config').first().json.slackWebhookUrl }}",
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'content-type', value: 'application/json' }] },
        sendBody: true,
        contentType: 'raw',
        rawContentType: 'application/json',
        body: SLACK_BODY,
        options: { timeout: 30000 },
      },
      id: 'tag00001-0000-0000-0000-0000000000fc',
      name: SLACK_NODE,
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [px + 440, py + 200],
    });
    changed.push(`added "${SLACK_NODE}" node`);
  }
}

// ---- connections (additive; the two Save edges are preserved) ----------------
wf.connections = wf.connections || {};
const pc = (wf.connections[PARSE_NODE] ||= { main: [[]] });
pc.main[0] ||= [];
// Guard: the existing Save fan-out must still be present, or we'd be corrupting it.
if (!pc.main[0].some((c) => c.node === 'Save Twitter Thread'))
  throw new Error(`Expected ${PARSE_NODE} -> Save Twitter Thread connection missing; aborting to avoid corrupting the social branch.`);
if (!pc.main[0].some((c) => c.node === COMPUTE_NODE)) {
  pc.main[0].push({ node: COMPUTE_NODE, type: 'main', index: 0 });
  changed.push(`wired ${PARSE_NODE} -> ${COMPUTE_NODE}`);
}
const cc = (wf.connections[COMPUTE_NODE] ||= { main: [[]] });
cc.main[0] ||= [];
if (!cc.main[0].some((c) => c.node === SLACK_NODE)) {
  cc.main[0].push({ node: SLACK_NODE, type: 'main', index: 0 });
  changed.push(`wired ${COMPUTE_NODE} -> ${SLACK_NODE}`);
}

// ---- self-checks: the new content must not introduce expression-breaking tokens
const compute = wf.nodes.find((n) => n.name === COMPUTE_NODE);
const slack = wf.nodes.find((n) => n.name === SLACK_NODE);
const tok = (s) => ({
  open: (s.match(/\{\{/g) || []).length,
  close: (s.match(/\}\}/g) || []).length,
  tick: (s.match(/`/g) || []).length,
});
const cj = tok(compute.parameters.jsCode);
if (cj.open || cj.close || cj.tick)
  throw new Error(`Compute Cost jsCode carries forbidden tokens: ${JSON.stringify(cj)}`);
const sb = tok(slack.parameters.body);
if (sb.open !== 1 || sb.close !== 1 || sb.tick !== 0)
  throw new Error(`Log Cost to Slack body is not a single clean expression: ${JSON.stringify(sb)}`);
// Round-trip guard.
JSON.parse(JSON.stringify(wf));

writeFileSync(FILE, JSON.stringify(wf, null, 2) + '\n', 'utf8');
console.log(changed.length ? `Updated blog-post-engine.json:\n  - ${changed.join('\n  - ')}` : 'No changes (already up to date).');
console.log(`Node count: ${wf.nodes.length}`);

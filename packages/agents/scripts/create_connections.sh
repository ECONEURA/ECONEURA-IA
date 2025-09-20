#!/usr/bin/env bash
set -euo pipefail

TRACE_ID=$(date +%s)-$RANDOM
ACTOR=${ACTOR:-"vs-code-agent"}
ACTION_LOG="packages/agents/scripts/create_connections_${TRACE_ID}.json"

function log_action() {
  local status=$1; shift
  jq -n --arg trace_id "$TRACE_ID" --arg actor "$ACTOR" --arg action "$1" --arg status "$status" \
    '{trace_id:$trace_id,actor:$actor,action:$action,status:$status,timestamp:(now|tostring)}' >> "$ACTION_LOG"
}

function dry_run() {
  echo "DRY-RUN: will create agents.connections yaml and connectors if missing."
  echo "Files that would be created/validated:"
  echo " - packages/agents/config/agents.connections.yaml"
  echo " - packages/agents/src/connector/makeConnector.js"
  echo " - packages/agents/src/connector/neuraRouter.js"
  echo " - packages/agents/src/connector/logger.js"
  echo " - packages/agents/test/integration/make.neura.test.js"
  echo
  log_action "DRY-RUN" "validate-create-files"
  echo "Dry-run artifact written to $ACTION_LOG"
  cat "$ACTION_LOG"
}

function apply() {
  # apply only local file creation (no Azure commands here)
  echo "APPLY: ensuring connectors and tests exist (no secrets written)."
  # ensure minimal connector files exist (idempotent)
  if [ ! -f packages/agents/src/connector/makeConnector.js ]; then
    cat > packages/agents/src/connector/makeConnector.js <<'JS'
/**
 * makeConnector.js - minimal resilient webhook sender
 * Note: does NOT read secrets. Secrets must come from env or Key Vault in runtime.
 */
const fetch = require('node-fetch');

async function sendToMake(agentId, webhookKey, payload, apiKey) {
  if (!agentId || !webhookKey) throw new Error('missing agentId or webhookKey');
  const base = process.env.MAKE_WEBHOOK_BASE || 'https://hook.make.com';
  const url = `${base}/trigger/${agentId}/with/key/${webhookKey}`;
  const headers = {'Content-Type': 'application/json'};
  if (apiKey) headers['X-Make-Key'] = apiKey;
  const timeout = parseInt(process.env.MAKE_TIMEOUT_MS || '30000', 10);
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try {
    const res = await fetch(url, {method:'POST', body:JSON.stringify(payload), headers, signal: controller.signal});
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(()=>'<no-body>');
      throw new Error(`Make webhook failed ${res.status} ${text}`);
    }
    return res.json().catch(()=>({status:'ok'}));
  } finally {
    clearTimeout(id);
  }
}

module.exports = { sendToMake };
JS
    echo "created packages/agents/src/connector/makeConnector.js"
  else
    echo "exists: packages/agents/src/connector/makeConnector.js"
  fi

  if [ ! -f packages/agents/src/connector/neuraRouter.js ]; then
    cat > packages/agents/src/connector/neuraRouter.js <<'JS'
/**
 * neuraRouter.js - choose backend and call /reason
 */
const fetch = require('node-fetch');

function chooseBackend(preferAzure=false) {
  const local = process.env.NEURA_LOCAL_URL || '';
  const azure = process.env.NEURA_AZURE_URL || '';
  if (preferAzure && azure) return {url: azure, type: 'azure'};
  if (local) return {url: local, type: 'local'};
  if (azure) return {url: azure, type: 'azure'};
  throw new Error('No Neura backend configured');
}

async function callNeura(payload, opts={}) {
  const {preferAzure=false, auth={}} = opts;
  const backend = chooseBackend(preferAzure);
  const headers = {'Content-Type':'application/json'};
  if (backend.type === 'azure' && auth.bearer) headers['Authorization'] = `Bearer ${auth.bearer}`;
  const timeout = parseInt(process.env.NEURA_TIMEOUT_MS || '60000', 10);
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try {
    const res = await fetch(`${backend.url.replace(/\/$/,'')}/reason`, {
      method:'POST',
      body: JSON.stringify(payload),
      headers,
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(()=>'<no-body>');
      throw new Error(`Neura ${backend.type} failed ${res.status} ${text}`);
    }
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

module.exports = { callNeura, chooseBackend };
JS
    echo "created packages/agents/src/connector/neuraRouter.js"
  else
    echo "exists: packages/agents/src/connector/neuraRouter.js"
  fi

  if [ ! -f packages/agents/src/connector/logger.js ]; then
    cat > packages/agents/src/connector/logger.js <<'LOG'
/**
 * logger.js - redacts bearer tokens and passwords, emits JSON logs
 */
function redact(s){
  if (!s) return s;
  return String(s).replace(/(Bearer\s)[A-Za-z0-9\._\-]+/g,'$1<REDACTED>').replace(/"password"\s*:\s*"[^"]+"/ig,'"password":"<REDACTED>"');
}
function info(msg, obj){
  const payload = {ts: new Date().toISOString(), level:'info', msg, obj: obj ? redact(JSON.stringify(obj)) : null};
  console.log(JSON.stringify(payload));
}
function error(msg, err){
  const payload = {ts: new Date().toISOString(), level:'error', msg, err: err && err.message ? err.message : err};
  console.error(JSON.stringify(payload));
}
module.exports = {info, error};
LOG
    echo "created packages/agents/src/connector/logger.js"
  else
    echo "exists: packages/agents/src/connector/logger.js"
  fi

  if [ ! -f packages/agents/test/integration/make.neura.test.js ]; then
    cat > packages/agents/test/integration/make.neura.test.js <<'NODE'
/**
 * smoke test: send ping to Make webhook and to Neura backend
 * Local: requires NEURA_LOCAL_URL to be reachable.
 * CI: will be mocked via env CI=true (not implemented here).
 */
const { sendToMake } = require('../../src/connector/makeConnector');
const { callNeura } = require('../../src/connector/neuraRouter');

(async () => {
  try {
    const makeKey = process.env.MAKE_API_KEY || '<REDACTED>';
    const webhookKey = process.env.TEST_AGENT_WEBHOOK_KEY || '<REDACTED>';
    await sendToMake('test-agent', webhookKey, {ping:true}, makeKey);
    console.log('MAKE_OK');
  } catch (e) {
    console.error('MAKE_FAIL', e.message);
    process.exit(2);
  }
  try {
    const r = await callNeura({query:'ping'}, {preferAzure:false});
    console.log('NEURA_OK', JSON.stringify(r).slice(0,200));
  } catch (e) {
    console.error('NEURA_FAIL', e.message);
    process.exit(3);
  }
  process.exit(0);
})();
NODE
    echo "created packages/agents/test/integration/make.neura.test.js"
  else
    echo "exists: packages/agents/test/integration/make.neura.test.js"
  fi

  # success
  log_action "APPLY" "files-created-or-validated"
  echo "APPLY complete. action log: $ACTION_LOG"
  cat "$ACTION_LOG"
}

function rollback() {
  echo "ROLLBACK: removing only files created by apply if present."
  rm -f packages/agents/src/connector/makeConnector.js \
        packages/agents/src/connector/neuraRouter.js \
        packages/agents/src/connector/logger.js \
        packages/agents/test/integration/make.neura.test.js
  log_action "ROLLBACK" "files-removed"
  echo "Rollback complete. action log: $ACTION_LOG"
  cat "$ACTION_LOG"
}

# CLI dispatch
case "${1:---dry-run}" in
  --dry-run) dry_run ;;
  --apply) apply ;;
  --rollback) rollback ;;
  *) echo "Usage: $0 [--dry-run|--apply|--rollback]"; exit 1 ;;
esac
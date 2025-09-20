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

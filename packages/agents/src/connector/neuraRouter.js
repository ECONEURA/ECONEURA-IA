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

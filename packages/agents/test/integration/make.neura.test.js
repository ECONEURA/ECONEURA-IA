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

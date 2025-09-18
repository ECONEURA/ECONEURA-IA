const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// optional: OpenTelemetry bootstrap (install deps if used)
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { AzureMonitorTraceExporter } = require('@azure/monitor-opentelemetry-exporter');
    const sdk = new NodeSDK({
      traceExporter: new AzureMonitorTraceExporter({ connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING }),
      instrumentations: [getNodeAutoInstrumentations()]
    });
    sdk.start().catch(e => console.error('OTel start failed', e));
    console.log('OpenTelemetry started');
  } catch (e) {
    console.log('OpenTelemetry not configured or failed to init', e.message);
  }
}

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(bodyParser.json({ limit: '2mb' }));

  // Health
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Minimal RAG endpoint (development stub)
  app.post('/v1/edge/rag', (req, res) => {
    const trace_id = req.body?.trace_id || require('crypto').randomUUID();
    const query = typeof req.body?.query === 'string' ? req.body.query : '';
    const answer = `ECHO: ${query.slice(0,200)}`;
    const citations = [];
    const policy_applied = ['policy:dev-stub'];
    return res.json({ trace_id, answer, citations, policy_applied });
  });

  return app;
}

module.exports = { createApp };

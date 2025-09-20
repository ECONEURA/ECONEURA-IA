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
    }
    catch (e) {
        console.log('OpenTelemetry not configured or failed to init', e.message);
    }
}
//# sourceMappingURL=app-otel-snippet.js.map
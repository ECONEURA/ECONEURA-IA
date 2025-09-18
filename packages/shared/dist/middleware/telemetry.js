export function telemetryMiddleware(req, res, next) {
    req.startTime = Date.now();
    req.correlationId = req.header('x-correlation-id') || crypto.randomUUID();
    res.set('X-Correlation-Id', req.correlationId);
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - (req.startTime || 0);
        res.set({
            'X-Latency-ms': duration.toString(),
            'X-Route': req.path,
            'X-Method': req.method
        });
        originalEnd.call(this, chunk, encoding);
    };
    next();
}
export function costTrackingMiddleware(req, res, next) {
    let estimatedCost = 0;
    if (req.path.includes('/agents/trigger')) {
        estimatedCost = 0.001;
    }
    else if (req.path.includes('/agents/events')) {
        estimatedCost = 0.0005;
    }
    res.set({
        'X-Est-Cost-EUR': estimatedCost.toFixed(4),
        'X-Budget-Pct': '5',
        'X-Cost-Breakdown': JSON.stringify({
            service: 'make-webhook',
            operation: req.path.split('/').pop(),
            cost: estimatedCost
        })
    });
    next();
}
//# sourceMappingURL=telemetry.js.map
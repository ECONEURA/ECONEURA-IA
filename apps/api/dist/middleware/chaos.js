import { logger } from '../lib/logger.js';
const defaultConfig = {
    enabled: process.env.CHAOS_ENABLED === 'true',
    faultRate: Number(process.env.CHAOS_FAULT_RATE || 0.1),
    latencyMs: {
        min: Number(process.env.CHAOS_LAT_MIN || 50),
        max: Number(process.env.CHAOS_LAT_MAX || 350),
        probability: Number(process.env.CHAOS_LAT_PROB || 0.5),
    },
    error: {
        probability: Number(process.env.CHAOS_ERR_PROB || 0.05),
        statusCodes: [429, 500, 502, 503, 504],
    },
    onlyPaths: undefined,
    skipPaths: [
        /^\/health(\/.*)?$/,
        /^\/healthz$/,
        /^\/readyz$/,
        /^\/v1\/observability\/metrics(\/.*)?$/,
    ],
};
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shouldAffectPath(path, config) {
    if (config.onlyPaths && config.onlyPaths.length > 0) {
        return config.onlyPaths.some(re => re.test(path));
    }
    if (config.skipPaths && config.skipPaths.some(re => re.test(path))) {
        return false;
    }
    return true;
}
export function chaosMiddleware(config = {}) {
    const cfg = { ...defaultConfig, ...config };
    return async function (req, res, next) {
        try {
            if (!cfg.enabled)
                return next();
            if (!shouldAffectPath(req.path, cfg))
                return next();
            const dice = Math.random();
            if (dice > cfg.faultRate)
                return next();
            if (Math.random() < cfg.latencyMs.probability) {
                const delay = randomInt(cfg.latencyMs.min, cfg.latencyMs.max);
                await new Promise(resolve => setTimeout(resolve, delay));
                logger.warn('Chaos: injected latency', { path: req.path, duration: delay });
            }
            if (Math.random() < cfg.error.probability) {
                const status = cfg.error.statusCodes[randomInt(0, cfg.error.statusCodes.length - 1)];
                logger.error('Chaos: injected error', { path: req.path, statusCode: status });
                return res.status(status).json({
                    error: 'CHAOS_INJECTED',
                    message: 'Injected failure for chaos testing',
                    status,
                });
            }
            return next();
        }
        catch (e) {
            logger.error('Chaos middleware failure', { error: e?.message });
            return next();
        }
    };
}
export function createChaosToggleEndpoints(app) {
    app.post('/v1/chaos/toggle', (req, res) => {
        const { enabled } = req.body || {};
        if (enabled === true || enabled === false) {
            process.env.CHAOS_ENABLED = String(enabled);
            return res.json({ success: true, enabled });
        }
        return res.status(400).json({ success: false, error: 'enabled must be boolean' });
    });
    app.get('/v1/chaos/status', (_req, res) => {
        res.json({
            enabled: process.env.CHAOS_ENABLED === 'true',
            faultRate: Number(process.env.CHAOS_FAULT_RATE || defaultConfig.faultRate),
            latency: {
                min: Number(process.env.CHAOS_LAT_MIN || defaultConfig.latencyMs.min),
                max: Number(process.env.CHAOS_LAT_MAX || defaultConfig.latencyMs.max),
                probability: Number(process.env.CHAOS_LAT_PROB || defaultConfig.latencyMs.probability),
            },
            error: {
                probability: Number(process.env.CHAOS_ERR_PROB || defaultConfig.error.probability),
            },
        });
    });
}
//# sourceMappingURL=chaos.js.map
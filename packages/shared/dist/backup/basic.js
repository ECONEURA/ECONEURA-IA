import express from "express";
import cors from "cors";
import { structuredLogger } from './lib/structured-logger.js';
import { healthModeManager } from './lib/health-modes.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 'X-Correlation-ID']
}));
app.get("/health", (req, res) => {
    const ts = new Date().toISOString();
    const version = process.env.npm_package_version || "1.0.0";
    const currentMode = healthModeManager.getCurrentMode();
    res.set('X-System-Mode', currentMode);
    res.status(200).json({
        status: "ok",
        ts,
        version,
        mode: currentMode
    });
});
app.get("/health/live", async (req, res) => {
    try {
        const result = await healthModeManager.getLivenessProbe();
        const statusCode = result.status === 'ok' ? 200 : 503;
        res.set('X-System-Mode', result.mode);
        res.status(statusCode).json(result);
    }
    catch (error) {
        res.status(503).json({
            status: "error",
            mode: "degraded",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            error: error.message
        });
    }
});
app.get("/health/ready", async (req, res) => {
    try {
        const result = await healthModeManager.getReadinessProbe();
        const statusCode = result.status === 'ok' ? 200 : 503;
        res.set('X-System-Mode', result.mode);
        res.status(statusCode).json(result);
    }
    catch (error) {
        res.status(503).json({
            status: "error",
            mode: "degraded",
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            error: error.message
        });
    }
});
app.get("/", (req, res) => {
    res.json({
        name: "ECONEURA API",
        version: process.env.npm_package_version || "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
        endpoints: [
            "GET /health - Basic health check",
            "GET /health/live - Liveness probe",
            "GET /health/ready - Readiness probe"
        ]
    });
});
app.use((error, req, res, next) => {
    structuredLogger.error('Unhandled error', error, {
        path: req.path,
        method: req.method,
        headers: req.headers
    });
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});
const server = app.listen(PORT, () => {
    structuredLogger.info(`ECONEURA API Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
process.on('SIGTERM', () => {
    structuredLogger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        structuredLogger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    structuredLogger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        structuredLogger.info('Process terminated');
        process.exit(0);
    });
});
export default app;
//# sourceMappingURL=basic.js.map
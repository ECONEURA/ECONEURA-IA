import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from './structured-logger.js';
export class ApiVersioningService {
    config;
    db;
    versions = new Map();
    versionMetrics = new Map();
    constructor(config) {
        this.config = {
            defaultVersion: 'v1',
            supportedVersions: ['v1'],
            enableVersionHeader: true,
            enableUrlVersioning: true,
            enableQueryVersioning: true,
            enableDeprecationWarnings: true,
            enableSunsetWarnings: true,
            warningPeriodDays: 30,
            enableVersionMetrics: true,
            ...config
        };
        this.db = getDatabaseService();
        this.initializeVersions();
        this.startMetricsCleanup();
    }
    initializeVersions() {
        this.versions.set('v1', {
            version: 'v1',
            status: 'current',
            releaseDate: new Date('2024-01-01'),
            changelog: [
                'Initial API version',
                'Core authentication and authorization',
                'Basic CRUD operations for all entities',
                'AI services integration',
                'Analytics and reporting'
            ],
            breakingChanges: [],
            newFeatures: [
                'JWT authentication',
                'RBAC authorization',
                'Multi-tenant architecture',
                'AI-powered features',
                'Real-time analytics'
            ],
            bugFixes: [],
            supportedClients: ['web', 'mobile', 'api']
        });
        this.versions.set('v2', {
            version: 'v2',
            status: 'deprecated',
            releaseDate: new Date('2024-06-01'),
            sunsetDate: new Date('2024-12-31'),
            changelog: [
                'Enhanced AI capabilities',
                'Improved performance',
                'New analytics features'
            ],
            breakingChanges: [
                'Authentication header format changed',
                'Response format standardized',
                'Some endpoints renamed'
            ],
            newFeatures: [
                'GraphQL support',
                'WebSocket real-time updates',
                'Advanced AI models'
            ],
            bugFixes: [
                'Fixed memory leaks in AI services',
                'Improved error handling'
            ],
            migrationGuide: 'See /docs/migration/v1-to-v2',
            supportedClients: ['web', 'mobile', 'api']
        });
        structuredLogger.info('API versions initialized', {
            versions: Array.from(this.versions.keys()),
            defaultVersion: this.config.defaultVersion
        });
    }
    versionMiddleware = (req, res, next) => {
        const startTime = Date.now();
        try {
            let requestedVersion = this.config.defaultVersion;
            let versionSource = 'default';
            if (this.config.enableUrlVersioning) {
                const urlMatch = req.path.match(/^\/(v\d+)\//);
                if (urlMatch) {
                    requestedVersion = urlMatch[1];
                    versionSource = 'url';
                }
            }
            if (this.config.enableVersionHeader && !versionSource) {
                const acceptHeader = req.headers.accept;
                if (acceptHeader) {
                    const headerMatch = acceptHeader.match(/application\/vnd\.econeura\.(v\d+)\+json/);
                    if (headerMatch) {
                        requestedVersion = headerMatch[1];
                        versionSource = 'header';
                    }
                }
            }
            if (this.config.enableVersionHeader && !versionSource) {
                const customHeader = req.headers['x-api-version'];
                if (customHeader) {
                    requestedVersion = customHeader;
                    versionSource = 'custom-header';
                }
            }
            if (this.config.enableQueryVersioning && !versionSource) {
                const queryVersion = req.query.version;
                if (queryVersion) {
                    requestedVersion = queryVersion;
                    versionSource = 'query';
                }
            }
            if (!this.isVersionSupported(requestedVersion)) {
                res.status(400).json({
                    error: 'Unsupported API version',
                    message: `API version '${requestedVersion}' is not supported`,
                    supportedVersions: this.config.supportedVersions,
                    defaultVersion: this.config.defaultVersion,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const versionInfo = this.versions.get(requestedVersion);
            if (!versionInfo) {
                res.status(500).json({
                    error: 'Version configuration error',
                    message: 'Version information not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            if (versionInfo.status === 'retired') {
                res.status(410).json({
                    error: 'API version retired',
                    message: `API version '${requestedVersion}' has been retired`,
                    retirementDate: versionInfo.retirementDate,
                    supportedVersions: this.config.supportedVersions,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            req.apiVersion = requestedVersion;
            req.versionInfo = versionInfo;
            req.versionSource = versionSource;
            res.set({
                'X-API-Version': requestedVersion,
                'X-API-Version-Status': versionInfo.status,
                'X-API-Version-Source': versionSource
            });
            if (this.config.enableDeprecationWarnings && versionInfo.status === 'deprecated') {
                res.set('X-API-Deprecation-Warning', `API version '${requestedVersion}' is deprecated`);
                if (versionInfo.sunsetDate) {
                    const daysUntilSunset = Math.ceil((versionInfo.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    res.set('X-API-Sunset-Date', versionInfo.sunsetDate.toISOString());
                    res.set('X-API-Sunset-Warning', `API version '${requestedVersion}' will be sunset in ${daysUntilSunset} days`);
                }
            }
            if (this.config.enableSunsetWarnings && versionInfo.status === 'sunset') {
                res.set('X-API-Sunset-Warning', `API version '${requestedVersion}' is in sunset period`);
                if (versionInfo.retirementDate) {
                    const daysUntilRetirement = Math.ceil((versionInfo.retirementDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    res.set('X-API-Retirement-Date', versionInfo.retirementDate.toISOString());
                    res.set('X-API-Retirement-Warning', `API version '${requestedVersion}' will be retired in ${daysUntilRetirement} days`);
                }
            }
            if (this.config.enableVersionMetrics) {
                this.updateVersionMetrics(requestedVersion, req, Date.now() - startTime);
            }
            structuredLogger.info('API version detected', {
                version: requestedVersion,
                source: versionSource,
                status: versionInfo.status,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            next();
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            structuredLogger.error('Version detection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
                path: req.path,
                method: req.method
            });
            res.status(500).json({
                error: 'Version detection failed',
                message: 'An error occurred while detecting API version',
                timestamp: new Date().toISOString()
            });
        }
    };
    isVersionSupported(version) {
        return this.config.supportedVersions.includes(version);
    }
    getVersionInfo(version) {
        return this.versions.get(version) || null;
    }
    getAllVersions() {
        return Array.from(this.versions.values());
    }
    getCurrentVersion() {
        return this.versions.get(this.config.defaultVersion) || null;
    }
    getSupportedVersions() {
        return this.config.supportedVersions;
    }
    updateVersionMetrics(version, req, responseTime) {
        const metrics = this.versionMetrics.get(version) || {
            version,
            requestCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            lastRequest: new Date(),
            uniqueClients: new Set()
        };
        metrics.requestCount++;
        metrics.lastRequest = new Date();
        metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
        const clientId = req.headers['x-client-id'] || req.ip || 'unknown';
        metrics.uniqueClients.add(clientId);
        this.versionMetrics.set(version, metrics);
    }
    getVersionMetrics(version) {
        if (version) {
            return this.versionMetrics.get(version) || {
                version,
                requestCount: 0,
                errorCount: 0,
                averageResponseTime: 0,
                lastRequest: new Date(),
                uniqueClients: new Set()
            };
        }
        return new Map(this.versionMetrics);
    }
    recordVersionError(version) {
        const metrics = this.versionMetrics.get(version);
        if (metrics) {
            metrics.errorCount++;
            this.versionMetrics.set(version, metrics);
        }
    }
    getVersionInfoEndpoint = (req, res) => {
        const version = req.apiVersion || this.config.defaultVersion;
        const versionInfo = this.versions.get(version);
        if (!versionInfo) {
            res.status(404).json({
                error: 'Version not found',
                message: `Version '${version}' not found`,
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            version: versionInfo.version,
            status: versionInfo.status,
            releaseDate: versionInfo.releaseDate,
            sunsetDate: versionInfo.sunsetDate,
            retirementDate: versionInfo.retirementDate,
            changelog: versionInfo.changelog,
            breakingChanges: versionInfo.breakingChanges,
            newFeatures: versionInfo.newFeatures,
            bugFixes: versionInfo.bugFixes,
            migrationGuide: versionInfo.migrationGuide,
            supportedClients: versionInfo.supportedClients,
            timestamp: new Date().toISOString()
        });
    };
    getAllVersionsEndpoint = (req, res) => {
        const allVersions = this.getAllVersions();
        res.json({
            versions: allVersions,
            defaultVersion: this.config.defaultVersion,
            supportedVersions: this.config.supportedVersions,
            timestamp: new Date().toISOString()
        });
    };
    getVersionMetricsEndpoint = (req, res) => {
        if (!this.config.enableVersionMetrics) {
            res.status(404).json({
                error: 'Version metrics disabled',
                message: 'Version metrics are not enabled',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const version = req.query.version;
        const metrics = this.getVersionMetrics(version);
        if (version) {
            res.json({
                version,
                metrics,
                timestamp: new Date().toISOString()
            });
        }
        else {
            const metricsMap = metrics;
            const metricsObject = {};
            for (const [ver, metric] of metricsMap.entries()) {
                metricsObject[ver] = {
                    ...metric,
                    uniqueClients: metric.uniqueClients.size
                };
            }
            res.json({
                metrics: metricsObject,
                timestamp: new Date().toISOString()
            });
        }
    };
    getMigrationGuideEndpoint = (req, res) => {
        const fromVersion = req.query.from;
        const toVersion = req.query.to;
        if (!fromVersion || !toVersion) {
            res.status(400).json({
                error: 'Missing parameters',
                message: 'Both from and to version parameters are required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const fromVersionInfo = this.versions.get(fromVersion);
        const toVersionInfo = this.versions.get(toVersion);
        if (!fromVersionInfo || !toVersionInfo) {
            res.status(404).json({
                error: 'Version not found',
                message: 'One or both versions not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            migration: {
                from: fromVersion,
                to: toVersion,
                breakingChanges: toVersionInfo.breakingChanges,
                newFeatures: toVersionInfo.newFeatures,
                migrationGuide: toVersionInfo.migrationGuide,
                recommendedActions: this.generateMigrationRecommendations(fromVersionInfo, toVersionInfo)
            },
            timestamp: new Date().toISOString()
        });
    };
    generateMigrationRecommendations(fromVersion, toVersion) {
        const recommendations = [];
        if (toVersion.breakingChanges.length > 0) {
            recommendations.push('Review breaking changes and update your client code accordingly');
        }
        if (toVersion.newFeatures.length > 0) {
            recommendations.push('Consider adopting new features for improved functionality');
        }
        if (toVersion.status === 'deprecated' || toVersion.status === 'sunset') {
            recommendations.push('Plan migration to a supported version');
        }
        return recommendations;
    }
    startMetricsCleanup() {
        if (!this.config.enableVersionMetrics)
            return;
        setInterval(() => {
            const now = Date.now();
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            for (const [version, metrics] of this.versionMetrics.entries()) {
                if (metrics.lastRequest.getTime() < oneDayAgo) {
                    this.versionMetrics.set(version, {
                        version,
                        requestCount: 0,
                        errorCount: 0,
                        averageResponseTime: 0,
                        lastRequest: new Date(),
                        uniqueClients: new Set()
                    });
                }
            }
        }, 60 * 60 * 1000);
    }
}
export const apiVersioningService = new ApiVersioningService();
//# sourceMappingURL=api-versioning.service.js.map
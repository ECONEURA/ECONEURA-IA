import { Request, Response, NextFunction } from 'express';
import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from './structured-logger.js';

// ============================================================================
// API VERSIONING SERVICE
// ============================================================================

interface ApiVersion {
  version: string;
  status: 'current' | 'deprecated' | 'sunset' | 'retired';
  releaseDate: Date;
  sunsetDate?: Date;
  retirementDate?: Date;
  changelog: string[];
  breakingChanges: string[];
  newFeatures: string[];
  bugFixes: string[];
  migrationGuide?: string;
  supportedClients: string[];
}

interface VersionConfig {
  defaultVersion: string;
  supportedVersions: string[];
  enableVersionHeader: boolean;
  enableUrlVersioning: boolean;
  enableQueryVersioning: boolean;
  enableDeprecationWarnings: boolean;
  enableSunsetWarnings: boolean;
  warningPeriodDays: number;
  enableVersionMetrics: boolean;
}

interface VersionMetrics {
  version: string;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequest: Date;
  uniqueClients: Set<string>;
}

export class ApiVersioningService {
  private config: VersionConfig;
  private db: ReturnType<typeof getDatabaseService>;
  private versions: Map<string, ApiVersion> = new Map();
  private versionMetrics: Map<string, VersionMetrics> = new Map();

  constructor(config?: Partial<VersionConfig>) {
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

  // ========================================================================
  // VERSION INITIALIZATION
  // ========================================================================

  private initializeVersions(): void {
    // Initialize supported API versions
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

    // Future versions (for planning)
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

  // ========================================================================
  // VERSION DETECTION MIDDLEWARE
  // ========================================================================

  public versionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    try {
      let requestedVersion = this.config.defaultVersion;
      let versionSource = 'default';

      // 1. Check URL versioning (/v1/path)
      if (this.config.enableUrlVersioning) {
        const urlMatch = req.path.match(/^\/(v\d+)\//);
        if (urlMatch) {
          requestedVersion = urlMatch[1];
          versionSource = 'url';
        }
      }

      // 2. Check header versioning (Accept: application/vnd.econeura.v1+json)
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

      // 3. Check custom header (X-API-Version: v1)
      if (this.config.enableVersionHeader && !versionSource) {
        const customHeader = req.headers['x-api-version'] as string;
        if (customHeader) {
          requestedVersion = customHeader;
          versionSource = 'custom-header';
        }
      }

      // 4. Check query parameter (?version=v1)
      if (this.config.enableQueryVersioning && !versionSource) {
        const queryVersion = req.query.version as string;
        if (queryVersion) {
          requestedVersion = queryVersion;
          versionSource = 'query';
        }
      }

      // Validate version
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

      // Get version info
      const versionInfo = this.versions.get(requestedVersion);
      if (!versionInfo) {
        res.status(500).json({
          error: 'Version configuration error',
          message: 'Version information not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check version status
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

      // Add version info to request
      req.apiVersion = requestedVersion;
      req.versionInfo = versionInfo;
      req.versionSource = versionSource;

      // Add version headers to response
      res.set({
        'X-API-Version': requestedVersion,
        'X-API-Version-Status': versionInfo.status,
        'X-API-Version-Source': versionSource
      });

      // Add deprecation warnings
      if (this.config.enableDeprecationWarnings && versionInfo.status === 'deprecated') {
        res.set('X-API-Deprecation-Warning', `API version '${requestedVersion}' is deprecated`);
        
        if (versionInfo.sunsetDate) {
          const daysUntilSunset = Math.ceil((versionInfo.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          res.set('X-API-Sunset-Date', versionInfo.sunsetDate.toISOString());
          res.set('X-API-Sunset-Warning', `API version '${requestedVersion}' will be sunset in ${daysUntilSunset} days`);
        }
      }

      // Add sunset warnings
      if (this.config.enableSunsetWarnings && versionInfo.status === 'sunset') {
        res.set('X-API-Sunset-Warning', `API version '${requestedVersion}' is in sunset period`);
        
        if (versionInfo.retirementDate) {
          const daysUntilRetirement = Math.ceil((versionInfo.retirementDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          res.set('X-API-Retirement-Date', versionInfo.retirementDate.toISOString());
          res.set('X-API-Retirement-Warning', `API version '${requestedVersion}' will be retired in ${daysUntilRetirement} days`);
        }
      }

      // Update metrics
      if (this.config.enableVersionMetrics) {
        this.updateVersionMetrics(requestedVersion, req, Date.now() - startTime);
      }

      // Log version usage
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

    } catch (error) {
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

  // ========================================================================
  // VERSION MANAGEMENT
  // ========================================================================

  public isVersionSupported(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  public getVersionInfo(version: string): ApiVersion | null {
    return this.versions.get(version) || null;
  }

  public getAllVersions(): ApiVersion[] {
    return Array.from(this.versions.values());
  }

  public getCurrentVersion(): ApiVersion | null {
    return this.versions.get(this.config.defaultVersion) || null;
  }

  public getSupportedVersions(): string[] {
    return this.config.supportedVersions;
  }

  // ========================================================================
  // VERSION METRICS
  // ========================================================================

  private updateVersionMetrics(version: string, req: Request, responseTime: number): void {
    const metrics = this.versionMetrics.get(version) || {
      version,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastRequest: new Date(),
      uniqueClients: new Set<string>()
    };

    metrics.requestCount++;
    metrics.lastRequest = new Date();
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;

    // Track unique clients
    const clientId = req.headers['x-client-id'] as string || req.ip || 'unknown';
    metrics.uniqueClients.add(clientId);

    this.versionMetrics.set(version, metrics);
  }

  public getVersionMetrics(version?: string): VersionMetrics | Map<string, VersionMetrics> {
    if (version) {
      return this.versionMetrics.get(version) || {
        version,
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        lastRequest: new Date(),
        uniqueClients: new Set<string>()
      };
    }
    return new Map(this.versionMetrics);
  }

  public recordVersionError(version: string): void {
    const metrics = this.versionMetrics.get(version);
    if (metrics) {
      metrics.errorCount++;
      this.versionMetrics.set(version, metrics);
    }
  }

  // ========================================================================
  // VERSION ENDPOINTS
  // ========================================================================

  public getVersionInfoEndpoint = (req: Request, res: Response): void => {
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

  public getAllVersionsEndpoint = (req: Request, res: Response): void => {
    const allVersions = this.getAllVersions();
    
    res.json({
      versions: allVersions,
      defaultVersion: this.config.defaultVersion,
      supportedVersions: this.config.supportedVersions,
      timestamp: new Date().toISOString()
    });
  };

  public getVersionMetricsEndpoint = (req: Request, res: Response): void => {
    if (!this.config.enableVersionMetrics) {
      res.status(404).json({
        error: 'Version metrics disabled',
        message: 'Version metrics are not enabled',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const version = req.query.version as string;
    const metrics = this.getVersionMetrics(version);

    if (version) {
      res.json({
        version,
        metrics,
        timestamp: new Date().toISOString()
      });
    } else {
      const metricsMap = metrics as Map<string, VersionMetrics>;
      const metricsObject: Record<string, any> = {};
      
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

  // ========================================================================
  // VERSION MIGRATION
  // ========================================================================

  public getMigrationGuideEndpoint = (req: Request, res: Response): void => {
    const fromVersion = req.query.from as string;
    const toVersion = req.query.to as string;

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

  private generateMigrationRecommendations(fromVersion: ApiVersion, toVersion: ApiVersion): string[] {
    const recommendations: string[] = [];

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

  // ========================================================================
  // CLEANUP TASKS
  // ========================================================================

  private startMetricsCleanup(): void {
    if (!this.config.enableVersionMetrics) return;

    setInterval(() => {
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      for (const [version, metrics] of this.versionMetrics.entries()) {
        if (metrics.lastRequest.getTime() < oneDayAgo) {
          // Reset metrics for inactive versions
          this.versionMetrics.set(version, {
            version,
            requestCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            lastRequest: new Date(),
            uniqueClients: new Set<string>()
          });
        }
      }
    }, 60 * 60 * 1000); // Cleanup every hour
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
      versionInfo?: ApiVersion;
      versionSource?: string;
    }
  }
}

export const apiVersioningService = new ApiVersioningService();

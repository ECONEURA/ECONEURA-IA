import { Request, Response, NextFunction } from 'express';
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
export declare class ApiVersioningService {
    private config;
    private db;
    private versions;
    private versionMetrics;
    constructor(config?: Partial<VersionConfig>);
    private initializeVersions;
    versionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    isVersionSupported(version: string): boolean;
    getVersionInfo(version: string): ApiVersion | null;
    getAllVersions(): ApiVersion[];
    getCurrentVersion(): ApiVersion | null;
    getSupportedVersions(): string[];
    private updateVersionMetrics;
    getVersionMetrics(version?: string): VersionMetrics | Map<string, VersionMetrics>;
    recordVersionError(version: string): void;
    getVersionInfoEndpoint: (req: Request, res: Response) => void;
    getAllVersionsEndpoint: (req: Request, res: Response) => void;
    getVersionMetricsEndpoint: (req: Request, res: Response) => void;
    getMigrationGuideEndpoint: (req: Request, res: Response) => void;
    private generateMigrationRecommendations;
    private startMetricsCleanup;
}
declare global {
    namespace Express {
        interface Request {
            apiVersion?: string;
            versionInfo?: ApiVersion;
            versionSource?: string;
        }
    }
}
export declare const apiVersioningService: ApiVersioningService;
export {};
//# sourceMappingURL=api-versioning.service.d.ts.map
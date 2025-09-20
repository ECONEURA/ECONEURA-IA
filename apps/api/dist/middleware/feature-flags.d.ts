import { Request, Response, NextFunction } from 'express';
import { FeatureFlagContext } from '../lib/configuration.js';
export interface FeatureFlagRequest extends Request {
    featureFlags?: {
        [key: string]: boolean;
    };
    featureFlagContext?: FeatureFlagContext;
}
export interface FeatureFlagMiddlewareOptions {
    flags?: string[];
    requireAll?: boolean;
    contextExtractor?: (req: Request) => FeatureFlagContext;
}
export declare const featureFlagMiddleware: (options?: FeatureFlagMiddlewareOptions) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => void;
export declare const requireFeatureFlag: (flagId: string, contextExtractor?: (req: Request) => FeatureFlagContext) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyFeatureFlag: (flagIds: string[], contextExtractor?: (req: Request) => FeatureFlagContext) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => void;
export declare const featureFlagInfoMiddleware: (contextExtractor?: (req: Request) => FeatureFlagContext) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => void;
export declare const isFeatureEnabled: (flagId: string, context?: FeatureFlagContext) => boolean;
export declare const getConfigValue: (key: string, environment?: string, defaultValue?: any) => any;
export declare const getSecret: (key: string, environment?: string) => string | undefined;
//# sourceMappingURL=feature-flags.d.ts.map
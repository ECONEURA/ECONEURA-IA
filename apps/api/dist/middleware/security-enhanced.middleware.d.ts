import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
export declare const enhancedCorsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const enhancedHelmetMiddleware: any;
export declare const additionalSecurityHeadersMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeadersValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLoggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const attackProtectionMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipBasedRateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const httpMethodValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const contentTypeValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const headerCleanupMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsPreflightValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMonitoringMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityConfig: {
    cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
        preflightContinue: boolean;
        optionsSuccessStatus: number;
    };
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                scriptSrc: string[];
                styleSrc: string[];
                fontSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                mediaSrc: string[];
                objectSrc: string[];
                baseUri: string[];
                formAction: string[];
                frameAncestors: string[];
                upgradeInsecureRequests: any[];
            };
            reportOnly: boolean;
        };
        crossOriginEmbedderPolicy: boolean;
        crossOriginOpenerPolicy: {
            policy: string;
        };
        crossOriginResourcePolicy: {
            policy: string;
        };
        dnsPrefetchControl: {
            allow: boolean;
        };
        frameguard: {
            action: string;
        };
        hidePoweredBy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        ieNoOpen: boolean;
        noSniff: boolean;
        originAgentCluster: boolean;
        permittedCrossDomainPolicies: boolean;
        referrerPolicy: {
            policy: string;
        };
        xssFilter: boolean;
    };
};
//# sourceMappingURL=security-enhanced.middleware.d.ts.map
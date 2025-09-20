import { Request, Response, NextFunction } from 'express';
export declare const rateLimitMiddleware: (maxRequests?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const jwtAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const csrfMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeadersMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const ipFilterMiddleware: (whitelist?: string[], blacklist?: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requestSizeLimiter: (maxSize?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const suspiciousActivityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const generateCSRFToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const organizationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityLoggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.d.ts.map
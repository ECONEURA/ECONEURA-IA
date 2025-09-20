import helmet from 'helmet';
import cors from 'cors';
import { structuredLogger } from '../lib/structured-logger.js';
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'https://econeura.com',
            'https://www.econeura.com',
            'https://app.econeura.com',
            'https://staging.econeura.com',
            'https://dev.econeura.com'
        ];
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        structuredLogger.warn('CORS: Origin not allowed', {
            origin,
            allowedOrigins,
            timestamp: new Date().toISOString()
        });
        callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Org-ID',
        'X-User-ID',
        'X-Correlation-ID',
        'X-Tenant-ID',
        'X-User-Role',
        'X-Permissions',
        'X-Session-ID',
        'X-Request-ID',
        'X-CSRF-Token',
        'X-API-Key',
        'X-Client-Version',
        'X-Client-Platform',
        'Accept',
        'Accept-Language',
        'Accept-Encoding',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: [
        'X-System-Mode',
        'X-Est-Cost-EUR',
        'X-Budget-Pct',
        'X-Latency-ms',
        'X-Route',
        'X-RLS-Policies-Applied',
        'X-RLS-Rules-Evaluated',
        'X-RLS-Execution-Time',
        'X-RLS-Tenant-Isolation',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Cache-Status',
        'X-Response-Time',
        'X-Request-ID'
    ],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
};
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ],
            connectSrc: [
                "'self'",
                "https:",
                "wss:",
                "ws:"
            ],
            mediaSrc: [
                "'self'",
                "data:",
                "blob:"
            ],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: []
        },
        reportOnly: false
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
};
export const enhancedCorsMiddleware = cors(corsOptions);
export const enhancedHelmetMiddleware = helmet(helmetOptions);
export const additionalSecurityHeadersMiddleware = (req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    res.set({
        'X-API-Version': '1.0.0',
        'X-API-Environment': process.env.NODE_ENV || 'development',
        'X-Response-Time': Date.now().toString()
    });
    next();
};
export const securityHeadersValidationMiddleware = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
        const contentType = req.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
            structuredLogger.warn('Security: Invalid content type', {
                contentType,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
        }
    }
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
        structuredLogger.warn('Security: Suspicious user agent', {
            userAgent,
            path: req.path,
            ip: req.ip
        });
    }
    next();
};
export const securityLoggingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    structuredLogger.info('Security: Request received', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
        timestamp: new Date().toISOString()
    });
    const originalSend = res.send;
    res.send = function (data) {
        const responseTime = Date.now() - startTime;
        structuredLogger.info('Security: Response sent', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        });
        return originalSend.call(this, data);
    };
    next();
};
export const attackProtectionMiddleware = (req, res, next) => {
    if (req.path.includes('..') || req.path.includes('~')) {
        structuredLogger.warn('Security: Path traversal attempt', {
            path: req.path,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        return res.status(400).json({
            success: false,
            error: 'Invalid path',
            code: 'PATH_TRAVERSAL_DETECTED'
        });
    }
    const suspiciousPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /script\s*>/i,
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
    ];
    const queryString = JSON.stringify(req.query);
    const bodyString = JSON.stringify(req.body);
    const pathString = req.path;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(queryString) || pattern.test(bodyString) || pattern.test(pathString)) {
            structuredLogger.warn('Security: Suspicious pattern detected', {
                pattern: pattern.toString(),
                path: req.path,
                query: req.query,
                body: req.body,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).json({
                success: false,
                error: 'Suspicious request detected',
                code: 'SUSPICIOUS_PATTERN_DETECTED'
            });
        }
    }
    next();
};
export const ipBasedRateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || 'unknown';
    const key = `rate_limit:${ip}`;
    const rateLimitStore = new Map();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;
    const current = rateLimitStore.get(key);
    if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return next();
    }
    if (current.count >= maxRequests) {
        structuredLogger.warn('Security: Rate limit exceeded', {
            ip,
            count: current.count,
            maxRequests,
            resetTime: new Date(current.resetTime).toISOString()
        });
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
    }
    current.count++;
    next();
};
export const requestSizeValidationMiddleware = (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 10 * 1024 * 1024;
    if (contentLength > maxSize) {
        structuredLogger.warn('Security: Request too large', {
            contentLength,
            maxSize,
            path: req.path,
            ip: req.ip
        });
        return res.status(413).json({
            success: false,
            error: 'Request too large',
            code: 'REQUEST_TOO_LARGE',
            maxSize
        });
    }
    next();
};
export const httpMethodValidationMiddleware = (req, res, next) => {
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    if (!allowedMethods.includes(req.method)) {
        structuredLogger.warn('Security: Invalid HTTP method', {
            method: req.method,
            path: req.path,
            ip: req.ip
        });
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
            allowedMethods
        });
    }
    next();
};
export const contentTypeValidationMiddleware = (req, res, next) => {
    const contentType = req.headers['content-type'];
    const allowedTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
    ];
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-length'] !== '0') {
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
            structuredLogger.warn('Security: Invalid content type', {
                contentType,
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            return res.status(400).json({
                success: false,
                error: 'Invalid content type',
                code: 'INVALID_CONTENT_TYPE',
                allowedTypes
            });
        }
    }
    next();
};
export const headerCleanupMiddleware = (req, res, next) => {
    const sensitiveHeaders = ['authorization', 'x-api-key', 'x-csrf-token'];
    const cleanHeaders = { ...req.headers };
    sensitiveHeaders.forEach(header => {
        if (cleanHeaders[header]) {
            cleanHeaders[header] = '[REDACTED]';
        }
    });
    req.cleanHeaders = cleanHeaders;
    next();
};
export const corsPreflightValidationMiddleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        const method = req.headers['access-control-request-method'];
        const headers = req.headers['access-control-request-headers'];
        structuredLogger.info('Security: CORS preflight request', {
            origin,
            method,
            headers,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
        if (method && !allowedMethods.includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid CORS method',
                code: 'INVALID_CORS_METHOD'
            });
        }
    }
    next();
};
export const securityMonitoringMiddleware = (req, res, next) => {
    const securityMetrics = {
        totalRequests: 0,
        blockedRequests: 0,
        suspiciousRequests: 0,
        corsRequests: 0,
        rateLimitedRequests: 0
    };
    securityMetrics.totalRequests++;
    if (req.headers.origin) {
        securityMetrics.corsRequests++;
    }
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode === 403) {
            securityMetrics.blockedRequests++;
        }
        else if (res.statusCode === 400) {
            securityMetrics.suspiciousRequests++;
        }
        else if (res.statusCode === 429) {
            securityMetrics.rateLimitedRequests++;
        }
        if (securityMetrics.totalRequests % 100 === 0) {
            structuredLogger.info('Security: Metrics update', {
                ...securityMetrics,
                timestamp: new Date().toISOString()
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
export const securityConfig = {
    cors: corsOptions,
    helmet: helmetOptions
};
//# sourceMappingURL=security-enhanced.middleware.js.map
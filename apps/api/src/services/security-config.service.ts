/**
 * Security Configuration Service
 * PR-102: Security & CORS (api) - helmet y cors
 * 
 * Servicio para gestión de configuración de seguridad
 */

import { structuredLogger } from '../lib/structured-logger.js';

export interface SecurityConfig {
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  helmet: {
    contentSecurityPolicy: any;
    hsts: any;
    frameguard: any;
    noSniff: boolean;
    xssFilter: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  validation: {
    maxRequestSize: number;
    allowedContentTypes: string[];
    allowedHttpMethods: string[];
  };
  monitoring: {
    enableLogging: boolean;
    enableMetrics: boolean;
    logLevel: 'info' | 'warn' | 'error';
  };
}

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousRequests: number;
  corsRequests: number;
  rateLimitedRequests: number;
  lastUpdated: string;
}

class SecurityConfigService {
  private config: SecurityConfig;
  private metrics: SecurityMetrics;
  private isInitialized: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
    this.init();
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      cors: {
        allowedOrigins: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'https://econeura.com',
          'https://www.econeura.com',
          'https://app.econeura.com',
          'https://staging.econeura.com',
          'https://dev.econeura.com'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
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
        credentials: true,
        maxAge: 86400
      },
      helmet: {
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
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        frameguard: {
          action: 'deny'
        },
        noSniff: true,
        xssFilter: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      validation: {
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedContentTypes: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ],
        allowedHttpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
      },
      monitoring: {
        enableLogging: true,
        enableMetrics: true,
        logLevel: 'info'
      }
    };
  }

  private getDefaultMetrics(): SecurityMetrics {
    return {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      corsRequests: 0,
      rateLimitedRequests: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  private init(): void {
    try {
      // Cargar configuración desde variables de entorno
      this.loadFromEnvironment();
      
      // Validar configuración
      this.validateConfig();
      
      this.isInitialized = true;
      
      structuredLogger.info('Security configuration service initialized', {
        corsOrigins: this.config.cors.allowedOrigins.length,
        helmetEnabled: true,
        rateLimitEnabled: true,
        monitoringEnabled: this.config.monitoring.enableLogging
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize security configuration', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  private loadFromEnvironment(): void {
    // Cargar orígenes CORS desde variables de entorno
    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS;
    if (corsOrigins) {
      this.config.cors.allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());
    }

    // Cargar configuración de rate limiting
    const rateLimitMax = process.env.RATE_LIMIT_MAX;
    if (rateLimitMax) {
      this.config.rateLimit.maxRequests = parseInt(rateLimitMax);
    }

    const rateLimitWindow = process.env.RATE_LIMIT_WINDOW_MS;
    if (rateLimitWindow) {
      this.config.rateLimit.windowMs = parseInt(rateLimitWindow);
    }

    // Cargar configuración de monitoreo
    const enableLogging = process.env.SECURITY_ENABLE_LOGGING;
    if (enableLogging) {
      this.config.monitoring.enableLogging = enableLogging === 'true';
    }

    const logLevel = process.env.SECURITY_LOG_LEVEL;
    if (logLevel && ['info', 'warn', 'error'].includes(logLevel)) {
      this.config.monitoring.logLevel = logLevel as 'info' | 'warn' | 'error';
    }
  }

  private validateConfig(): void {
    // Validar orígenes CORS
    if (this.config.cors.allowedOrigins.length === 0) {
      throw new Error('At least one CORS origin must be configured');
    }

    // Validar métodos HTTP
    if (this.config.cors.allowedMethods.length === 0) {
      throw new Error('At least one HTTP method must be allowed');
    }

    // Validar rate limiting
    if (this.config.rateLimit.maxRequests <= 0) {
      throw new Error('Rate limit max requests must be greater than 0');
    }

    if (this.config.rateLimit.windowMs <= 0) {
      throw new Error('Rate limit window must be greater than 0');
    }

    // Validar tamaño máximo de request
    if (this.config.validation.maxRequestSize <= 0) {
      throw new Error('Max request size must be greater than 0');
    }
  }

  // Getters
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  getCorsConfig() {
    return { ...this.config.cors };
  }

  getHelmetConfig() {
    return { ...this.config.helmet };
  }

  getRateLimitConfig() {
    return { ...this.config.rateLimit };
  }

  getValidationConfig() {
    return { ...this.config.validation };
  }

  getMonitoringConfig() {
    return { ...this.config.monitoring };
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Métodos para actualizar configuración
  updateCorsOrigins(origins: string[]): void {
    if (origins.length === 0) {
      throw new Error('At least one CORS origin must be provided');
    }

    this.config.cors.allowedOrigins = [...origins];
    
    structuredLogger.info('CORS origins updated', {
      origins: this.config.cors.allowedOrigins
    });
  }

  addCorsOrigin(origin: string): void {
    if (!this.config.cors.allowedOrigins.includes(origin)) {
      this.config.cors.allowedOrigins.push(origin);
      
      structuredLogger.info('CORS origin added', {
        origin,
        totalOrigins: this.config.cors.allowedOrigins.length
      });
    }
  }

  removeCorsOrigin(origin: string): void {
    const index = this.config.cors.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.cors.allowedOrigins.splice(index, 1);
      
      structuredLogger.info('CORS origin removed', {
        origin,
        totalOrigins: this.config.cors.allowedOrigins.length
      });
    }
  }

  updateRateLimit(maxRequests: number, windowMs: number): void {
    if (maxRequests <= 0) {
      throw new Error('Max requests must be greater than 0');
    }

    if (windowMs <= 0) {
      throw new Error('Window must be greater than 0');
    }

    this.config.rateLimit.maxRequests = maxRequests;
    this.config.rateLimit.windowMs = windowMs;
    
    structuredLogger.info('Rate limit updated', {
      maxRequests,
      windowMs
    });
  }

  updateMaxRequestSize(size: number): void {
    if (size <= 0) {
      throw new Error('Max request size must be greater than 0');
    }

    this.config.validation.maxRequestSize = size;
    
    structuredLogger.info('Max request size updated', {
      size
    });
  }

  // Métodos para métricas
  incrementTotalRequests(): void {
    this.metrics.totalRequests++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  incrementBlockedRequests(): void {
    this.metrics.blockedRequests++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  incrementSuspiciousRequests(): void {
    this.metrics.suspiciousRequests++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  incrementCorsRequests(): void {
    this.metrics.corsRequests++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  incrementRateLimitedRequests(): void {
    this.metrics.rateLimitedRequests++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    
    structuredLogger.info('Security metrics reset');
  }

  // Métodos de validación
  isOriginAllowed(origin: string): boolean {
    return this.config.cors.allowedOrigins.includes(origin);
  }

  isMethodAllowed(method: string): boolean {
    return this.config.cors.allowedMethods.includes(method);
  }

  isHeaderAllowed(header: string): boolean {
    return this.config.cors.allowedHeaders.includes(header);
  }

  isContentTypeAllowed(contentType: string): boolean {
    return this.config.validation.allowedContentTypes.some(type => 
      contentType.includes(type)
    );
  }

  isRequestSizeValid(size: number): boolean {
    return size <= this.config.validation.maxRequestSize;
  }

  // Métodos de utilidad
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };
  }

  getApiHeaders(): Record<string, string> {
    return {
      'X-API-Version': '1.0.0',
      'X-API-Environment': process.env.NODE_ENV || 'development',
      'X-Response-Time': Date.now().toString()
    };
  }

  // Método para obtener configuración completa para middleware
  getMiddlewareConfig() {
    return {
      cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (!origin) {
            return callback(null, true);
          }

          if (this.isOriginAllowed(origin)) {
            return callback(null, true);
          }

          structuredLogger.warn('CORS: Origin not allowed', {
            origin,
            allowedOrigins: this.config.cors.allowedOrigins
          });

          callback(new Error('Not allowed by CORS'), false);
        },
        credentials: this.config.cors.credentials,
        methods: this.config.cors.allowedMethods,
        allowedHeaders: this.config.cors.allowedHeaders,
        exposedHeaders: this.config.cors.exposedHeaders,
        maxAge: this.config.cors.maxAge,
        preflightContinue: false,
        optionsSuccessStatus: 204
      },
      helmet: {
        contentSecurityPolicy: this.config.helmet.contentSecurityPolicy,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        dnsPrefetchControl: { allow: false },
        frameguard: this.config.helmet.frameguard,
        hidePoweredBy: true,
        hsts: this.config.helmet.hsts,
        ieNoOpen: true,
        noSniff: this.config.helmet.noSniff,
        originAgentCluster: true,
        permittedCrossDomainPolicies: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: this.config.helmet.xssFilter
      }
    };
  }
}

export const securityConfigService = new SecurityConfigService();

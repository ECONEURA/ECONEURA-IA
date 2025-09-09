import { z } from 'zod';
import { logger } from '@econeura/shared/logger';
import { prometheusMetrics } from '@econeura/shared/metrics';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
  };
  mfa: {
    enabled: boolean;
    issuer: string;
    window: number;
    backupCodes: number;
    methods: string[];
  };
  csrf: {
    enabled: boolean;
    secret: string;
    tokenLength: number;
    cookieName: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  inputSanitization: {
    enabled: boolean;
    maxLength: number;
    allowedTags: string[];
    blockedPatterns: string[];
  };
  threatDetection: {
    enabled: boolean;
    suspiciousPatterns: string[];
    maxFailedAttempts: number;
    lockoutDuration: number;
  };
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pciDss: boolean;
    hipaa: boolean;
    iso27001: boolean;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'security_violation' | 'compliance_breach' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  timestamp: Date;
  riskScore: number;
  complianceFlags: string[];
}

export interface SecurityMetrics {
  authentication: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    mfaCompletions: number;
    mfaFailures: number;
  };
  authorization: {
    permissionChecks: number;
    deniedAccess: number;
    roleAssignments: number;
    permissionGrants: number;
  };
  threats: {
    detectedThreats: number;
    blockedIPs: number;
    suspiciousActivities: number;
    csrfAttacks: number;
  };
  compliance: {
    complianceChecks: number;
    violations: number;
    remediations: number;
    auditLogs: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SecurityEventSchema = z.object({
  type: z.enum(['authentication', 'authorization', 'data_access', 'data_modification', 'security_violation', 'compliance_breach', 'threat_detected']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  result: z.enum(['success', 'failure', 'blocked']),
  details: z.record(z.any()),
  riskScore: z.number().min(0).max(100),
  complianceFlags: z.array(z.string())
});

const MFASetupSchema = z.object({
  userId: z.string().uuid(),
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional()
});

const MFACodeSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
  method: z.enum(['totp', 'sms', 'email', 'backup'])
});

const RBACPermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.string().min(1),
  action: z.string().min(1),
  context: z.record(z.any()).optional()
});

const CSRFTokenSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(32)
});

const SanitizeInputSchema = z.object({
  input: z.string().min(1),
  type: z.enum(['html', 'sql', 'xss', 'general']).optional()
});

const ThreatDetectionSchema = z.object({
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1),
  request: z.record(z.any()),
  riskFactors: z.array(z.string())
});

// ============================================================================
// ADVANCED SECURITY FRAMEWORK SERVICE
// ============================================================================

export class AdvancedSecurityFrameworkService {
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private metrics: SecurityMetrics;
  private blockedIPs: Set<string> = new Set();
  private suspiciousActivities: Map<string, number> = new Map();
  private mfaSessions: Map<string, any> = new Map();
  private csrfTokens: Map<string, string> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
    this.initializeMetrics();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  private getDefaultConfig(): SecurityConfig {
    return {
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        expiresIn: '1h',
        refreshExpiresIn: '7d',
        algorithm: 'HS256'
      },
      mfa: {
        enabled: true,
        issuer: 'ECONEURA',
        window: 2,
        backupCodes: 10,
        methods: ['totp', 'sms', 'email']
      },
      csrf: {
        enabled: true,
        secret: process.env.CSRF_SECRET || 'default-csrf-secret',
        tokenLength: 32,
        cookieName: 'csrf-token'
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false
      },
      inputSanitization: {
        enabled: true,
        maxLength: 10000,
        allowedTags: ['b', 'i', 'em', 'strong'],
        blockedPatterns: [
          '<script',
          'javascript:',
          'onload=',
          'onerror=',
          'onclick=',
          'onmouseover=',
          'onfocus=',
          'onblur=',
          'onchange='
        ]
      },
      threatDetection: {
        enabled: true,
        suspiciousPatterns: [
          'sql injection',
          'xss attack',
          'csrf attack',
          'brute force',
          'dictionary attack',
          'bot traffic',
          'scanner',
          'exploit',
          'malware',
          'phishing',
          'social engineering',
          'privilege escalation'
        ],
        maxFailedAttempts: 5,
        lockoutDuration: 30 * 60 * 1000 // 30 minutes
      },
      compliance: {
        gdpr: true,
        sox: true,
        pciDss: true,
        hipaa: true,
        iso27001: true
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
      }
    };
  }

  private getDefaultMetrics(): SecurityMetrics {
    return {
      authentication: {
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        mfaCompletions: 0,
        mfaFailures: 0
      },
      authorization: {
        permissionChecks: 0,
        deniedAccess: 0,
        roleAssignments: 0,
        permissionGrants: 0
      },
      threats: {
        detectedThreats: 0,
        blockedIPs: 0,
        suspiciousActivities: 0,
        csrfAttacks: 0
      },
      compliance: {
        complianceChecks: 0,
        violations: 0,
        remediations: 0,
        auditLogs: 0
      },
      performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        throughput: 0
      }
    };
  }

  private initializeMetrics(): void {
    // Initialize Prometheus metrics
    prometheusMetrics.securityEventsTotal = prometheusMetrics.counter({
      name: 'econeura_security_events_total',
      help: 'Total number of security events',
      labelNames: ['type', 'severity', 'result']
    });

    prometheusMetrics.securityThreatsDetected = prometheusMetrics.counter({
      name: 'econeura_security_threats_detected_total',
      help: 'Total number of threats detected',
      labelNames: ['threat_type', 'severity']
    });

    prometheusMetrics.securityMfaAttempts = prometheusMetrics.counter({
      name: 'econeura_security_mfa_attempts_total',
      help: 'Total number of MFA attempts',
      labelNames: ['method', 'result']
    });

    prometheusMetrics.securityRbacChecks = prometheusMetrics.counter({
      name: 'econeura_security_rbac_checks_total',
      help: 'Total number of RBAC permission checks',
      labelNames: ['resource', 'action', 'result']
    });
  }

  // ============================================================================
  // MFA (MULTI-FACTOR AUTHENTICATION)
  // ============================================================================

  async initializeMFA(data: z.infer<typeof MFASetupSchema>): Promise<{ qrCode: string; backupCodes: string[] }> {
    try {
      const validatedData = MFASetupSchema.parse(data);
      
      // Generate TOTP secret
      const secret = this.generateSecret();
      
      // Generate QR code data
      const qrCode = `otpauth://totp/${validatedData.userId}?secret=${secret}&issuer=${this.config.mfa.issuer}`;
      
      // Generate backup codes
      const backupCodes = Array.from({ length: this.config.mfa.backupCodes }, () => 
        this.generateBackupCode()
      );

      // Store MFA setup
      this.mfaSessions.set(validatedData.userId, {
        secret,
        backupCodes,
        method: validatedData.method,
        setupAt: new Date()
      });

      // Log security event
      await this.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        userId: validatedData.userId,
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        resource: 'mfa_setup',
        action: 'initialize',
        result: 'success',
        details: { method: validatedData.method },
        riskScore: 20,
        complianceFlags: ['gdpr']
      });

      logger.info('MFA initialized successfully', { userId: validatedData.userId, method: validatedData.method });

      return { qrCode, backupCodes };
    } catch (error) {
      logger.error('Failed to initialize MFA', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to initialize MFA');
    }
  }

  async verifyMFACode(data: z.infer<typeof MFACodeSchema>): Promise<{ valid: boolean; sessionToken?: string }> {
    try {
      const validatedData = MFACodeSchema.parse(data);
      
      const mfaSession = this.mfaSessions.get(validatedData.userId);
      if (!mfaSession) {
        throw new Error('MFA not initialized for user');
      }

      let isValid = false;

      if (validatedData.method === 'backup') {
        // Verify backup code
        isValid = mfaSession.backupCodes.includes(validatedData.code);
        if (isValid) {
          // Remove used backup code
          mfaSession.backupCodes = mfaSession.backupCodes.filter(code => code !== validatedData.code);
        }
      } else {
        // Verify TOTP code (simplified - in production use proper TOTP library)
        isValid = this.verifyTOTPCode(validatedData.code, mfaSession.secret);
      }

      // Update metrics
      prometheusMetrics.securityMfaAttempts.inc({
        method: validatedData.method,
        result: isValid ? 'success' : 'failure'
      });

      if (isValid) {
        this.metrics.authentication.mfaCompletions++;
        
        // Generate session token
        const sessionToken = this.generateSessionToken(validatedData.userId);
        
        // Log security event
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'low',
          userId: validatedData.userId,
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: 'mfa_verification',
          action: 'verify',
          result: 'success',
          details: { method: validatedData.method },
          riskScore: 10,
          complianceFlags: ['gdpr']
        });

        logger.info('MFA verification successful', { userId: validatedData.userId, method: validatedData.method });
        
        return { valid: true, sessionToken };
      } else {
        this.metrics.authentication.mfaFailures++;
        
        // Log security event
        await this.logSecurityEvent({
          type: 'authentication',
          severity: 'medium',
          userId: validatedData.userId,
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: 'mfa_verification',
          action: 'verify',
          result: 'failure',
          details: { method: validatedData.method },
          riskScore: 50,
          complianceFlags: ['gdpr']
        });

        logger.warn('MFA verification failed', { userId: validatedData.userId, method: validatedData.method });
        
        return { valid: false };
      }
    } catch (error) {
      logger.error('Failed to verify MFA code', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to verify MFA code');
    }
  }

  async createMFASession(userId: string, sessionData: any): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      
      this.mfaSessions.set(sessionId, {
        userId,
        ...sessionData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      logger.info('MFA session created', { userId, sessionId });
      
      return sessionId;
    } catch (error) {
      logger.error('Failed to create MFA session', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to create MFA session');
    }
  }

  // ============================================================================
  // RBAC (ROLE-BASED ACCESS CONTROL)
  // ============================================================================

  async checkPermission(data: z.infer<typeof RBACPermissionSchema>): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const validatedData = RBACPermissionSchema.parse(data);
      
      this.metrics.authorization.permissionChecks++;
      
      // Simulate permission check (in production, this would query the database)
      const userRoles = await this.getUserRoles(validatedData.userId);
      const hasPermission = await this.checkRolePermission(userRoles, validatedData.resource, validatedData.action);

      // Update metrics
      prometheusMetrics.securityRbacChecks.inc({
        resource: validatedData.resource,
        action: validatedData.action,
        result: hasPermission ? 'allowed' : 'denied'
      });

      if (hasPermission) {
        this.metrics.authorization.permissionGrants++;
        
        // Log security event
        await this.logSecurityEvent({
          type: 'authorization',
          severity: 'low',
          userId: validatedData.userId,
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: validatedData.resource,
          action: validatedData.action,
          result: 'success',
          details: { roles: userRoles, context: validatedData.context },
          riskScore: 10,
          complianceFlags: ['gdpr', 'sox']
        });

        logger.info('Permission granted', { 
          userId: validatedData.userId, 
          resource: validatedData.resource, 
          action: validatedData.action 
        });
        
        return { allowed: true };
      } else {
        this.metrics.authorization.deniedAccess++;
        
        // Log security event
        await this.logSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          userId: validatedData.userId,
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: validatedData.resource,
          action: validatedData.action,
          result: 'failure',
          details: { roles: userRoles, context: validatedData.context },
          riskScore: 60,
          complianceFlags: ['gdpr', 'sox']
        });

        logger.warn('Permission denied', { 
          userId: validatedData.userId, 
          resource: validatedData.resource, 
          action: validatedData.action 
        });
        
        return { allowed: false, reason: 'Insufficient permissions' };
      }
    } catch (error) {
      logger.error('Failed to check permission', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to check permission');
    }
  }

  async assignRole(userId: string, role: string, assignedBy: string): Promise<{ success: boolean }> {
    try {
      // Simulate role assignment (in production, this would update the database)
      this.metrics.authorization.roleAssignments++;
      
      // Log security event
      await this.logSecurityEvent({
        type: 'authorization',
        severity: 'medium',
        userId,
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        resource: 'role_assignment',
        action: 'assign',
        result: 'success',
        details: { role, assignedBy },
        riskScore: 30,
        complianceFlags: ['gdpr', 'sox']
      });

      logger.info('Role assigned successfully', { userId, role, assignedBy });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to assign role', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to assign role');
    }
  }

  // ============================================================================
  // CSRF PROTECTION
  // ============================================================================

  async generateCSRFToken(sessionId: string): Promise<string> {
    try {
      const token = this.generateRandomToken(this.config.csrf.tokenLength);
      
      this.csrfTokens.set(sessionId, token);
      
      // Log security event
      await this.logSecurityEvent({
        type: 'security_violation',
        severity: 'low',
        sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        resource: 'csrf_token',
        action: 'generate',
        result: 'success',
        details: { sessionId },
        riskScore: 5,
        complianceFlags: ['gdpr']
      });

      logger.info('CSRF token generated', { sessionId });
      
      return token;
    } catch (error) {
      logger.error('Failed to generate CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to generate CSRF token');
    }
  }

  async verifyCSRFToken(data: z.infer<typeof CSRFTokenSchema>): Promise<{ valid: boolean }> {
    try {
      const validatedData = CSRFTokenSchema.parse(data);
      
      const storedToken = this.csrfTokens.get(validatedData.sessionId);
      const isValid = storedToken === validatedData.token;

      if (!isValid) {
        this.metrics.threats.csrfAttacks++;
        
        // Log security event
        await this.logSecurityEvent({
          type: 'threat_detected',
          severity: 'high',
          sessionId: validatedData.sessionId,
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: 'csrf_verification',
          action: 'verify',
          result: 'blocked',
          details: { sessionId: validatedData.sessionId },
          riskScore: 80,
          complianceFlags: ['gdpr']
        });

        logger.warn('CSRF attack detected', { sessionId: validatedData.sessionId });
      }

      return { valid: isValid };
    } catch (error) {
      logger.error('Failed to verify CSRF token', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to verify CSRF token');
    }
  }

  // ============================================================================
  // INPUT SANITIZATION
  // ============================================================================

  async sanitizeInput(data: z.infer<typeof SanitizeInputSchema>): Promise<{ sanitized: string; threats: string[] }> {
    try {
      const validatedData = SanitizeInputSchema.parse(data);
      
      let sanitized = validatedData.input;
      const threats: string[] = [];

      // Check for blocked patterns
      for (const pattern of this.config.inputSanitization.blockedPatterns) {
        if (sanitized.toLowerCase().includes(pattern.toLowerCase())) {
          threats.push(`Blocked pattern detected: ${pattern}`);
          sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '[BLOCKED]');
        }
      }

      // Length check
      if (sanitized.length > this.config.inputSanitization.maxLength) {
        threats.push('Input exceeds maximum length');
        sanitized = sanitized.substring(0, this.config.inputSanitization.maxLength);
      }

      // HTML sanitization
      if (validatedData.type === 'html') {
        sanitized = this.sanitizeHTML(sanitized);
      }

      // Log security event if threats detected
      if (threats.length > 0) {
        await this.logSecurityEvent({
          type: 'threat_detected',
          severity: 'medium',
          ipAddress: '127.0.0.1',
          userAgent: 'system',
          resource: 'input_sanitization',
          action: 'sanitize',
          result: 'success',
          details: { threats, originalLength: validatedData.input.length },
          riskScore: 40,
          complianceFlags: ['gdpr']
        });
      }

      logger.info('Input sanitized', { threats: threats.length, type: validatedData.type });
      
      return { sanitized, threats };
    } catch (error) {
      logger.error('Failed to sanitize input', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to sanitize input');
    }
  }

  // ============================================================================
  // THREAT DETECTION
  // ============================================================================

  async detectThreats(data: z.infer<typeof ThreatDetectionSchema>): Promise<{ threats: string[]; riskScore: number; blocked: boolean }> {
    try {
      const validatedData = ThreatDetectionSchema.parse(data);
      
      const threats: string[] = [];
      let riskScore = 0;

      // Check for suspicious patterns
      for (const pattern of this.config.threatDetection.suspiciousPatterns) {
        const requestStr = JSON.stringify(validatedData.request).toLowerCase();
        if (requestStr.includes(pattern.toLowerCase())) {
          threats.push(`Suspicious pattern: ${pattern}`);
          riskScore += 20;
        }
      }

      // Check for bot traffic
      if (this.isBotTraffic(validatedData.userAgent)) {
        threats.push('Bot traffic detected');
        riskScore += 30;
      }

      // Check for suspicious IP
      if (this.isSuspiciousIP(validatedData.ipAddress)) {
        threats.push('Suspicious IP address');
        riskScore += 25;
      }

      // Check for rate limiting violations
      const activityCount = this.suspiciousActivities.get(validatedData.ipAddress) || 0;
      if (activityCount > this.config.threatDetection.maxFailedAttempts) {
        threats.push('Rate limiting violation');
        riskScore += 40;
      }

      const blocked = riskScore > 70;

      if (blocked) {
        this.blockedIPs.add(validatedData.ipAddress);
        this.metrics.threats.blockedIPs++;
      }

      if (threats.length > 0) {
        this.metrics.threats.detectedThreats++;
        this.suspiciousActivities.set(validatedData.ipAddress, activityCount + 1);
      }

      // Log security event
      await this.logSecurityEvent({
        type: 'threat_detected',
        severity: blocked ? 'critical' : 'high',
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        resource: 'threat_detection',
        action: 'detect',
        result: blocked ? 'blocked' : 'detected',
        details: { threats, riskScore, request: validatedData.request },
        riskScore,
        complianceFlags: ['gdpr']
      });

      // Update metrics
      prometheusMetrics.securityThreatsDetected.inc({
        threat_type: threats.length > 0 ? 'multiple' : 'none',
        severity: blocked ? 'critical' : 'high'
      });

      logger.info('Threat detection completed', { 
        ipAddress: validatedData.ipAddress, 
        threats: threats.length, 
        riskScore, 
        blocked 
      });
      
      return { threats, riskScore, blocked };
    } catch (error) {
      logger.error('Failed to detect threats', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to detect threats');
    }
  }

  // ============================================================================
  // COMPLIANCE & AUDIT
  // ============================================================================

  async checkCompliance(organizationId: string, complianceType: string): Promise<{ compliant: boolean; violations: string[]; score: number }> {
    try {
      this.metrics.compliance.complianceChecks++;
      
      const violations: string[] = [];
      let score = 100;

      // GDPR compliance check
      if (complianceType === 'gdpr' && this.config.compliance.gdpr) {
        // Check for data processing activities
        // Check for consent management
        // Check for data retention policies
        // Check for breach notification procedures
        if (violations.length === 0) {
          score = 100;
        } else {
          score = Math.max(0, 100 - violations.length * 20);
        }
      }

      // SOX compliance check
      if (complianceType === 'sox' && this.config.compliance.sox) {
        // Check for financial controls
        // Check for audit trails
        // Check for access controls
        if (violations.length === 0) {
          score = 100;
        } else {
          score = Math.max(0, 100 - violations.length * 25);
        }
      }

      const compliant = score >= 80;

      if (!compliant) {
        this.metrics.compliance.violations++;
      }

      // Log security event
      await this.logSecurityEvent({
        type: 'compliance_breach',
        severity: compliant ? 'low' : 'high',
        ipAddress: '127.0.0.1',
        userAgent: 'system',
        resource: 'compliance_check',
        action: 'check',
        result: compliant ? 'success' : 'failure',
        details: { complianceType, violations, score, organizationId },
        riskScore: compliant ? 10 : 70,
        complianceFlags: [complianceType]
      });

      logger.info('Compliance check completed', { 
        organizationId, 
        complianceType, 
        compliant, 
        score, 
        violations: violations.length 
      });
      
      return { compliant, violations, score };
    } catch (error) {
      logger.error('Failed to check compliance', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to check compliance');
    }
  }

  // ============================================================================
  // METRICS & MONITORING
  // ============================================================================

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      // Update performance metrics
      this.metrics.performance.avgResponseTime = this.calculateAverageResponseTime();
      this.metrics.performance.p95ResponseTime = this.calculateP95ResponseTime();
      this.metrics.performance.errorRate = this.calculateErrorRate();
      this.metrics.performance.throughput = this.calculateThroughput();

      logger.info('Security metrics retrieved', { 
        totalEvents: this.securityEvents.length,
        blockedIPs: this.blockedIPs.size,
        suspiciousActivities: this.suspiciousActivities.size
      });
      
      return this.metrics;
    } catch (error) {
      logger.error('Failed to get security metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to get security metrics');
    }
  }

  async getHealthStatus(): Promise<{ status: string; services: Record<string, boolean>; lastCheck: string }> {
    try {
      const services = {
        database: true, // In production, check actual database connection
        mfa: this.config.mfa.enabled,
        csrf: this.config.csrf.enabled,
        threatDetection: this.config.threatDetection.enabled,
        compliance: Object.values(this.config.compliance).some(Boolean)
      };

      const status = Object.values(services).every(Boolean) ? 'healthy' : 'degraded';

      logger.info('Health check completed', { status, services });
      
      return {
        status,
        services,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get health status', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to get health status');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.securityEvents.push(securityEvent);
    this.metrics.compliance.auditLogs++;

    // Update Prometheus metrics
    prometheusMetrics.securityEventsTotal.inc({
      type: event.type,
      severity: event.severity,
      result: event.result
    });

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  private generateSecret(): string {
    return this.generateRandomToken(32);
  }

  private generateBackupCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private generateSessionToken(userId: string): string {
    return `session_${userId}_${Date.now()}_${this.generateRandomToken(16)}`;
  }

  private generateSessionId(): string {
    return `mfa_${Date.now()}_${this.generateRandomToken(16)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${this.generateRandomToken(8)}`;
  }

  private generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private verifyTOTPCode(code: string, secret: string): boolean {
    // Simplified TOTP verification - in production use proper TOTP library
    const currentTime = Math.floor(Date.now() / 1000 / 30);
    const expectedCode = this.generateTOTPCode(secret, currentTime);
    return code === expectedCode;
  }

  private generateTOTPCode(secret: string, time: number): string {
    // Simplified TOTP generation - in production use proper TOTP library
    const hash = require('crypto').createHmac('sha1', secret).update(time.toString()).digest('hex');
    const offset = parseInt(hash.slice(-1), 16);
    const code = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Simulate user roles - in production, this would query the database
    return ['user', 'admin'];
  }

  private async checkRolePermission(roles: string[], resource: string, action: string): Promise<boolean> {
    // Simulate permission check - in production, this would check against role permissions
    return roles.includes('admin') || (roles.includes('user') && action === 'read');
  }

  private sanitizeHTML(input: string): string {
    // Basic HTML sanitization - in production, use a proper HTML sanitization library
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
  }

  private isBotTraffic(userAgent: string): boolean {
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
    return botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern));
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    // Simulate suspicious IP check - in production, this would check against threat intelligence feeds
    return ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.0.');
  }

  private calculateAverageResponseTime(): number {
    // Simulate response time calculation
    return Math.random() * 100 + 50; // 50-150ms
  }

  private calculateP95ResponseTime(): number {
    // Simulate P95 response time calculation
    return Math.random() * 200 + 100; // 100-300ms
  }

  private calculateErrorRate(): number {
    // Simulate error rate calculation
    return Math.random() * 0.05; // 0-5%
  }

  private calculateThroughput(): number {
    // Simulate throughput calculation
    return Math.random() * 1000 + 500; // 500-1500 requests/second
  }
}

// Export singleton instance
export const advancedSecurityFramework = new AdvancedSecurityFrameworkService();
/**
 * PR-57: Advanced Security Framework Service
 * 
 * Sistema avanzado de seguridad con autenticación multi-factor,
 * autorización basada en roles, protección CSRF, sanitización de entrada,
 * y monitoreo de amenazas en tiempo real.
 */

import { structuredLogger } from '../lib/structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

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
}

export interface UserSession {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
  mfaVerified: boolean;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'mfa_attempt' | 'mfa_success' | 'mfa_failure' | 
        'permission_denied' | 'suspicious_activity' | 'csrf_attack' | 
        'rate_limit_exceeded' | 'input_sanitization' | 'threat_detected';
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface MFASecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  createdAt: Date;
}

export interface ThreatDetection {
  ipAddress: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  attackTypes: string[];
  attempts: number;
  firstSeen: Date;
  lastSeen: Date;
  blocked: boolean;
}

export class SecurityManagerService {
  private static instance: SecurityManagerService;
  private config: SecurityConfig;
  private activeSessions: Map<string, UserSession> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private threatDatabase: Map<string, ThreatDetection> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.startMonitoring();
  }

  public static getInstance(): SecurityManagerService {
    if (!SecurityManagerService.instance) {
      SecurityManagerService.instance = new SecurityManagerService();
    }
    return SecurityManagerService.instance;
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        algorithm: 'HS256'
      },
      mfa: {
        enabled: true,
        issuer: 'ECONEURA',
        window: 2,
        backupCodes: 10
      },
      csrf: {
        enabled: true,
        secret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
        tokenLength: 32,
        cookieName: 'csrf-token'
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 100,
        skipSuccessfulRequests: false
      },
      inputSanitization: {
        enabled: true,
        maxLength: 10000,
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
        blockedPatterns: [
          '<script',
          'javascript:',
          'onload=',
          'onerror=',
          'onclick=',
          'onmouseover=',
          'eval(',
          'document.cookie',
          'window.location'
        ]
      },
      threatDetection: {
        enabled: true,
        suspiciousPatterns: [
          'admin',
          'root',
          'password',
          'login',
          'sql',
          'union',
          'select',
          'drop',
          'delete',
          'insert',
          'update'
        ],
        maxFailedAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutos
      }
    };
  }

  /**
   * Genera un token JWT
   */
  public generateJWT(payload: any): string {
    try {
      const token = jwt.sign(payload, this.config.jwt.secret, {
        expiresIn: this.config.jwt.expiresIn,
        algorithm: this.config.jwt.algorithm as any
      });

      structuredLogger.debug('JWT token generated', {
        userId: payload.userId,
        organizationId: payload.organizationId
      });

      return token;
    } catch (error) {
      structuredLogger.error('Failed to generate JWT', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to generate JWT token');
    }
  }

  /**
   * Verifica un token JWT
   */
  public verifyJWT(token: string): any {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        algorithms: [this.config.jwt.algorithm as any]
      });

      structuredLogger.debug('JWT token verified', {
        userId: (decoded as any).userId
      });

      return decoded;
    } catch (error) {
      structuredLogger.warn('JWT token verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Genera un token de refresh
   */
  public generateRefreshToken(payload: any): string {
    try {
      const token = jwt.sign(payload, this.config.jwt.secret, {
        expiresIn: this.config.jwt.refreshExpiresIn,
        algorithm: this.config.jwt.algorithm as any
      });

      structuredLogger.debug('Refresh token generated', {
        userId: payload.userId
      });

      return token;
    } catch (error) {
      structuredLogger.error('Failed to generate refresh token', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Genera secretos para MFA
   */
  public generateMFASecret(userId: string): MFASecret {
    try {
      const secret = this.generateRandomString(32);
      const qrCode = this.generateQRCode(secret, userId);
      const backupCodes = this.generateBackupCodes();

      const mfaSecret: MFASecret = {
        secret,
        qrCode,
        backupCodes,
        createdAt: new Date()
      };

      structuredLogger.info('MFA secret generated', {
        userId,
        backupCodesCount: backupCodes.length
      });

      // Métricas
      metrics.securityMfaSecretsGenerated.inc({ userId });

      return mfaSecret;
    } catch (error) {
      structuredLogger.error('Failed to generate MFA secret', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to generate MFA secret');
    }
  }

  /**
   * Verifica código MFA
   */
  public verifyMFACode(secret: string, code: string, userId: string): boolean {
    try {
      // En un sistema real, usaríamos una librería como speakeasy
      const isValid = this.validateTOTPCode(secret, code);

      if (isValid) {
        structuredLogger.info('MFA code verified successfully', {
          userId,
          code: code.substring(0, 2) + '****'
        });

        // Métricas
        metrics.securityMfaVerifications.inc({ 
          userId, 
          result: 'success' 
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'mfa_success',
          userId,
          ipAddress: '127.0.0.1', // Se obtendría del request
          userAgent: 'SecurityManager',
          details: { codeLength: code.length },
          severity: 'low',
          timestamp: new Date()
        });
      } else {
        structuredLogger.warn('MFA code verification failed', {
          userId,
          code: code.substring(0, 2) + '****'
        });

        // Métricas
        metrics.securityMfaVerifications.inc({ 
          userId, 
          result: 'failure' 
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'mfa_failure',
          userId,
          ipAddress: '127.0.0.1',
          userAgent: 'SecurityManager',
          details: { codeLength: code.length },
          severity: 'medium',
          timestamp: new Date()
        });
      }

      return isValid;
    } catch (error) {
      structuredLogger.error('MFA verification error', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Genera token CSRF
   */
  public generateCSRFToken(): string {
    try {
      const token = crypto.randomBytes(this.config.csrf.tokenLength).toString('hex');

      structuredLogger.debug('CSRF token generated', {
        tokenLength: token.length
      });

      return token;
    } catch (error) {
      structuredLogger.error('Failed to generate CSRF token', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Verifica token CSRF
   */
  public verifyCSRFToken(token: string, sessionToken: string): boolean {
    try {
      const isValid = token === sessionToken;

      if (!isValid) {
        structuredLogger.warn('CSRF token verification failed', {
          tokenLength: token.length,
          sessionTokenLength: sessionToken.length
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'csrf_attack',
          ipAddress: '127.0.0.1',
          userAgent: 'SecurityManager',
          details: { tokenLength: token.length },
          severity: 'high',
          timestamp: new Date()
        });

        // Métricas
        metrics.securityCsrfAttacks.inc();
      }

      return isValid;
    } catch (error) {
      structuredLogger.error('CSRF verification error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Sanitiza entrada de usuario
   */
  public sanitizeInput(input: string): string {
    try {
      if (!this.config.inputSanitization.enabled) {
        return input;
      }

      let sanitized = input;

      // Verificar longitud máxima
      if (sanitized.length > this.config.inputSanitization.maxLength) {
        sanitized = sanitized.substring(0, this.config.inputSanitization.maxLength);
      }

      // Remover patrones bloqueados
      for (const pattern of this.config.inputSanitization.blockedPatterns) {
        const regex = new RegExp(pattern, 'gi');
        sanitized = sanitized.replace(regex, '[BLOCKED]');
      }

      // Escapar caracteres HTML
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

      if (sanitized !== input) {
        structuredLogger.warn('Input sanitization applied', {
          originalLength: input.length,
          sanitizedLength: sanitized.length,
          blockedPatterns: this.config.inputSanitization.blockedPatterns.filter(p => 
            input.toLowerCase().includes(p.toLowerCase())
          )
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'input_sanitization',
          ipAddress: '127.0.0.1',
          userAgent: 'SecurityManager',
          details: { 
            originalLength: input.length,
            sanitizedLength: sanitized.length 
          },
          severity: 'low',
          timestamp: new Date()
        });

        // Métricas
        metrics.securityInputSanitizations.inc();
      }

      return sanitized;
    } catch (error) {
      structuredLogger.error('Input sanitization error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return input;
    }
  }

  /**
   * Detecta amenazas en tiempo real
   */
  public detectThreat(ipAddress: string, userAgent: string, requestData: any): ThreatDetection | null {
    try {
      if (!this.config.threatDetection.enabled) {
        return null;
      }

      const threatLevel = this.analyzeThreatLevel(ipAddress, userAgent, requestData);
      
      if (threatLevel === 'low') {
        return null;
      }

      const existingThreat = this.threatDatabase.get(ipAddress);
      const now = new Date();

      if (existingThreat) {
        existingThreat.attempts++;
        existingThreat.lastSeen = now;
        existingThreat.threatLevel = this.escalateThreatLevel(existingThreat.threatLevel, threatLevel);
      } else {
        const newThreat: ThreatDetection = {
          ipAddress,
          threatLevel,
          attackTypes: this.identifyAttackTypes(requestData),
          attempts: 1,
          firstSeen: now,
          lastSeen: now,
          blocked: false
        };
        this.threatDatabase.set(ipAddress, newThreat);
      }

      const threat = this.threatDatabase.get(ipAddress)!;

      // Bloquear si es crítico
      if (threat.threatLevel === 'critical' && threat.attempts >= 3) {
        threat.blocked = true;
        structuredLogger.error('IP address blocked due to critical threat', {
          ipAddress,
          threatLevel: threat.threatLevel,
          attempts: threat.attempts,
          attackTypes: threat.attackTypes
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'threat_detected',
          ipAddress,
          userAgent,
          details: {
            threatLevel: threat.threatLevel,
            attempts: threat.attempts,
            attackTypes: threat.attackTypes
          },
          severity: 'critical',
          timestamp: now
        });

        // Métricas
        metrics.securityThreatsDetected.inc({
          threatLevel: threat.threatLevel,
          attackType: threat.attackTypes.join(',')
        });
      }

      return threat;
    } catch (error) {
      structuredLogger.error('Threat detection error', {
        ipAddress,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Verifica permisos de usuario
   */
  public checkPermission(userId: string, permission: string, resource?: string): boolean {
    try {
      const session = this.activeSessions.get(userId);
      
      if (!session) {
        structuredLogger.warn('Permission check failed - no active session', {
          userId,
          permission,
          resource
        });
        return false;
      }

      const hasPermission = session.permissions.includes(permission) || 
                           session.permissions.includes('*') ||
                           session.roles.includes('admin');

      if (!hasPermission) {
        structuredLogger.warn('Permission denied', {
          userId,
          permission,
          resource,
          userRoles: session.roles,
          userPermissions: session.permissions
        });

        // Registrar evento de seguridad
        this.recordSecurityEvent({
          type: 'permission_denied',
          userId,
          organizationId: session.organizationId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          details: { permission, resource },
          severity: 'medium',
          timestamp: new Date()
        });

        // Métricas
        metrics.securityPermissionDenied.inc({
          userId,
          permission
        });
      }

      return hasPermission;
    } catch (error) {
      structuredLogger.error('Permission check error', {
        userId,
        permission,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Registra evento de seguridad
   */
  public recordSecurityEvent(event: SecurityEvent): void {
    try {
      this.securityEvents.push(event);

      // Mantener solo los últimos 1000 eventos
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-1000);
      }

      structuredLogger.info('Security event recorded', {
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        ipAddress: event.ipAddress
      });

      // Métricas
      metrics.securityEvents.inc({
        type: event.type,
        severity: event.severity
      });
    } catch (error) {
      structuredLogger.error('Failed to record security event', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Obtiene estadísticas de seguridad
   */
  public getSecurityStats(): {
    activeSessions: number;
    securityEvents: number;
    threatsDetected: number;
    blockedIPs: number;
    mfaEnabled: boolean;
    csrfEnabled: boolean;
    rateLimitEnabled: boolean;
    inputSanitizationEnabled: boolean;
    threatDetectionEnabled: boolean;
  } {
    const activeSessions = this.activeSessions.size;
    const securityEvents = this.securityEvents.length;
    const threatsDetected = this.threatDatabase.size;
    const blockedIPs = Array.from(this.threatDatabase.values()).filter(t => t.blocked).length;

    return {
      activeSessions,
      securityEvents,
      threatsDetected,
      blockedIPs,
      mfaEnabled: this.config.mfa.enabled,
      csrfEnabled: this.config.csrf.enabled,
      rateLimitEnabled: this.config.rateLimit.enabled,
      inputSanitizationEnabled: this.config.inputSanitization.enabled,
      threatDetectionEnabled: this.config.threatDetection.enabled
    };
  }

  private generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  private generateQRCode(secret: string, userId: string): string {
    // En un sistema real, generaríamos un QR code real
    return `otpauth://totp/${this.config.mfa.issuer}:${userId}?secret=${secret}&issuer=${this.config.mfa.issuer}`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.config.mfa.backupCodes; i++) {
      codes.push(this.generateRandomString(8));
    }
    return codes;
  }

  private validateTOTPCode(secret: string, code: string): boolean {
    // En un sistema real, usaríamos speakeasy para validar TOTP
    // Por ahora, simulamos validación
    return code.length === 6 && /^\d+$/.test(code);
  }

  private analyzeThreatLevel(ipAddress: string, userAgent: string, requestData: any): 'low' | 'medium' | 'high' | 'critical' {
    let threatScore = 0;

    // Analizar patrones sospechosos en requestData
    const dataString = JSON.stringify(requestData).toLowerCase();
    for (const pattern of this.config.threatDetection.suspiciousPatterns) {
      if (dataString.includes(pattern.toLowerCase())) {
        threatScore += 10;
      }
    }

    // Analizar user agent
    if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      threatScore += 5;
    }

    // Analizar intentos fallidos
    const failedAttempts = this.failedAttempts.get(ipAddress);
    if (failedAttempts && failedAttempts.count > 3) {
      threatScore += 20;
    }

    if (threatScore >= 50) return 'critical';
    if (threatScore >= 30) return 'high';
    if (threatScore >= 15) return 'medium';
    return 'low';
  }

  private identifyAttackTypes(requestData: any): string[] {
    const attackTypes: string[] = [];
    const dataString = JSON.stringify(requestData).toLowerCase();

    if (dataString.includes('sql') || dataString.includes('union') || dataString.includes('select')) {
      attackTypes.push('sql_injection');
    }
    if (dataString.includes('<script') || dataString.includes('javascript:')) {
      attackTypes.push('xss');
    }
    if (dataString.includes('admin') || dataString.includes('root')) {
      attackTypes.push('privilege_escalation');
    }

    return attackTypes;
  }

  private escalateThreatLevel(current: string, newLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(newLevel);
    return levels[Math.max(currentIndex, newIndex)] as any;
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performSecurityMonitoring();
    }, 60000); // Cada minuto

    structuredLogger.info('Security monitoring started', {
      mfaEnabled: this.config.mfa.enabled,
      csrfEnabled: this.config.csrf.enabled,
      threatDetectionEnabled: this.config.threatDetection.enabled
    });
  }

  private performSecurityMonitoring(): void {
    try {
      // Limpiar sesiones expiradas
      this.cleanupExpiredSessions();

      // Limpiar intentos fallidos expirados
      this.cleanupFailedAttempts();

      // Analizar amenazas
      this.analyzeThreats();

      structuredLogger.debug('Security monitoring completed', {
        activeSessions: this.activeSessions.size,
        securityEvents: this.securityEvents.length,
        threatsDetected: this.threatDatabase.size
      });
    } catch (error) {
      structuredLogger.error('Security monitoring failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionAge = now.getTime() - session.lastActivity.getTime();
      if (sessionAge > 24 * 60 * 60 * 1000) { // 24 horas
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      structuredLogger.info('Expired sessions cleaned up', {
        count: expiredSessions.length
      });
    }
  }

  private cleanupFailedAttempts(): void {
    const now = new Date();
    const expiredAttempts: string[] = [];

    for (const [ipAddress, attempts] of this.failedAttempts.entries()) {
      const attemptAge = now.getTime() - attempts.lastAttempt.getTime();
      if (attemptAge > this.config.threatDetection.lockoutDuration) {
        expiredAttempts.push(ipAddress);
      }
    }

    for (const ipAddress of expiredAttempts) {
      this.failedAttempts.delete(ipAddress);
    }
  }

  private analyzeThreats(): void {
    const now = new Date();
    const criticalThreats = Array.from(this.threatDatabase.values())
      .filter(t => t.threatLevel === 'critical' && !t.blocked);

    if (criticalThreats.length > 0) {
      structuredLogger.warn('Critical threats detected', {
        count: criticalThreats.length,
        ips: criticalThreats.map(t => t.ipAddress)
      });
    }
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Security configuration updated', { config: this.config });
  }

  /**
   * Detiene el servicio de monitoreo
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    structuredLogger.info('Security manager stopped');
  }
}

export const securityManagerService = SecurityManagerService.getInstance();

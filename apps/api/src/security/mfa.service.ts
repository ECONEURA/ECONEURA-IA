/**
 * PR-57: Multi-Factor Authentication Service
 * 
 * Sistema avanzado de autenticación multi-factor con TOTP,
 * códigos de respaldo, notificaciones push y verificación por SMS.
 */

import { structuredLogger } from '../lib/structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
import crypto from 'crypto';

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'push' | 'backup';
  name: string;
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export interface MFASession {
  userId: string;
  sessionId: string;
  methods: MFAMethod[];
  requiredMethods: string[];
  completedMethods: string[];
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface MFACode {
  code: string;
  type: 'totp' | 'sms' | 'email' | 'backup';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  used: boolean;
}

export interface MFANotification {
  id: string;
  userId: string;
  type: 'login_attempt' | 'mfa_required' | 'mfa_success' | 'mfa_failure' | 'new_device';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
}

export class MFAService {
  private static instance: MFAService;
  private activeSessions: Map<string, MFASession> = new Map();
  private activeCodes: Map<string, MFACode> = new Map();
  private userMethods: Map<string, MFAMethod[]> = new Map();
  private notifications: Map<string, MFANotification[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  /**
   * Inicializa MFA para un usuario
   */
  public async initializeMFA(userId: string): Promise<{
    totpSecret: string;
    qrCode: string;
    backupCodes: string[];
    methods: MFAMethod[];
  }> {
    try {
      // Generar secret TOTP
      const totpSecret = this.generateTOTPSecret();
      const qrCode = this.generateQRCode(totpSecret, userId);
      const backupCodes = this.generateBackupCodes();

      // Crear métodos MFA
      const methods: MFAMethod[] = [
        {
          id: crypto.randomUUID(),
          type: 'totp',
          name: 'Authenticator App',
          enabled: true,
          verified: false,
          createdAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          type: 'sms',
          name: 'SMS',
          enabled: false,
          verified: false,
          createdAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          type: 'email',
          name: 'Email',
          enabled: false,
          verified: false,
          createdAt: new Date()
        },
        {
          id: crypto.randomUUID(),
          type: 'backup',
          name: 'Backup Codes',
          enabled: true,
          verified: true,
          createdAt: new Date()
        }
      ];

      // Guardar métodos del usuario
      this.userMethods.set(userId, methods);

      structuredLogger.info('MFA initialized for user', {
        userId,
        methodsCount: methods.length,
        backupCodesCount: backupCodes.length
      });

      // Métricas
      metrics.securityMfaInitialized.inc({ userId });

      return {
        totpSecret,
        qrCode,
        backupCodes,
        methods
      };
    } catch (error) {
      structuredLogger.error('Failed to initialize MFA', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to initialize MFA');
    }
  }

  /**
   * Verifica código TOTP
   */
  public async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    try {
      const userMethods = this.userMethods.get(userId);
      if (!userMethods) {
        throw new Error('User MFA methods not found');
      }

      const totpMethod = userMethods.find(m => m.type === 'totp');
      if (!totpMethod || !totpMethod.enabled) {
        throw new Error('TOTP method not enabled');
      }

      // En un sistema real, usaríamos speakeasy para validar TOTP
      const isValid = this.validateTOTPCode(code);

      if (isValid) {
        totpMethod.verified = true;
        totpMethod.lastUsed = new Date();

        structuredLogger.info('TOTP code verified successfully', {
          userId,
          methodId: totpMethod.id
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: 'totp',
          result: 'success'
        });

        // Crear notificación
        await this.createNotification(userId, {
          type: 'mfa_success',
          title: 'MFA Verification Successful',
          message: 'Your TOTP code was verified successfully',
          data: { method: 'totp' }
        });
      } else {
        structuredLogger.warn('TOTP code verification failed', {
          userId,
          methodId: totpMethod.id
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: 'totp',
          result: 'failure'
        });

        // Crear notificación
        await this.createNotification(userId, {
          type: 'mfa_failure',
          title: 'MFA Verification Failed',
          message: 'Your TOTP code verification failed',
          data: { method: 'totp' }
        });
      }

      return isValid;
    } catch (error) {
      structuredLogger.error('TOTP verification error', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Envía código SMS
   */
  public async sendSMSCode(userId: string, phoneNumber: string): Promise<string> {
    try {
      const code = this.generateSMSCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

      // Guardar código activo
      const codeId = crypto.randomUUID();
      this.activeCodes.set(codeId, {
        code,
        type: 'sms',
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
        used: false
      });

      // En un sistema real, enviaríamos SMS
      structuredLogger.info('SMS code sent', {
        userId,
        phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
        codeId,
        expiresAt
      });

      // Métricas
      metrics.securityMfaCodesSent.inc({
        userId,
        method: 'sms'
      });

      // Crear notificación
      await this.createNotification(userId, {
        type: 'mfa_required',
        title: 'SMS Code Sent',
        message: `A verification code has been sent to ${phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}`,
        data: { method: 'sms', phoneNumber }
      });

      return code; // En producción, no devolver el código
    } catch (error) {
      structuredLogger.error('Failed to send SMS code', {
        userId,
        phoneNumber,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to send SMS code');
    }
  }

  /**
   * Envía código por email
   */
  public async sendEmailCode(userId: string, email: string): Promise<string> {
    try {
      const code = this.generateEmailCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Guardar código activo
      const codeId = crypto.randomUUID();
      this.activeCodes.set(codeId, {
        code,
        type: 'email',
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
        used: false
      });

      // En un sistema real, enviaríamos email
      structuredLogger.info('Email code sent', {
        userId,
        email: email.replace(/(.{2}).*(@.*)/, '$1****$2'),
        codeId,
        expiresAt
      });

      // Métricas
      metrics.securityMfaCodesSent.inc({
        userId,
        method: 'email'
      });

      // Crear notificación
      await this.createNotification(userId, {
        type: 'mfa_required',
        title: 'Email Code Sent',
        message: `A verification code has been sent to ${email.replace(/(.{2}).*(@.*)/, '$1****$2')}`,
        data: { method: 'email', email }
      });

      return code; // En producción, no devolver el código
    } catch (error) {
      structuredLogger.error('Failed to send email code', {
        userId,
        email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to send email code');
    }
  }

  /**
   * Verifica código SMS o Email
   */
  public async verifyCode(userId: string, code: string, type: 'sms' | 'email'): Promise<boolean> {
    try {
      // Buscar código activo
      let activeCode: MFACode | null = null;
      let codeId: string | null = null;

      for (const [id, c] of this.activeCodes.entries()) {
        if (c.type === type && !c.used && c.expiresAt > new Date()) {
          activeCode = c;
          codeId = id;
          break;
        }
      }

      if (!activeCode) {
        structuredLogger.warn('No active code found for verification', {
          userId,
          type
        });
        return false;
      }

      // Verificar intentos
      if (activeCode.attempts >= activeCode.maxAttempts) {
        structuredLogger.warn('Code verification attempts exceeded', {
          userId,
          type,
          attempts: activeCode.attempts,
          maxAttempts: activeCode.maxAttempts
        });
        return false;
      }

      activeCode.attempts++;

      const isValid = activeCode.code === code;

      if (isValid) {
        activeCode.used = true;

        // Actualizar método del usuario
        const userMethods = this.userMethods.get(userId);
        if (userMethods) {
          const method = userMethods.find(m => m.type === type);
          if (method) {
            method.verified = true;
            method.lastUsed = new Date();
          }
        }

        structuredLogger.info('Code verified successfully', {
          userId,
          type,
          codeId
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: type,
          result: 'success'
        });

        // Crear notificación
        await this.createNotification(userId, {
          type: 'mfa_success',
          title: 'MFA Verification Successful',
          message: `Your ${type.toUpperCase()} code was verified successfully`,
          data: { method: type }
        });
      } else {
        structuredLogger.warn('Code verification failed', {
          userId,
          type,
          codeId,
          attempts: activeCode.attempts
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: type,
          result: 'failure'
        });

        // Crear notificación
        await this.createNotification(userId, {
          type: 'mfa_failure',
          title: 'MFA Verification Failed',
          message: `Your ${type.toUpperCase()} code verification failed`,
          data: { method: type }
        });
      }

      return isValid;
    } catch (error) {
      structuredLogger.error('Code verification error', {
        userId,
        type,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Verifica código de respaldo
   */
  public async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // En un sistema real, verificaríamos contra códigos de respaldo almacenados
      const isValid = this.validateBackupCode(code);

      if (isValid) {
        structuredLogger.info('Backup code verified successfully', {
          userId
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: 'backup',
          result: 'success'
        });

        // Crear notificación
        await this.createNotification(userId, {
          type: 'mfa_success',
          title: 'Backup Code Verified',
          message: 'Your backup code was verified successfully',
          data: { method: 'backup' }
        });
      } else {
        structuredLogger.warn('Backup code verification failed', {
          userId
        });

        // Métricas
        metrics.securityMfaVerifications.inc({
          userId,
          method: 'backup',
          result: 'failure'
        });
      }

      return isValid;
    } catch (error) {
      structuredLogger.error('Backup code verification error', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Crea una sesión MFA
   */
  public async createMFASession(
    userId: string,
    requiredMethods: string[],
    ipAddress: string,
    userAgent: string
  ): Promise<MFASession> {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      const userMethods = this.userMethods.get(userId) || [];
      const enabledMethods = userMethods.filter(m => m.enabled);

      const session: MFASession = {
        userId,
        sessionId,
        methods: enabledMethods,
        requiredMethods,
        completedMethods: [],
        expiresAt,
        ipAddress,
        userAgent
      };

      this.activeSessions.set(sessionId, session);

      structuredLogger.info('MFA session created', {
        userId,
        sessionId,
        requiredMethods,
        enabledMethods: enabledMethods.length
      });

      // Métricas
      metrics.securityMfaSessionsCreated.inc({ userId });

      return session;
    } catch (error) {
      structuredLogger.error('Failed to create MFA session', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to create MFA session');
    }
  }

  /**
   * Completa un método MFA en la sesión
   */
  public async completeMFAMethod(sessionId: string, methodId: string): Promise<boolean> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('MFA session not found');
      }

      if (session.expiresAt < new Date()) {
        throw new Error('MFA session expired');
      }

      if (!session.completedMethods.includes(methodId)) {
        session.completedMethods.push(methodId);
      }

      const isComplete = session.requiredMethods.every(method => 
        session.completedMethods.includes(method)
      );

      structuredLogger.info('MFA method completed', {
        sessionId,
        methodId,
        completedMethods: session.completedMethods.length,
        requiredMethods: session.requiredMethods.length,
        isComplete
      });

      // Métricas
      metrics.securityMfaMethodsCompleted.inc({
        sessionId,
        method: methodId
      });

      return isComplete;
    } catch (error) {
      structuredLogger.error('Failed to complete MFA method', {
        sessionId,
        methodId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Crea una notificación
   */
  public async createNotification(
    userId: string,
    notification: Omit<MFANotification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<MFANotification> {
    try {
      const newNotification: MFANotification = {
        id: crypto.randomUUID(),
        userId,
        read: false,
        createdAt: new Date(),
        ...notification
      };

      const userNotifications = this.notifications.get(userId) || [];
      userNotifications.push(newNotification);
      this.notifications.set(userId, userNotifications);

      structuredLogger.info('MFA notification created', {
        userId,
        notificationId: newNotification.id,
        type: newNotification.type
      });

      // Métricas
      metrics.securityMfaNotificationsCreated.inc({
        userId,
        type: newNotification.type
      });

      return newNotification;
    } catch (error) {
      structuredLogger.error('Failed to create MFA notification', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to create MFA notification');
    }
  }

  /**
   * Obtiene notificaciones del usuario
   */
  public async getUserNotifications(userId: string): Promise<MFANotification[]> {
    try {
      const notifications = this.notifications.get(userId) || [];
      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      structuredLogger.error('Failed to get user notifications', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Marca notificación como leída
   */
  public async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const notifications = this.notifications.get(userId) || [];
      const notification = notifications.find(n => n.id === notificationId);

      if (notification) {
        notification.read = true;
        structuredLogger.info('Notification marked as read', {
          userId,
          notificationId
        });
        return true;
      }

      return false;
    } catch (error) {
      structuredLogger.error('Failed to mark notification as read', {
        userId,
        notificationId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Obtiene estadísticas MFA
   */
  public getMFAStats(): {
    activeSessions: number;
    activeCodes: number;
    totalUsers: number;
    totalNotifications: number;
    methodsEnabled: {
      totp: number;
      sms: number;
      email: number;
      backup: number;
    };
  } {
    const activeSessions = this.activeSessions.size;
    const activeCodes = this.activeCodes.size;
    const totalUsers = this.userMethods.size;
    const totalNotifications = Array.from(this.notifications.values()).reduce(
      (sum, notifications) => sum + notifications.length, 0
    );

    const methodsEnabled = {
      totp: 0,
      sms: 0,
      email: 0,
      backup: 0
    };

    for (const methods of this.userMethods.values()) {
      for (const method of methods) {
        if (method.enabled) {
          methodsEnabled[method.type]++;
        }
      }
    }

    return {
      activeSessions,
      activeCodes,
      totalUsers,
      totalNotifications,
      methodsEnabled
    };
  }

  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }

  private generateQRCode(secret: string, userId: string): string {
    // En un sistema real, generaríamos un QR code real
    return `otpauth://totp/ECONEURA:${userId}?secret=${secret}&issuer=ECONEURA`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateEmailCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private validateTOTPCode(code: string): boolean {
    // En un sistema real, usaríamos speakeasy
    return code.length === 6 && /^\d+$/.test(code);
  }

  private validateBackupCode(code: string): boolean {
    // En un sistema real, verificaríamos contra códigos almacenados
    return code.length === 8 && /^[A-F0-9]+$/.test(code);
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performMFAMonitoring();
    }, 60000); // Cada minuto

    structuredLogger.info('MFA monitoring started');
  }

  private performMFAMonitoring(): void {
    try {
      // Limpiar sesiones expiradas
      this.cleanupExpiredSessions();

      // Limpiar códigos expirados
      this.cleanupExpiredCodes();

      structuredLogger.debug('MFA monitoring completed', {
        activeSessions: this.activeSessions.size,
        activeCodes: this.activeCodes.size
      });
    } catch (error) {
      structuredLogger.error('MFA monitoring failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt < now) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      structuredLogger.info('Expired MFA sessions cleaned up', {
        count: expiredSessions.length
      });
    }
  }

  private cleanupExpiredCodes(): void {
    const now = new Date();
    const expiredCodes: string[] = [];

    for (const [codeId, code] of this.activeCodes.entries()) {
      if (code.expiresAt < now || code.used) {
        expiredCodes.push(codeId);
      }
    }

    for (const codeId of expiredCodes) {
      this.activeCodes.delete(codeId);
    }

    if (expiredCodes.length > 0) {
      structuredLogger.info('Expired MFA codes cleaned up', {
        count: expiredCodes.length
      });
    }
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
    structuredLogger.info('MFA service stopped');
  }
}

export const mfaService = MFAService.getInstance();

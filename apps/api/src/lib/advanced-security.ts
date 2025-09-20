import { EventEmitter } from 'events';
import { z } from 'zod';
import { logger } from './logger.js';
import { metrics } from './metrics.js';
import { tracing } from './tracing.js';
import { finOpsSystem } from './finops.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  roles: string[];
  permissions: string[];
  lastLogin: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MFAMethod {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  secret?: string;
  phoneNumber?: string;
  email?: string;
  verified: boolean;
  createdAt: Date;
}

export interface APIToken {
  id: string;
  userId: string;
  name: string;
  token: string;
  scopes: string[];
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  orgId: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'mfa_attempt' | 'permission_denied' | 'anomaly_detected' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ThreatIntelligence {
  ipAddress: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  country: string;
  city?: string;
  isp?: string;
  threatTypes: string[];
  lastSeen: Date;
  confidence: number;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'oidc' | 'saml';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  scopes: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMAS
// ============================================================================

export const UserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export const MFAMethodSchema = z.object({
  type: z.enum(['totp', 'sms', 'email', 'hardware']),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
});

export const APITokenSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()),
  expiresIn: z.number().optional(), // seconds
});

export const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  orgId: z.string(),
});

export const PermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  resource: z.string(),
  action: z.string(),
  orgId: z.string(),
});

// ============================================================================
// ADVANCED SECURITY SYSTEM
// ============================================================================

export class AdvancedSecuritySystem extends EventEmitter {
  private users: Map<string, User> = new Map();
  private mfaMethods: Map<string, MFAMethod[]> = new Map();
  private apiTokens: Map<string, APIToken> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private auditLogs: AuditLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private ssoProviders: Map<string, SSOProvider> = new Map();
  private failedLoginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private ipReputationCache: Map<string, { reputation: string; timestamp: Date }> = new Map();

  constructor() {
    super();
    this.initializeSecurity();
    this.setupDefaultRoles();
    this.setupDefaultPermissions();
    logger.info('Advanced Security System initialized', {
      system: 'security',
      action: 'initialize',
      components: ['mfa', 'identity', 'api-security', 'audit', 'threat-detection'],
    });
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(data: z.infer<typeof UserSchema>): Promise<User> {
    const startTime = Date.now();
    
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(
        u => u.email === data.email || u.username === data.username
      );
      
      if (existingUser) {
        throw new Error('User already exists with this email or username');
      }

      // Generate salt and hash password
      const salt = crypto.randomBytes(32).toString('hex');
      const passwordHash = this.hashPassword(data.password, salt);

      const user: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: data.email,
        username: data.username,
        passwordHash,
        salt,
        mfaEnabled: false,
        backupCodes: this.generateBackupCodes(),
        roles: data.roles || ['user'],
        permissions: data.permissions || [],
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.set(user.id, user);

      // Log audit event
      await this.logAuditEvent({
        action: 'user_created',
        resource: 'user',
        resourceId: user.id,
        details: { email: user.email, username: user.username },
        ipAddress: 'system',
        userAgent: 'system',
        success: true,
      });

      const duration = Date.now() - startTime;
      
      logger.info('User created successfully', {
        system: 'security',
        action: 'create_user',
        category: 'identity',
        userId: user.id,
        email: user.email,
        duration,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        system: 'security',
        action: 'create_user',
        category: 'identity',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async authenticateUser(email: string, password: string, ipAddress: string, userAgent: string): Promise<{ user: User; token: string } | null> {
    const startTime = Date.now();
    
    try {
      // Check for brute force protection
      const bruteForceCheck = this.checkBruteForceProtection(email, ipAddress);
      if (!bruteForceCheck.allowed) {
        await this.logSecurityEvent({
          type: 'login_attempt',
          severity: 'high',
          ipAddress,
          userAgent,
          details: { email, reason: 'brute_force_protection', attempts: bruteForceCheck.attempts },
        });
        return null;
      }

      // Find user
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        await this.recordFailedLogin(email, ipAddress);
        return null;
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.logSecurityEvent({
          type: 'login_attempt',
          severity: 'medium',
          userId: user.id,
          ipAddress,
          userAgent,
          details: { reason: 'account_locked', lockedUntil: user.lockedUntil },
        });
        return null;
      }

      // Verify password
      const passwordHash = this.hashPassword(password, user.salt);
      if (passwordHash !== user.passwordHash) {
        await this.recordFailedLogin(email, ipAddress);
        return null;
      }

      // Reset failed login attempts
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(user.id, user);

      // Generate JWT token
      const token = this.generateJWT(user);

      // Log successful login
      await this.logAuditEvent({
        userId: user.id,
        action: 'user_login',
        resource: 'user',
        resourceId: user.id,
        details: { email: user.email, mfaRequired: user.mfaEnabled },
        ipAddress,
        userAgent,
        success: true,
      });

      const duration = Date.now() - startTime;
      
      logger.info('User authenticated successfully', {
        system: 'security',
        action: 'authenticate_user',
        category: 'identity',
        userId: user.id,
        email: user.email,
        duration,
        mfaEnabled: user.mfaEnabled,
      });

      return { user, token };
    } catch (error) {
      logger.error('Authentication failed', {
        system: 'security',
        action: 'authenticate_user',
        category: 'identity',
        error: (error as Error).message,
      });
      return null;
    }
  }

  // ============================================================================
  // MFA MANAGEMENT
  // ============================================================================

  async setupMFA(userId: string, method: z.infer<typeof MFAMethodSchema>): Promise<{ secret?: string; qrCode?: string }> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const mfaMethod: MFAMethod = {
        id: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: method.type,
        verified: false,
        createdAt: new Date(),
      };

      if (method.type === 'totp') {
        const secret = this.generateTOTPSecret();
        mfaMethod.secret = secret;
        
        // Generate QR code for TOTP
        const qrCode = this.generateTOTPQRCode(user.email, secret);
        
        // Store MFA method
        const userMFAMethods = this.mfaMethods.get(userId) || [];
        userMFAMethods.push(mfaMethod);
        this.mfaMethods.set(userId, userMFAMethods);

        logger.info('MFA TOTP setup initiated', {
          system: 'security',
          action: 'setup_mfa',
          category: 'mfa',
          userId,
          mfaType: method.type,
        });

        return { secret, qrCode };
      } else if (method.type === 'sms' && method.phoneNumber) {
        mfaMethod.phoneNumber = method.phoneNumber;
        
        // Send SMS verification code
        const verificationCode = this.generateVerificationCode();
        await this.sendSMSVerification(method.phoneNumber, verificationCode);
        
        // Store MFA method
        const userMFAMethods = this.mfaMethods.get(userId) || [];
        userMFAMethods.push(mfaMethod);
        this.mfaMethods.set(userId, userMFAMethods);

        logger.info('MFA SMS setup initiated', {
          system: 'security',
          action: 'setup_mfa',
          category: 'mfa',
          userId,
          mfaType: method.type,
          phoneNumber: method.phoneNumber,
        });

        return {};
      } else if (method.type === 'email' && method.email) {
        mfaMethod.email = method.email;
        
        // Send email verification code
        const verificationCode = this.generateVerificationCode();
        await this.sendEmailVerification(method.email, verificationCode);
        
        // Store MFA method
        const userMFAMethods = this.mfaMethods.get(userId) || [];
        userMFAMethods.push(mfaMethod);
        this.mfaMethods.set(userId, userMFAMethods);

        logger.info('MFA Email setup initiated', {
          system: 'security',
          action: 'setup_mfa',
          category: 'mfa',
          userId,
          mfaType: method.type,
          email: method.email,
        });

        return {};
      }

      throw new Error('Invalid MFA method');
    } catch (error) {
      logger.error('Failed to setup MFA', {
        system: 'security',
        action: 'setup_mfa',
        category: 'mfa',
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async verifyMFA(userId: string, code: string, methodType: 'totp' | 'sms' | 'email'): Promise<boolean> {
    try {
      const userMFAMethods = this.mfaMethods.get(userId) || [];
      const mfaMethod = userMFAMethods.find(m => m.type === methodType && m.verified);
      
      if (!mfaMethod) {
        return false;
      }

      let isValid = false;

      if (methodType === 'totp' && mfaMethod.secret) {
        isValid = this.verifyTOTPCode(mfaMethod.secret, code);
      } else if (methodType === 'sms' || methodType === 'email') {
        // For SMS/Email, we would verify against the sent code
        // This is a simplified implementation
        isValid = code.length === 6 && /^\d{6}$/.test(code);
      }

      if (isValid) {
        // Enable MFA for user
        const user = this.users.get(userId);
        if (user) {
          user.mfaEnabled = true;
          user.updatedAt = new Date();
          this.users.set(userId, user);
        }

        logger.info('MFA verification successful', {
          system: 'security',
          action: 'verify_mfa',
          category: 'mfa',
          userId,
          mfaType: methodType,
        });
      } else {
        await this.logSecurityEvent({
          type: 'mfa_attempt',
          severity: 'medium',
          userId,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          details: { mfaType: methodType, reason: 'invalid_code' },
        });
      }

      return isValid;
    } catch (error) {
      logger.error('MFA verification failed', {
        system: 'security',
        action: 'verify_mfa',
        category: 'mfa',
        userId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // ============================================================================
  // API TOKEN MANAGEMENT
  // ============================================================================

  async createAPIToken(userId: string, data: z.infer<typeof APITokenSchema>): Promise<APIToken> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      
      const apiToken: APIToken = {
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: data.name,
        token: `sk_${token}`,
        scopes: data.scopes,
        expiresAt: data.expiresIn ? new Date(Date.now() + data.expiresIn * 1000) : undefined,
        createdAt: new Date(),
      };

      this.apiTokens.set(apiToken.id, apiToken);

      await this.logAuditEvent({
        userId,
        action: 'api_token_created',
        resource: 'api_token',
        resourceId: apiToken.id,
        details: { name: apiToken.name, scopes: apiToken.scopes },
        ipAddress: 'system',
        userAgent: 'system',
        success: true,
      });

      logger.info('API token created', {
        system: 'security',
        action: 'create_api_token',
        category: 'api-security',
        userId,
        tokenId: apiToken.id,
        scopes: apiToken.scopes,
      });

      return apiToken;
    } catch (error) {
      logger.error('Failed to create API token', {
        system: 'security',
        action: 'create_api_token',
        category: 'api-security',
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async validateAPIToken(token: string): Promise<{ userId: string; scopes: string[] } | null> {
    try {
      const apiToken = Array.from(this.apiTokens.values()).find(t => t.token === token);
      
      if (!apiToken) {
        return null;
      }

      // Check if token is expired
      if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
        return null;
      }

      // Update last used
      apiToken.lastUsed = new Date();
      this.apiTokens.set(apiToken.id, apiToken);

      return {
        userId: apiToken.userId,
        scopes: apiToken.scopes,
      };
    } catch (error) {
      logger.error('API token validation failed', {
        system: 'security',
        action: 'validate_api_token',
        category: 'api-security',
        error: (error as Error).message,
      });
      return null;
    }
  }

  // ============================================================================
  // ROLE AND PERMISSION MANAGEMENT
  // ============================================================================

  async createRole(data: z.infer<typeof RoleSchema>): Promise<Role> {
    try {
      const role: Role = {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        description: data.description || '',
        permissions: data.permissions,
        orgId: data.orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.roles.set(role.id, role);

      await this.logAuditEvent({
        action: 'role_created',
        resource: 'role',
        resourceId: role.id,
        details: { name: role.name, permissions: role.permissions },
        ipAddress: 'system',
        userAgent: 'system',
        success: true,
      });

      logger.info('Role created', {
        system: 'security',
        action: 'create_role',
        category: 'rbac',
        roleId: role.id,
        name: role.name,
        permissions: role.permissions,
      });

      return role;
    } catch (error) {
      logger.error('Failed to create role', {
        system: 'security',
        action: 'create_role',
        category: 'rbac',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createPermission(data: z.infer<typeof PermissionSchema>): Promise<Permission> {
    try {
      const permission: Permission = {
        id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        description: data.description || '',
        resource: data.resource,
        action: data.action,
        orgId: data.orgId,
        createdAt: new Date(),
      };

      this.permissions.set(permission.id, permission);

      logger.info('Permission created', {
        system: 'security',
        action: 'create_permission',
        category: 'rbac',
        permissionId: permission.id,
        name: permission.name,
        resource: permission.resource,
        permissionAction: permission.action,
      });

      return permission;
    } catch (error) {
      logger.error('Failed to create permission', {
        system: 'security',
        action: 'create_permission',
        category: 'rbac',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return false;
      }

      // Check user's direct permissions
      const hasDirectPermission = user.permissions.some(permId => {
        const permission = this.permissions.get(permId);
        return permission && permission.resource === resource && permission.action === action;
      });

      if (hasDirectPermission) {
        return true;
      }

      // Check role-based permissions
      for (const roleId of user.roles) {
        const role = this.roles.get(roleId);
        if (role) {
          const hasRolePermission = role.permissions.some(permId => {
            const permission = this.permissions.get(permId);
            return permission && permission.resource === resource && permission.action === action;
          });
          
          if (hasRolePermission) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Permission check failed', {
        system: 'security',
        action: 'check_permission',
        category: 'rbac',
        userId,
        resource,
        permissionAction: action,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        timestamp: new Date(),
      };

      this.auditLogs.push(auditLog);

      // Keep only last 10000 audit logs
      if (this.auditLogs.length > 10000) {
        this.auditLogs = this.auditLogs.slice(-10000);
      }

      logger.info('Audit log created', {
        system: 'security',
        action: 'log_audit',
        category: 'audit',
        auditId: auditLog.id,
        userId: auditLog.userId,
        auditAction: auditLog.action,
        resource: auditLog.resource,
        success: auditLog.success,
      });
    } catch (error) {
      logger.error('Failed to log audit event', {
        system: 'security',
        action: 'log_audit',
        category: 'audit',
        error: (error as Error).message,
      });
    }
  }

  // ============================================================================
  // THREAT DETECTION
  // ============================================================================

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        timestamp: new Date(),
        resolved: false,
      };

      this.securityEvents.push(securityEvent);

      // Keep only last 1000 security events
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-1000);
      }

      // Check for threat patterns
      await this.analyzeThreatPatterns(securityEvent);

      logger.warn('Security event logged', {
        system: 'security',
        action: 'log_security_event',
        category: 'threat-detection',
        eventId: securityEvent.id,
        type: securityEvent.type,
        severity: securityEvent.severity,
        userId: securityEvent.userId,
        ipAddress: securityEvent.ipAddress,
      });
    } catch (error) {
      logger.error('Failed to log security event', {
        system: 'security',
        action: 'log_security_event',
        category: 'threat-detection',
        error: (error as Error).message,
      });
    }
  }

  async checkIPReputation(ipAddress: string): Promise<ThreatIntelligence> {
    try {
      // Check cache first
      const cached = this.ipReputationCache.get(ipAddress);
      if (cached && Date.now() - cached.timestamp.getTime() < 3600000) { // 1 hour cache
        return this.threatIntelligence.get(ipAddress) || {
          ipAddress,
          reputation: 'good',
          country: 'unknown',
          threatTypes: [],
          lastSeen: new Date(),
          confidence: 0,
        };
      }

      // Simulate IP reputation check
      const reputation = Math.random() > 0.9 ? 'malicious' : Math.random() > 0.7 ? 'suspicious' : 'good';
      const country = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'][Math.floor(Math.random() * 7)];
      const threatTypes = reputation === 'malicious' ? ['botnet', 'spam'] : [];
      const confidence = reputation === 'malicious' ? 0.9 : reputation === 'suspicious' ? 0.6 : 0.95;

      const threatIntel: ThreatIntelligence = {
        ipAddress,
        reputation,
        country,
        threatTypes,
        lastSeen: new Date(),
        confidence,
      };

      this.threatIntelligence.set(ipAddress, threatIntel);
      this.ipReputationCache.set(ipAddress, { reputation, timestamp: new Date() });

      return threatIntel;
    } catch (error) {
      logger.error('IP reputation check failed', {
        system: 'security',
        action: 'check_ip_reputation',
        category: 'threat-detection',
        ipAddress,
        error: (error as Error).message,
      });
      
      return {
        ipAddress,
        reputation: 'good',
        country: 'unknown',
        threatTypes: [],
        lastSeen: new Date(),
        confidence: 0,
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );
  }

  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private generateTOTPQRCode(email: string, secret: string): string {
    const issuer = 'ECONEURA-IA';
    const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    // Simplified TOTP verification - in production, use a proper TOTP library
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  private generateJWT(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
  }

  private async sendSMSVerification(phoneNumber: string, code: string): Promise<void> {
    // Simulate SMS sending
    logger.info('SMS verification code sent', {
      system: 'security',
      action: 'send_sms_verification',
      category: 'mfa',
      phoneNumber,
      code,
    });
  }

  private async sendEmailVerification(email: string, code: string): Promise<void> {
    // Simulate email sending
    logger.info('Email verification code sent', {
      system: 'security',
      action: 'send_email_verification',
      category: 'mfa',
      email,
      code,
    });
  }

  private checkBruteForceProtection(email: string, ipAddress: string): { allowed: boolean; attempts: number } {
    const key = `${email}:${ipAddress}`;
    const attempts = this.failedLoginAttempts.get(key);
    
    if (!attempts) {
      return { allowed: true, attempts: 0 };
    }

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    if (attempts.count >= maxAttempts && timeSinceLastAttempt < lockoutDuration) {
      return { allowed: false, attempts: attempts.count };
    }

    if (timeSinceLastAttempt >= lockoutDuration) {
      this.failedLoginAttempts.delete(key);
      return { allowed: true, attempts: 0 };
    }

    return { allowed: true, attempts: attempts.count };
  }

  private async recordFailedLogin(email: string, ipAddress: string): Promise<void> {
    const key = `${email}:${ipAddress}`;
    const attempts = this.failedLoginAttempts.get(key) || { count: 0, lastAttempt: new Date() };
    
    attempts.count++;
    attempts.lastAttempt = new Date();
    
    this.failedLoginAttempts.set(key, attempts);

    // Lock account after 5 failed attempts
    if (attempts.count >= 5) {
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (user) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        user.updatedAt = new Date();
        this.users.set(user.id, user);
      }
    }
  }

  private async analyzeThreatPatterns(event: SecurityEvent): Promise<void> {
    // Analyze recent events for patterns
    const recentEvents = this.securityEvents
      .filter(e => e.timestamp > new Date(Date.now() - 3600000)) // Last hour
      .filter(e => e.ipAddress === event.ipAddress);

    if (recentEvents.length > 10) {
      await this.logSecurityEvent({
        type: 'threat_detected',
        severity: 'high',
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: { 
          reason: 'high_frequency_events',
          eventCount: recentEvents.length,
          timeWindow: '1h'
        },
      });
    }
  }

  private setupDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: 'role_admin',
        name: 'admin',
        description: 'System administrator with full access',
        permissions: ['*'],
        orgId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role_user',
        name: 'user',
        description: 'Standard user with basic access',
        permissions: ['user:read', 'user:update'],
        orgId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  private setupDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      {
        id: 'perm_user_read',
        name: 'Read User',
        description: 'Read user information',
        resource: 'user',
        action: 'read',
        orgId: 'system',
        createdAt: new Date(),
      },
      {
        id: 'perm_user_update',
        name: 'Update User',
        description: 'Update user information',
        resource: 'user',
        action: 'update',
        orgId: 'system',
        createdAt: new Date(),
      },
      {
        id: 'perm_user_delete',
        name: 'Delete User',
        description: 'Delete user',
        resource: 'user',
        action: 'delete',
        orgId: 'system',
        createdAt: new Date(),
      },
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  private initializeSecurity(): void {
    logger.info('Security system initialized', {
      system: 'security',
      action: 'initialize',
      components: ['mfa', 'identity', 'api-security', 'audit', 'threat-detection'],
    });
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getMFAMethods(userId: string): Promise<MFAMethod[]> {
    return this.mfaMethods.get(userId) || [];
  }

  async getAPITokens(userId: string): Promise<APIToken[]> {
    return Array.from(this.apiTokens.values()).filter(t => t.userId === userId);
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogs.slice(-limit);
  }

  async getSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    return this.securityEvents.slice(-limit);
  }

  async getThreatIntelligence(ipAddress?: string): Promise<ThreatIntelligence[]> {
    if (ipAddress) {
      const threat = this.threatIntelligence.get(ipAddress);
      return threat ? [threat] : [];
    }
    return Array.from(this.threatIntelligence.values());
  }

  async getSecurityStats(): Promise<{
    totalUsers: number;
    mfaEnabledUsers: number;
    activeAPITokens: number;
    totalRoles: number;
    totalPermissions: number;
    auditLogsCount: number;
    securityEventsCount: number;
    threatIntelligenceCount: number;
  }> {
    const mfaEnabledUsers = Array.from(this.users.values()).filter(u => u.mfaEnabled).length;
    const activeAPITokens = Array.from(this.apiTokens.values()).filter(t => 
      !t.expiresAt || t.expiresAt > new Date()
    ).length;

    return {
      totalUsers: this.users.size,
      mfaEnabledUsers,
      activeAPITokens,
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      auditLogsCount: this.auditLogs.length,
      securityEventsCount: this.securityEvents.length,
      threatIntelligenceCount: this.threatIntelligence.size,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const advancedSecuritySystem = new AdvancedSecuritySystem();

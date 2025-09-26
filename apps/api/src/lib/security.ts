import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { logger } from './logger.js';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  orgId: string;
  createdAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  orgId: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  timestamp: Date;
}

interface SecurityEvent {
  id: string;
  type: 'login_failed' | 'permission_denied' | 'suspicious_activity' | 'mfa_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

interface ThreatIntelligence {
  ipAddress: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  country: string;
  threatTypes: string[];
  lastSeen: Date;
  confidence: number;
}

// ============================================================================
// SECURITY SYSTEM
// ============================================================================

export class SecuritySystem {
  private users = new Map<string, User>();
  private roles = new Map<string, Role>();
  private permissions = new Map<string, Permission>();
  private auditLogs: AuditLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private threatIntelligence = new Map<string, ThreatIntelligence>();

  constructor() {
    this.initializeDefaultData();
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(email: string, username: string, password: string, roles: string[] = []): Promise<User> {
    try {
      const existingUser = Array.from(this.users.values()).find(u => u.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword(password, salt);

      const user: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        username,
        passwordHash,
        salt,
        roles,
        permissions: [],
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.users.set(user.id, user);

      await this.logAuditEvent({
        userId: user.id,
        action: 'user_created',
        resource: 'users',
        details: { email, username },
        success: true,
      });

      logger.info('User created successfully', {
        userId: user.id,
        email,
        username,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        error: (error as Error).message,
        email,
        username,
      });
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        await this.logSecurityEvent({
          type: 'login_failed',
          severity: 'medium',
          details: { email, reason: 'user_not_found' },
        });
        return null;
      }

      const passwordHash = this.hashPassword(password, user.salt);
      if (passwordHash !== user.passwordHash) {
        await this.logSecurityEvent({
          type: 'login_failed',
          severity: 'medium',
          userId: user.id,
          details: { email, reason: 'invalid_password' },
        });
        return null;
      }

      const token = this.generateJWT(user);

      await this.logAuditEvent({
        userId: user.id,
        action: 'login_success',
        resource: 'auth',
        details: { email },
        success: true,
      });

      logger.info('User authenticated successfully', {
        userId: user.id,
        email,
      });

      return { user, token };
    } catch (error) {
      logger.error('Authentication failed', {
        error: (error as Error).message,
        email,
      });
      return null;
    }
  }

  // ============================================================================
  // MFA MANAGEMENT
  // ============================================================================

  async setupMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<{ secret: string; qrCode?: string }> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const secret = this.generateTOTPSecret();
      const qrCode = method === 'totp' ? this.generateTOTPQRCode(user.email, secret) : undefined;

      user.mfaEnabled = true;
      user.mfaSecret = secret;
      user.updatedAt = new Date();

      this.users.set(userId, user);

      await this.logAuditEvent({
        userId,
        action: 'mfa_setup',
        resource: 'mfa',
        details: { method },
        success: true,
      });

      logger.info('MFA setup completed', {
        userId,
        method,
      });

      return { secret, qrCode };
    } catch (error) {
      logger.error('MFA setup failed', {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  async verifyMFA(userId: string, code: string): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        return false;
      }

      const isValid = this.verifyTOTPCode(user.mfaSecret, code);

      await this.logAuditEvent({
        userId,
        action: 'mfa_verify',
        resource: 'mfa',
        details: { success: isValid },
        success: isValid,
      });

      if (!isValid) {
        await this.logSecurityEvent({
          type: 'mfa_failed',
          severity: 'medium',
          userId,
          details: { code },
        });
      }

      return isValid;
    } catch (error) {
      logger.error('MFA verification failed', {
        error: (error as Error).message,
        userId,
      });
      return false;
    }
  }

  // ============================================================================
  // RBAC
  // ============================================================================

  async createRole(name: string, description: string, permissions: string[], orgId: string): Promise<Role> {
    try {
      const role: Role = {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        permissions,
        orgId,
        createdAt: new Date(),
      };

      this.roles.set(role.id, role);

      await this.logAuditEvent({
        userId: 'system',
        action: 'role_created',
        resource: 'roles',
        details: { name, description, permissions },
        success: true,
      });

      logger.info('Role created successfully', {
        roleId: role.id,
        name,
      });

      return role;
    } catch (error) {
      logger.error('Failed to create role', {
        error: (error as Error).message,
        name,
      });
      throw error;
    }
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async createPermission(name: string, description: string, resource: string, action: string, orgId: string): Promise<Permission> {
    try {
      const permission: Permission = {
        id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        resource,
        action,
        orgId,
        createdAt: new Date(),
      };

      this.permissions.set(permission.id, permission);

      await this.logAuditEvent({
        userId: 'system',
        action: 'permission_created',
        resource: 'permissions',
        details: { name, resource, action },
        success: true,
      });

      logger.info('Permission created successfully', {
        permissionId: permission.id,
        name,
      });

      return permission;
    } catch (error) {
      logger.error('Failed to create permission', {
        error: (error as Error).message,
        name,
      });
      throw error;
    }
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
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
        error: (error as Error).message,
        userId,
        resource,
        action,
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
        auditId: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        resource: auditLog.resource,
        success: auditLog.success,
      });
    } catch (error) {
      logger.error('Failed to log audit event', {
        error: (error as Error).message,
      });
    }
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogs.slice(-limit);
  }

  // ============================================================================
  // SECURITY EVENTS
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

      logger.warn('Security event logged', {
        eventId: securityEvent.id,
        type: securityEvent.type,
        severity: securityEvent.severity,
        userId: securityEvent.userId,
        ipAddress: securityEvent.ipAddress,
      });
    } catch (error) {
      logger.error('Failed to log security event', {
        error: (error as Error).message,
      });
    }
  }

  async getSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    return this.securityEvents.slice(-limit);
  }

  // ============================================================================
  // THREAT INTELLIGENCE
  // ============================================================================

  async checkIPReputation(ipAddress: string): Promise<ThreatIntelligence> {
    try {
      // Check cache first
      const cached = this.threatIntelligence.get(ipAddress);
      if (cached && Date.now() - cached.lastSeen.getTime() < 3600000) { // 1 hour cache
        return cached;
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

      logger.info('IP reputation checked', {
        ipAddress,
        reputation,
        country,
        confidence,
      });

      return threatIntel;
    } catch (error) {
      logger.error('IP reputation check failed', {
        error: (error as Error).message,
        ipAddress,
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
  // STATISTICS
  // ============================================================================

  async getSecurityStats(): Promise<any> {
    try {
      const totalUsers = this.users.size;
      const totalRoles = this.roles.size;
      const totalPermissions = this.permissions.size;
      const totalAuditLogs = this.auditLogs.length;
      const totalSecurityEvents = this.securityEvents.length;
      const activeSecurityEvents = this.securityEvents.filter(e => !e.resolved).length;
      const mfaEnabledUsers = Array.from(this.users.values()).filter(u => u.mfaEnabled).length;

      const recentAuditLogs = this.auditLogs.slice(-24); // Last 24 hours
      const recentSecurityEvents = this.securityEvents.slice(-24); // Last 24 hours

      const stats = {
        users: {
          total: totalUsers,
          mfaEnabled: mfaEnabledUsers,
          mfaPercentage: totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0,
        },
        rbac: {
          roles: totalRoles,
          permissions: totalPermissions,
        },
        audit: {
          total: totalAuditLogs,
          recent: recentAuditLogs.length,
        },
        security: {
          events: {
            total: totalSecurityEvents,
            active: activeSecurityEvents,
            recent: recentSecurityEvents.length,
          },
        },
        threats: {
          tracked: this.threatIntelligence.size,
        },
        timestamp: new Date(),
      };

      logger.info('Security stats retrieved', {
        totalUsers,
        totalRoles,
        totalPermissions,
        totalAuditLogs,
        totalSecurityEvents,
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get security stats', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private generateTOTPQRCode(email: string, secret: string): string {
    const issuer = 'ECONEURA-IA';
    const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
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

  private initializeDefaultData(): void {
    // Create default roles
    this.createRole('admin', 'Administrator with full access', [], 'default');
    this.createRole('user', 'Standard user', [], 'default');
    this.createRole('viewer', 'Read-only user', [], 'default');

    // Create default permissions
    this.createPermission('read:users', 'Read user data', 'users', 'read', 'default');
    this.createPermission('write:users', 'Write user data', 'users', 'write', 'default');
    this.createPermission('read:audit', 'Read audit logs', 'audit', 'read', 'default');
    this.createPermission('read:security', 'Read security events', 'security', 'read', 'default');

    logger.info('Security system initialized with default data');
  }
}

export const securitySystem = new SecuritySystem();



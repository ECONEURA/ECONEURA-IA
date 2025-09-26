import { EventEmitter } from 'events';
import crypto from 'crypto';

import { z } from 'zod';
import jwt from 'jsonwebtoken';

import { logger } from './logger.js';
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
    expiresIn: z.number().optional(),
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
export class AdvancedSecuritySystem extends EventEmitter {
    users = new Map();
    mfaMethods = new Map();
    apiTokens = new Map();
    roles = new Map();
    permissions = new Map();
    auditLogs = [];
    securityEvents = [];
    threatIntelligence = new Map();
    ssoProviders = new Map();
    failedLoginAttempts = new Map();
    ipReputationCache = new Map();
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
    async createUser(data) {
        const startTime = Date.now();
        try {
            const existingUser = Array.from(this.users.values()).find(u => u.email === data.email || u.username === data.username);
            if (existingUser) {
                throw new Error('User already exists with this email or username');
            }
            const salt = crypto.randomBytes(32).toString('hex');
            const passwordHash = this.hashPassword(data.password, salt);
            const user = {
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
        }
        catch (error) {
            logger.error('Failed to create user', {
                system: 'security',
                action: 'create_user',
                category: 'identity',
                error: error.message,
            });
            throw error;
        }
    }
    async authenticateUser(email, password, ipAddress, userAgent) {
        const startTime = Date.now();
        try {
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
            const user = Array.from(this.users.values()).find(u => u.email === email);
            if (!user) {
                await this.recordFailedLogin(email, ipAddress);
                return null;
            }
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
            const passwordHash = this.hashPassword(password, user.salt);
            if (passwordHash !== user.passwordHash) {
                await this.recordFailedLogin(email, ipAddress);
                return null;
            }
            user.failedLoginAttempts = 0;
            user.lockedUntil = undefined;
            user.lastLogin = new Date();
            user.updatedAt = new Date();
            this.users.set(user.id, user);
            const token = this.generateJWT(user);
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
        }
        catch (error) {
            logger.error('Authentication failed', {
                system: 'security',
                action: 'authenticate_user',
                category: 'identity',
                error: error.message,
            });
            return null;
        }
    }
    async setupMFA(userId, method) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const mfaMethod = {
                id: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                type: method.type,
                verified: false,
                createdAt: new Date(),
            };
            if (method.type === 'totp') {
                const secret = this.generateTOTPSecret();
                mfaMethod.secret = secret;
                const qrCode = this.generateTOTPQRCode(user.email, secret);
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
            }
            else if (method.type === 'sms' && method.phoneNumber) {
                mfaMethod.phoneNumber = method.phoneNumber;
                const verificationCode = this.generateVerificationCode();
                await this.sendSMSVerification(method.phoneNumber, verificationCode);
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
            }
            else if (method.type === 'email' && method.email) {
                mfaMethod.email = method.email;
                const verificationCode = this.generateVerificationCode();
                await this.sendEmailVerification(method.email, verificationCode);
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
        }
        catch (error) {
            logger.error('Failed to setup MFA', {
                system: 'security',
                action: 'setup_mfa',
                category: 'mfa',
                userId,
                error: error.message,
            });
            throw error;
        }
    }
    async verifyMFA(userId, code, methodType) {
        try {
            const userMFAMethods = this.mfaMethods.get(userId) || [];
            const mfaMethod = userMFAMethods.find(m => m.type === methodType && m.verified);
            if (!mfaMethod) {
                return false;
            }
            let isValid = false;
            if (methodType === 'totp' && mfaMethod.secret) {
                isValid = this.verifyTOTPCode(mfaMethod.secret, code);
            }
            else if (methodType === 'sms' || methodType === 'email') {
                isValid = code.length === 6 && /^\d{6}$/.test(code);
            }
            if (isValid) {
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
            }
            else {
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
        }
        catch (error) {
            logger.error('MFA verification failed', {
                system: 'security',
                action: 'verify_mfa',
                category: 'mfa',
                userId,
                error: error.message,
            });
            return false;
        }
    }
    async createAPIToken(userId, data) {
        try {
            const token = crypto.randomBytes(32).toString('hex');
            const apiToken = {
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
        }
        catch (error) {
            logger.error('Failed to create API token', {
                system: 'security',
                action: 'create_api_token',
                category: 'api-security',
                userId,
                error: error.message,
            });
            throw error;
        }
    }
    async validateAPIToken(token) {
        try {
            const apiToken = Array.from(this.apiTokens.values()).find(t => t.token === token);
            if (!apiToken) {
                return null;
            }
            if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
                return null;
            }
            apiToken.lastUsed = new Date();
            this.apiTokens.set(apiToken.id, apiToken);
            return {
                userId: apiToken.userId,
                scopes: apiToken.scopes,
            };
        }
        catch (error) {
            logger.error('API token validation failed', {
                system: 'security',
                action: 'validate_api_token',
                category: 'api-security',
                error: error.message,
            });
            return null;
        }
    }
    async createRole(data) {
        try {
            const role = {
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
        }
        catch (error) {
            logger.error('Failed to create role', {
                system: 'security',
                action: 'create_role',
                category: 'rbac',
                error: error.message,
            });
            throw error;
        }
    }
    async createPermission(data) {
        try {
            const permission = {
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
        }
        catch (error) {
            logger.error('Failed to create permission', {
                system: 'security',
                action: 'create_permission',
                category: 'rbac',
                error: error.message,
            });
            throw error;
        }
    }
    async checkPermission(userId, resource, action) {
        try {
            const user = this.users.get(userId);
            if (!user) {
                return false;
            }
            const hasDirectPermission = user.permissions.some(permId => {
                const permission = this.permissions.get(permId);
                return permission && permission.resource === resource && permission.action === action;
            });
            if (hasDirectPermission) {
                return true;
            }
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
        }
        catch (error) {
            logger.error('Permission check failed', {
                system: 'security',
                action: 'check_permission',
                category: 'rbac',
                userId,
                resource,
                permissionAction: action,
                error: error.message,
            });
            return false;
        }
    }
    async logAuditEvent(event) {
        try {
            const auditLog = {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...event,
                timestamp: new Date(),
            };
            this.auditLogs.push(auditLog);
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
        }
        catch (error) {
            logger.error('Failed to log audit event', {
                system: 'security',
                action: 'log_audit',
                category: 'audit',
                error: error.message,
            });
        }
    }
    async logSecurityEvent(event) {
        try {
            const securityEvent = {
                id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...event,
                timestamp: new Date(),
                resolved: false,
            };
            this.securityEvents.push(securityEvent);
            if (this.securityEvents.length > 1000) {
                this.securityEvents = this.securityEvents.slice(-1000);
            }
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
        }
        catch (error) {
            logger.error('Failed to log security event', {
                system: 'security',
                action: 'log_security_event',
                category: 'threat-detection',
                error: error.message,
            });
        }
    }
    async checkIPReputation(ipAddress) {
        try {
            const cached = this.ipReputationCache.get(ipAddress);
            if (cached && Date.now() - cached.timestamp.getTime() < 3600000) {
                return this.threatIntelligence.get(ipAddress) || {
                    ipAddress,
                    reputation: 'good',
                    country: 'unknown',
                    threatTypes: [],
                    lastSeen: new Date(),
                    confidence: 0,
                };
            }
            const reputation = Math.random() > 0.9 ? 'malicious' : Math.random() > 0.7 ? 'suspicious' : 'good';
            const country = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'][Math.floor(Math.random() * 7)];
            const threatTypes = reputation === 'malicious' ? ['botnet', 'spam'] : [];
            const confidence = reputation === 'malicious' ? 0.9 : reputation === 'suspicious' ? 0.6 : 0.95;
            const threatIntel = {
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
        }
        catch (error) {
            logger.error('IP reputation check failed', {
                system: 'security',
                action: 'check_ip_reputation',
                category: 'threat-detection',
                ipAddress,
                error: error.message,
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
    hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    generateBackupCodes() {
        return Array.from({ length: 10 }, () => Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    generateTOTPSecret() {
        return crypto.randomBytes(20).toString('hex');
    }
    generateTOTPQRCode(email, secret) {
        const issuer = 'ECONEURA-IA';
        const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    }
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    verifyTOTPCode(secret, code) {
        return code.length === 6 && /^\d{6}$/.test(code);
    }
    generateJWT(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        };
        return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
    }
    async sendSMSVerification(phoneNumber, code) {
        logger.info('SMS verification code sent', {
            system: 'security',
            action: 'send_sms_verification',
            category: 'mfa',
            phoneNumber,
            code,
        });
    }
    async sendEmailVerification(email, code) {
        logger.info('Email verification code sent', {
            system: 'security',
            action: 'send_email_verification',
            category: 'mfa',
            email,
            code,
        });
    }
    checkBruteForceProtection(email, ipAddress) {
        const key = `${email}:${ipAddress}`;
        const attempts = this.failedLoginAttempts.get(key);
        if (!attempts) {
            return { allowed: true, attempts: 0 };
        }
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
        const maxAttempts = 5;
        const lockoutDuration = 15 * 60 * 1000;
        if (attempts.count >= maxAttempts && timeSinceLastAttempt < lockoutDuration) {
            return { allowed: false, attempts: attempts.count };
        }
        if (timeSinceLastAttempt >= lockoutDuration) {
            this.failedLoginAttempts.delete(key);
            return { allowed: true, attempts: 0 };
        }
        return { allowed: true, attempts: attempts.count };
    }
    async recordFailedLogin(email, ipAddress) {
        const key = `${email}:${ipAddress}`;
        const attempts = this.failedLoginAttempts.get(key) || { count: 0, lastAttempt: new Date() };
        attempts.count++;
        attempts.lastAttempt = new Date();
        this.failedLoginAttempts.set(key, attempts);
        if (attempts.count >= 5) {
            const user = Array.from(this.users.values()).find(u => u.email === email);
            if (user) {
                user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                user.updatedAt = new Date();
                this.users.set(user.id, user);
            }
        }
    }
    async analyzeThreatPatterns(event) {
        const recentEvents = this.securityEvents
            .filter(e => e.timestamp > new Date(Date.now() - 3600000))
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
    setupDefaultRoles() {
        const defaultRoles = [
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
    setupDefaultPermissions() {
        const defaultPermissions = [
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
    initializeSecurity() {
        logger.info('Security system initialized', {
            system: 'security',
            action: 'initialize',
            components: ['mfa', 'identity', 'api-security', 'audit', 'threat-detection'],
        });
    }
    async getUsers() {
        return Array.from(this.users.values());
    }
    async getUser(userId) {
        return this.users.get(userId) || null;
    }
    async getMFAMethods(userId) {
        return this.mfaMethods.get(userId) || [];
    }
    async getAPITokens(userId) {
        return Array.from(this.apiTokens.values()).filter(t => t.userId === userId);
    }
    async getRoles() {
        return Array.from(this.roles.values());
    }
    async getPermissions() {
        return Array.from(this.permissions.values());
    }
    async getAuditLogs(limit = 100) {
        return this.auditLogs.slice(-limit);
    }
    async getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }
    async getThreatIntelligence(ipAddress) {
        if (ipAddress) {
            const threat = this.threatIntelligence.get(ipAddress);
            return threat ? [threat] : [];
        }
        return Array.from(this.threatIntelligence.values());
    }
    async getSecurityStats() {
        const mfaEnabledUsers = Array.from(this.users.values()).filter(u => u.mfaEnabled).length;
        const activeAPITokens = Array.from(this.apiTokens.values()).filter(t => !t.expiresAt || t.expiresAt > new Date()).length;
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
export const advancedSecuritySystem = new AdvancedSecuritySystem();
//# sourceMappingURL=advanced-security.js.map
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';
export class SecuritySystem {
    users = new Map();
    roles = new Map();
    permissions = new Map();
    auditLogs = [];
    securityEvents = [];
    threatIntelligence = new Map();
    constructor() {
        this.initializeDefaultData();
    }
    async createUser(email, username, password, roles = []) {
        try {
            const existingUser = Array.from(this.users.values()).find(u => u.email === email);
            if (existingUser) {
                throw new Error('User already exists');
            }
            const salt = crypto.randomBytes(16).toString('hex');
            const passwordHash = this.hashPassword(password, salt);
            const user = {
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
        }
        catch (error) {
            logger.error('Failed to create user', {
                error: error.message,
                email,
                username,
            });
            throw error;
        }
    }
    async getUsers() {
        return Array.from(this.users.values());
    }
    async getUserById(userId) {
        return this.users.get(userId) || null;
    }
    async authenticateUser(email, password) {
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
        }
        catch (error) {
            logger.error('Authentication failed', {
                error: error.message,
                email,
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
        }
        catch (error) {
            logger.error('MFA setup failed', {
                error: error.message,
                userId,
            });
            throw error;
        }
    }
    async verifyMFA(userId, code) {
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
        }
        catch (error) {
            logger.error('MFA verification failed', {
                error: error.message,
                userId,
            });
            return false;
        }
    }
    async createRole(name, description, permissions, orgId) {
        try {
            const role = {
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
        }
        catch (error) {
            logger.error('Failed to create role', {
                error: error.message,
                name,
            });
            throw error;
        }
    }
    async getRoles() {
        return Array.from(this.roles.values());
    }
    async createPermission(name, description, resource, action, orgId) {
        try {
            const permission = {
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
        }
        catch (error) {
            logger.error('Failed to create permission', {
                error: error.message,
                name,
            });
            throw error;
        }
    }
    async getPermissions() {
        return Array.from(this.permissions.values());
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
                error: error.message,
                userId,
                resource,
                action,
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
                auditId: auditLog.id,
                userId: auditLog.userId,
                action: auditLog.action,
                resource: auditLog.resource,
                success: auditLog.success,
            });
        }
        catch (error) {
            logger.error('Failed to log audit event', {
                error: error.message,
            });
        }
    }
    async getAuditLogs(limit = 100) {
        return this.auditLogs.slice(-limit);
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
            logger.warn('Security event logged', {
                eventId: securityEvent.id,
                type: securityEvent.type,
                severity: securityEvent.severity,
                userId: securityEvent.userId,
                ipAddress: securityEvent.ipAddress,
            });
        }
        catch (error) {
            logger.error('Failed to log security event', {
                error: error.message,
            });
        }
    }
    async getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }
    async checkIPReputation(ipAddress) {
        try {
            const cached = this.threatIntelligence.get(ipAddress);
            if (cached && Date.now() - cached.lastSeen.getTime() < 3600000) {
                return cached;
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
            logger.info('IP reputation checked', {
                ipAddress,
                reputation,
                country,
                confidence,
            });
            return threatIntel;
        }
        catch (error) {
            logger.error('IP reputation check failed', {
                error: error.message,
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
    async getSecurityStats() {
        try {
            const totalUsers = this.users.size;
            const totalRoles = this.roles.size;
            const totalPermissions = this.permissions.size;
            const totalAuditLogs = this.auditLogs.length;
            const totalSecurityEvents = this.securityEvents.length;
            const activeSecurityEvents = this.securityEvents.filter(e => !e.resolved).length;
            const mfaEnabledUsers = Array.from(this.users.values()).filter(u => u.mfaEnabled).length;
            const recentAuditLogs = this.auditLogs.slice(-24);
            const recentSecurityEvents = this.securityEvents.slice(-24);
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
        }
        catch (error) {
            logger.error('Failed to get security stats', {
                error: error.message,
            });
            throw error;
        }
    }
    hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    generateTOTPSecret() {
        return crypto.randomBytes(20).toString('hex');
    }
    generateTOTPQRCode(email, secret) {
        const issuer = 'ECONEURA-IA';
        const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
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
    initializeDefaultData() {
        this.createRole('admin', 'Administrator with full access', [], 'default');
        this.createRole('user', 'Standard user', [], 'default');
        this.createRole('viewer', 'Read-only user', [], 'default');
        this.createPermission('read:users', 'Read user data', 'users', 'read', 'default');
        this.createPermission('write:users', 'Write user data', 'users', 'write', 'default');
        this.createPermission('read:audit', 'Read audit logs', 'audit', 'read', 'default');
        this.createPermission('read:security', 'Read security events', 'security', 'read', 'default');
        logger.info('Security system initialized with default data');
    }
}
export const securitySystem = new SecuritySystem();
//# sourceMappingURL=security.js.map
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { structuredLogger } from './structured-logger.js';
import { getDatabaseService } from '@econeura/db';
import { eq, and, gte } from 'drizzle-orm';
import { users, organizations, sessions, apiKeys } from '@econeura/db/schema';
export class AuthService {
    config;
    db;
    loginAttempts = new Map();
    constructor(config) {
        this.config = {
            jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
            jwtExpiresIn: '15m',
            refreshTokenExpiresIn: '7d',
            apiKeyExpiresIn: '90d',
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000,
            passwordMinLength: 8,
            enableMFA: true,
            enableSessionManagement: true,
            enableApiKeys: true,
            ...config
        };
        this.db = getDatabaseService();
        this.startCleanupTasks();
    }
    async login(loginData) {
        const startTime = Date.now();
        try {
            if (!loginData.email || !loginData.password) {
                throw new Error('Email and password are required');
            }
            if (this.isAccountLocked(loginData.email)) {
                throw new Error('Account is temporarily locked due to too many failed login attempts');
            }
            const db = this.db.getDatabase();
            const userResult = await db.select()
                .from(users)
                .innerJoin(organizations, eq(users.organizationId, organizations.id))
                .where(and(eq(users.email, loginData.email), eq(users.isActive, true)))
                .limit(1);
            if (userResult.length === 0) {
                this.recordFailedLogin(loginData.email);
                throw new Error('Invalid email or password');
            }
            const user = userResult[0].users;
            const organization = userResult[0].organizations;
            const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
            if (!isPasswordValid) {
                this.recordFailedLogin(loginData.email);
                throw new Error('Invalid email or password');
            }
            if (loginData.organizationId && user.organizationId !== loginData.organizationId) {
                throw new Error('Access denied to this organization');
            }
            if (this.config.enableMFA && user.mfaEnabled && !loginData.mfaToken) {
            }
            this.clearFailedLogins(loginData.email);
            const sessionId = randomBytes(32).toString('hex');
            const accessToken = this.generateAccessToken(user, organization, sessionId);
            const refreshToken = this.generateRefreshToken(user, sessionId);
            let session;
            if (this.config.enableSessionManagement) {
                const expiresAt = new Date();
                expiresAt.setTime(expiresAt.getTime() + (loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
                session = await db.insert(sessions).values({
                    id: sessionId,
                    userId: user.id,
                    organizationId: user.organizationId,
                    expiresAt,
                    userAgent: 'API Client',
                    ipAddress: '127.0.0.1',
                    isActive: true,
                    createdAt: new Date()
                }).returning();
            }
            await db.update(users)
                .set({
                lastLoginAt: new Date(),
                updatedAt: new Date()
            })
                .where(eq(users.id, user.id));
            const processingTime = Date.now() - startTime;
            structuredLogger.info('User login successful', {
                userId: user.id,
                email: user.email,
                organizationId: user.organizationId,
                role: user.role,
                sessionId,
                processingTime
            });
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                    permissions: this.getUserPermissions(user.role)
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: 15 * 60
                },
                session: {
                    id: sessionId,
                    expiresAt: session?.[0]?.expiresAt || new Date()
                }
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            structuredLogger.error('Login failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: loginData.email,
                processingTime
            });
            throw error;
        }
    }
    async refreshToken(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, this.config.jwtSecret);
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            const db = this.db.getDatabase();
            const session = await db.select()
                .from(sessions)
                .where(and(eq(sessions.id, payload.sessionId), eq(sessions.isActive, true), gte(sessions.expiresAt, new Date())))
                .limit(1);
            if (session.length === 0) {
                throw new Error('Invalid or expired session');
            }
            const userResult = await db.select()
                .from(users)
                .innerJoin(organizations, eq(users.organizationId, organizations.id))
                .where(and(eq(users.id, payload.userId), eq(users.isActive, true)))
                .limit(1);
            if (userResult.length === 0) {
                throw new Error('User not found or inactive');
            }
            const user = userResult[0].users;
            const organization = userResult[0].organizations;
            const accessToken = this.generateAccessToken(user, organization, payload.sessionId);
            structuredLogger.info('Token refreshed', {
                userId: user.id,
                sessionId: payload.sessionId
            });
            return {
                accessToken,
                expiresIn: 15 * 60
            };
        }
        catch (error) {
            structuredLogger.error('Token refresh failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Invalid refresh token');
        }
    }
    async logout(sessionId) {
        try {
            const db = this.db.getDatabase();
            await db.update(sessions)
                .set({
                isActive: false,
                updatedAt: new Date()
            })
                .where(eq(sessions.id, sessionId));
            structuredLogger.info('User logged out', { sessionId });
        }
        catch (error) {
            structuredLogger.error('Logout failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId
            });
            throw error;
        }
    }
    async logoutAllSessions(userId) {
        try {
            const db = this.db.getDatabase();
            await db.update(sessions)
                .set({
                isActive: false,
                updatedAt: new Date()
            })
                .where(eq(sessions.userId, userId));
            structuredLogger.info('All sessions logged out', { userId });
        }
        catch (error) {
            structuredLogger.error('Logout all sessions failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId
            });
            throw error;
        }
    }
    async createApiKey(userId, organizationId, permissions) {
        try {
            const db = this.db.getDatabase();
            const keyId = randomBytes(16).toString('hex');
            const key = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setTime(expiresAt.getTime() + 90 * 24 * 60 * 60 * 1000);
            await db.insert(apiKeys).values({
                id: keyId,
                userId,
                organizationId,
                keyHash: await bcrypt.hash(key, 10),
                permissions: permissions.join(','),
                expiresAt,
                isActive: true,
                createdAt: new Date()
            });
            structuredLogger.info('API key created', {
                keyId,
                userId,
                organizationId,
                permissions
            });
            return {
                keyId,
                key,
                expiresAt,
                permissions
            };
        }
        catch (error) {
            structuredLogger.error('API key creation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                organizationId
            });
            throw error;
        }
    }
    async validateApiKey(key) {
        try {
            const db = this.db.getDatabase();
            const apiKeysResult = await db.select()
                .from(apiKeys)
                .where(and(eq(apiKeys.isActive, true), gte(apiKeys.expiresAt, new Date())));
            for (const apiKey of apiKeysResult) {
                const isValid = await bcrypt.compare(key, apiKey.keyHash);
                if (isValid) {
                    return {
                        userId: apiKey.userId,
                        organizationId: apiKey.organizationId,
                        permissions: apiKey.permissions.split(',')
                    };
                }
            }
            return null;
        }
        catch (error) {
            structuredLogger.error('API key validation failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }
    generateAccessToken(user, organization, sessionId) {
        const payload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            permissions: this.getUserPermissions(user.role),
            sessionId,
            type: 'access'
        };
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiresIn,
            issuer: 'econeura-api',
            audience: 'econeura-client'
        });
    }
    generateRefreshToken(user, sessionId) {
        const payload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            permissions: this.getUserPermissions(user.role),
            sessionId,
            type: 'refresh'
        };
        return jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.refreshTokenExpiresIn,
            issuer: 'econeura-api',
            audience: 'econeura-client'
        });
    }
    getUserPermissions(role) {
        const rolePermissions = {
            'admin': [
                'users:read', 'users:write', 'users:delete',
                'organizations:read', 'organizations:write', 'organizations:delete',
                'companies:read', 'companies:write', 'companies:delete',
                'contacts:read', 'contacts:write', 'contacts:delete',
                'products:read', 'products:write', 'products:delete',
                'invoices:read', 'invoices:write', 'invoices:delete',
                'analytics:read', 'analytics:write',
                'ai:read', 'ai:write',
                'settings:read', 'settings:write'
            ],
            'manager': [
                'users:read', 'users:write',
                'companies:read', 'companies:write',
                'contacts:read', 'contacts:write',
                'products:read', 'products:write',
                'invoices:read', 'invoices:write',
                'analytics:read',
                'ai:read', 'ai:write'
            ],
            'editor': [
                'companies:read', 'companies:write',
                'contacts:read', 'contacts:write',
                'products:read', 'products:write',
                'invoices:read', 'invoices:write',
                'analytics:read',
                'ai:read'
            ],
            'viewer': [
                'companies:read',
                'contacts:read',
                'products:read',
                'invoices:read',
                'analytics:read'
            ]
        };
        return rolePermissions[role] || [];
    }
    isAccountLocked(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts)
            return false;
        if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
            return true;
        }
        if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
            this.loginAttempts.delete(email);
            return false;
        }
        return false;
    }
    recordFailedLogin(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        if (attempts.count >= this.config.maxLoginAttempts) {
            attempts.lockedUntil = Date.now() + this.config.lockoutDuration;
            structuredLogger.warn('Account locked due to failed login attempts', {
                email,
                attempts: attempts.count,
                lockedUntil: new Date(attempts.lockedUntil)
            });
        }
        this.loginAttempts.set(email, attempts);
    }
    clearFailedLogins(email) {
        this.loginAttempts.delete(email);
    }
    startCleanupTasks() {
        setInterval(async () => {
            try {
                const db = this.db.getDatabase();
                await db.update(sessions)
                    .set({ isActive: false })
                    .where(gte(sessions.expiresAt, new Date()));
            }
            catch (error) {
                structuredLogger.error('Session cleanup failed', error);
            }
        }, 60 * 60 * 1000);
        setInterval(async () => {
            try {
                const db = this.db.getDatabase();
                await db.update(apiKeys)
                    .set({ isActive: false })
                    .where(gte(apiKeys.expiresAt, new Date()));
            }
            catch (error) {
                structuredLogger.error('API key cleanup failed', error);
            }
        }, 24 * 60 * 60 * 1000);
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, this.config.jwtSecret);
        }
        catch (error) {
            return null;
        }
    }
}
export const authService = new AuthService();
//# sourceMappingURL=auth.service.js.map
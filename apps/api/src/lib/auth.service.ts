import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { structuredLogger } from './structured-logger.js';
// MOCK: getDatabaseService
function getDatabaseService() {
  return {
    getDatabase: () => ({
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: () => []
            })
          })
        })
      }),
      insert: () => ({ values: () => ({ returning: () => [{ expiresAt: new Date() }] }) }),
      update: () => ({ set: () => ({ where: () => ({}) }) })
    })
  };
}
// MOCK: eq, and, gte
function eq(a: any, b: any) { return true; }
function and(...args: any[]) { return true; }
function gte(a: any, b: any) { return true; }
// MOCK: users, organizations, sessions, apiKeys
const users = {};
const organizations = {};
const sessions = {};
const apiKeys = {};

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  apiKeyExpiresIn: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  enableMFA: boolean;
  enableSessionManagement: boolean;
  enableApiKeys: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
  rememberMe?: boolean;
  mfaToken?: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

interface TokenPayload {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

interface ApiKeyResponse {
  keyId: string;
  key: string;
  expiresAt: Date;
  permissions: string[];
}

export class AuthService {
  private config: AuthConfig;
  private db: ReturnType<typeof getDatabaseService>;
  private loginAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      jwtExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
      apiKeyExpiresIn: '90d',
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 8,
      enableMFA: true,
      enableSessionManagement: true,
      enableApiKeys: true,
      ...config
    };

    this.db = getDatabaseService();
    this.startCleanupTasks();
  }

  // ========================================================================
  // AUTHENTICATION METHODS
  // ========================================================================

  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!loginData.email || !loginData.password) {
        throw new Error('Email and password are required');
      }

      // Check for account lockout
      if (this.isAccountLocked(loginData.email)) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Find user
      const db = this.db.getDatabase();
      const userResult = await db.select()
        .from(users)
        .innerJoin(organizations, eq(users.organizationId, organizations.id))
        .where(and(
          eq(users.email, loginData.email),
          eq(users.isActive, true)
        ))
        .limit(1);

      if (userResult.length === 0) {
        this.recordFailedLogin(loginData.email);
        throw new Error('Invalid email or password');
      }

      const user = userResult[0].users;
      const organization = userResult[0].organizations;

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        this.recordFailedLogin(loginData.email);
        throw new Error('Invalid email or password');
      }

      // Check organization access
      if (loginData.organizationId && user.organizationId !== loginData.organizationId) {
        throw new Error('Access denied to this organization');
      }

      // MFA verification (if enabled)
      if (this.config.enableMFA && user.mfaEnabled && !loginData.mfaToken) {
        // In a real implementation, you would verify the MFA token here
        // For now, we'll skip MFA verification
      }

      // Clear failed login attempts
      this.clearFailedLogins(loginData.email);

      // Generate tokens
      const sessionId = randomBytes(32).toString('hex');
      const accessToken = this.generateAccessToken(user, organization, sessionId);
      const refreshToken = this.generateRefreshToken(user, sessionId);

      // Create session
      let session;
      if (this.config.enableSessionManagement) {
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + (loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)); // 30 days or 1 day

        session = await db.insert(sessions).values({
          id: sessionId,
          userId: user.id,
          organizationId: user.organizationId,
          expiresAt,
          userAgent: 'API Client', // In real implementation, get from request
          ipAddress: '127.0.0.1', // In real implementation, get from request
          isActive: true,
          createdAt: new Date()
        }).returning();
      }

      // Update last login
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
          expiresIn: 15 * 60 // 15 minutes in seconds
        },
        session: {
          id: sessionId,
          expiresAt: session?.[0]?.expiresAt || new Date()
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      structuredLogger.error('Login failed', {
  message: error instanceof Error ? error.message : 'Unknown error',
        email: loginData.email,
        processingTime
      });

      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.config.jwtSecret) as TokenPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if session exists and is active
      const db = this.db.getDatabase();
      const session = await db.select()
        .from(sessions)
        .where(and(
          eq(sessions.id, payload.sessionId),
          eq(sessions.isActive, true),
          gte(sessions.expiresAt, new Date())
        ))
        .limit(1);

      if (session.length === 0) {
        throw new Error('Invalid or expired session');
      }

      // Get user and organization
      const userResult = await db.select()
        .from(users)
        .innerJoin(organizations, eq(users.organizationId, organizations.id))
        .where(and(
          eq(users.id, payload.userId),
          eq(users.isActive, true)
        ))
        .limit(1);

      if (userResult.length === 0) {
        throw new Error('User not found or inactive');
      }

      const user = userResult[0].users;
      const organization = userResult[0].organizations;

      // Generate new access token
      const accessToken = this.generateAccessToken(user, organization, payload.sessionId);

      structuredLogger.info('Token refreshed', {
        userId: user.id,
        sessionId: payload.sessionId
      });

      return {
        accessToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };

    } catch (error) {
      structuredLogger.error('Token refresh failed', {
  message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      const db = this.db.getDatabase();
      
      // Deactivate session
      await db.update(sessions)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionId));

      structuredLogger.info('User logged out', { sessionId });

    } catch (error) {
      structuredLogger.error('Logout failed', {
  message: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    try {
      const db = this.db.getDatabase();
      
      // Deactivate all user sessions
      await db.update(sessions)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(sessions.userId, userId));

      structuredLogger.info('All sessions logged out', { userId });

    } catch (error) {
      structuredLogger.error('Logout all sessions failed', {
  message: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  // ========================================================================
  // API KEY MANAGEMENT
  // ========================================================================

  async createApiKey(userId: string, organizationId: string, permissions: string[]): Promise<ApiKeyResponse> {
    try {
      const db = this.db.getDatabase();
      
      const keyId = randomBytes(16).toString('hex');
      const key = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

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

    } catch (error) {
      structuredLogger.error('API key creation failed', {
  message: error instanceof Error ? error.message : 'Unknown error',
        userId,
        organizationId
      });
      throw error;
    }
  }

  async validateApiKey(key: string): Promise<{ userId: string; organizationId: string; permissions: string[] } | null> {
    try {
      const db = this.db.getDatabase();
      
      const apiKeysResult = await db.select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.isActive, true),
          gte(apiKeys.expiresAt, new Date())
        ));

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

    } catch (error) {
      structuredLogger.error('API key validation failed', {
  message: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  // ========================================================================
  // TOKEN GENERATION
  // ========================================================================

  private generateAccessToken(user: any, organization: any, sessionId: string): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
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

  private generateRefreshToken(user: any, sessionId: string): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
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

  // ========================================================================
  // PERMISSION MANAGEMENT
  // ========================================================================

  private getUserPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
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

  // ========================================================================
  // SECURITY METHODS
  // ========================================================================

  private isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return true;
    }

    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.loginAttempts.delete(email);
      return false;
    }

    return false;
  }

  private recordFailedLogin(email: string): void {
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

  private clearFailedLogins(email: string): void {
    this.loginAttempts.delete(email);
  }

  // ========================================================================
  // CLEANUP TASKS
  // ========================================================================

  private startCleanupTasks(): void {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        const db = this.db.getDatabase();
        await db.update(sessions)
          .set({ isActive: false })
          .where(gte(sessions.expiresAt, new Date()));
      } catch (error) {
        structuredLogger.error('Session cleanup failed', error as Error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Clean up expired API keys daily
    setInterval(async () => {
      try {
        const db = this.db.getDatabase();
        await db.update(apiKeys)
          .set({ isActive: false })
          .where(gte(apiKeys.expiresAt, new Date()));
      } catch (error) {
        structuredLogger.error('API key cleanup failed', error as Error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.config.jwtSecret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();

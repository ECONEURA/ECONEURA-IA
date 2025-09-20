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
interface LoginRequest {
    email: string;
    password: string;
    organizationId?: string;
    rememberMe?: boolean;
    mfaToken?: string;
}
interface LoginResponse {
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
export declare class AuthService {
    private config;
    private db;
    private loginAttempts;
    constructor(config?: Partial<AuthConfig>);
    login(loginData: LoginRequest): Promise<LoginResponse>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    logout(sessionId: string): Promise<void>;
    logoutAllSessions(userId: string): Promise<void>;
    createApiKey(userId: string, organizationId: string, permissions: string[]): Promise<ApiKeyResponse>;
    validateApiKey(key: string): Promise<{
        userId: string;
        organizationId: string;
        permissions: string[];
    } | null>;
    private generateAccessToken;
    private generateRefreshToken;
    private getUserPermissions;
    private isAccountLocked;
    private recordFailedLogin;
    private clearFailedLogins;
    private startCleanupTasks;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    verifyToken(token: string): TokenPayload | null;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map
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
export declare class MFAService {
    private static instance;
    private activeSessions;
    private activeCodes;
    private userMethods;
    private notifications;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): MFAService;
    initializeMFA(userId: string): Promise<{
        totpSecret: string;
        qrCode: string;
        backupCodes: string[];
        methods: MFAMethod[];
    }>;
    verifyTOTPCode(userId: string, code: string): Promise<boolean>;
    sendSMSCode(userId: string, phoneNumber: string): Promise<string>;
    sendEmailCode(userId: string, email: string): Promise<string>;
    verifyCode(userId: string, code: string, type: 'sms' | 'email'): Promise<boolean>;
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    createMFASession(userId: string, requiredMethods: string[], ipAddress: string, userAgent: string): Promise<MFASession>;
    completeMFAMethod(sessionId: string, methodId: string): Promise<boolean>;
    createNotification(userId: string, notification: Omit<MFANotification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<MFANotification>;
    getUserNotifications(userId: string): Promise<MFANotification[]>;
    markNotificationAsRead(userId: string, notificationId: string): Promise<boolean>;
    getMFAStats(): {
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
    };
    private generateTOTPSecret;
    private generateQRCode;
    private generateBackupCodes;
    private generateSMSCode;
    private generateEmailCode;
    private validateTOTPCode;
    private validateBackupCode;
    private startMonitoring;
    private performMFAMonitoring;
    private cleanupExpiredSessions;
    private cleanupExpiredCodes;
    stop(): void;
}
export declare const mfaService: MFAService;
//# sourceMappingURL=mfa.service.d.ts.map
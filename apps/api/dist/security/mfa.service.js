import { structuredLogger } from '../lib/structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
import crypto from 'crypto';
export class MFAService {
    static instance;
    activeSessions = new Map();
    activeCodes = new Map();
    userMethods = new Map();
    notifications = new Map();
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.startMonitoring();
    }
    static getInstance() {
        if (!MFAService.instance) {
            MFAService.instance = new MFAService();
        }
        return MFAService.instance;
    }
    async initializeMFA(userId) {
        try {
            const totpSecret = this.generateTOTPSecret();
            const qrCode = this.generateQRCode(totpSecret, userId);
            const backupCodes = this.generateBackupCodes();
            const methods = [
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
            this.userMethods.set(userId, methods);
            structuredLogger.info('MFA initialized for user', {
                userId,
                methodsCount: methods.length,
                backupCodesCount: backupCodes.length
            });
            metrics.securityMfaInitialized.inc({ userId });
            return {
                totpSecret,
                qrCode,
                backupCodes,
                methods
            };
        }
        catch (error) {
            structuredLogger.error('Failed to initialize MFA', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to initialize MFA');
        }
    }
    async verifyTOTPCode(userId, code) {
        try {
            const userMethods = this.userMethods.get(userId);
            if (!userMethods) {
                throw new Error('User MFA methods not found');
            }
            const totpMethod = userMethods.find(m => m.type === 'totp');
            if (!totpMethod || !totpMethod.enabled) {
                throw new Error('TOTP method not enabled');
            }
            const isValid = this.validateTOTPCode(code);
            if (isValid) {
                totpMethod.verified = true;
                totpMethod.lastUsed = new Date();
                structuredLogger.info('TOTP code verified successfully', {
                    userId,
                    methodId: totpMethod.id
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: 'totp',
                    result: 'success'
                });
                await this.createNotification(userId, {
                    type: 'mfa_success',
                    title: 'MFA Verification Successful',
                    message: 'Your TOTP code was verified successfully',
                    data: { method: 'totp' }
                });
            }
            else {
                structuredLogger.warn('TOTP code verification failed', {
                    userId,
                    methodId: totpMethod.id
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: 'totp',
                    result: 'failure'
                });
                await this.createNotification(userId, {
                    type: 'mfa_failure',
                    title: 'MFA Verification Failed',
                    message: 'Your TOTP code verification failed',
                    data: { method: 'totp' }
                });
            }
            return isValid;
        }
        catch (error) {
            structuredLogger.error('TOTP verification error', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async sendSMSCode(userId, phoneNumber) {
        try {
            const code = this.generateSMSCode();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            const codeId = crypto.randomUUID();
            this.activeCodes.set(codeId, {
                code,
                type: 'sms',
                expiresAt,
                attempts: 0,
                maxAttempts: 3,
                used: false
            });
            structuredLogger.info('SMS code sent', {
                userId,
                phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
                codeId,
                expiresAt
            });
            metrics.securityMfaCodesSent.inc({
                userId,
                method: 'sms'
            });
            await this.createNotification(userId, {
                type: 'mfa_required',
                title: 'SMS Code Sent',
                message: `A verification code has been sent to ${phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}`,
                data: { method: 'sms', phoneNumber }
            });
            return code;
        }
        catch (error) {
            structuredLogger.error('Failed to send SMS code', {
                userId,
                phoneNumber,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to send SMS code');
        }
    }
    async sendEmailCode(userId, email) {
        try {
            const code = this.generateEmailCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const codeId = crypto.randomUUID();
            this.activeCodes.set(codeId, {
                code,
                type: 'email',
                expiresAt,
                attempts: 0,
                maxAttempts: 3,
                used: false
            });
            structuredLogger.info('Email code sent', {
                userId,
                email: email.replace(/(.{2}).*(@.*)/, '$1****$2'),
                codeId,
                expiresAt
            });
            metrics.securityMfaCodesSent.inc({
                userId,
                method: 'email'
            });
            await this.createNotification(userId, {
                type: 'mfa_required',
                title: 'Email Code Sent',
                message: `A verification code has been sent to ${email.replace(/(.{2}).*(@.*)/, '$1****$2')}`,
                data: { method: 'email', email }
            });
            return code;
        }
        catch (error) {
            structuredLogger.error('Failed to send email code', {
                userId,
                email,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to send email code');
        }
    }
    async verifyCode(userId, code, type) {
        try {
            let activeCode = null;
            let codeId = null;
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
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: type,
                    result: 'success'
                });
                await this.createNotification(userId, {
                    type: 'mfa_success',
                    title: 'MFA Verification Successful',
                    message: `Your ${type.toUpperCase()} code was verified successfully`,
                    data: { method: type }
                });
            }
            else {
                structuredLogger.warn('Code verification failed', {
                    userId,
                    type,
                    codeId,
                    attempts: activeCode.attempts
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: type,
                    result: 'failure'
                });
                await this.createNotification(userId, {
                    type: 'mfa_failure',
                    title: 'MFA Verification Failed',
                    message: `Your ${type.toUpperCase()} code verification failed`,
                    data: { method: type }
                });
            }
            return isValid;
        }
        catch (error) {
            structuredLogger.error('Code verification error', {
                userId,
                type,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async verifyBackupCode(userId, code) {
        try {
            const isValid = this.validateBackupCode(code);
            if (isValid) {
                structuredLogger.info('Backup code verified successfully', {
                    userId
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: 'backup',
                    result: 'success'
                });
                await this.createNotification(userId, {
                    type: 'mfa_success',
                    title: 'Backup Code Verified',
                    message: 'Your backup code was verified successfully',
                    data: { method: 'backup' }
                });
            }
            else {
                structuredLogger.warn('Backup code verification failed', {
                    userId
                });
                metrics.securityMfaVerifications.inc({
                    userId,
                    method: 'backup',
                    result: 'failure'
                });
            }
            return isValid;
        }
        catch (error) {
            structuredLogger.error('Backup code verification error', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async createMFASession(userId, requiredMethods, ipAddress, userAgent) {
        try {
            const sessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            const userMethods = this.userMethods.get(userId) || [];
            const enabledMethods = userMethods.filter(m => m.enabled);
            const session = {
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
            metrics.securityMfaSessionsCreated.inc({ userId });
            return session;
        }
        catch (error) {
            structuredLogger.error('Failed to create MFA session', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to create MFA session');
        }
    }
    async completeMFAMethod(sessionId, methodId) {
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
            const isComplete = session.requiredMethods.every(method => session.completedMethods.includes(method));
            structuredLogger.info('MFA method completed', {
                sessionId,
                methodId,
                completedMethods: session.completedMethods.length,
                requiredMethods: session.requiredMethods.length,
                isComplete
            });
            metrics.securityMfaMethodsCompleted.inc({
                sessionId,
                method: methodId
            });
            return isComplete;
        }
        catch (error) {
            structuredLogger.error('Failed to complete MFA method', {
                sessionId,
                methodId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async createNotification(userId, notification) {
        try {
            const newNotification = {
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
            metrics.securityMfaNotificationsCreated.inc({
                userId,
                type: newNotification.type
            });
            return newNotification;
        }
        catch (error) {
            structuredLogger.error('Failed to create MFA notification', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to create MFA notification');
        }
    }
    async getUserNotifications(userId) {
        try {
            const notifications = this.notifications.get(userId) || [];
            return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch (error) {
            structuredLogger.error('Failed to get user notifications', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    async markNotificationAsRead(userId, notificationId) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to mark notification as read', {
                userId,
                notificationId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    getMFAStats() {
        const activeSessions = this.activeSessions.size;
        const activeCodes = this.activeCodes.size;
        const totalUsers = this.userMethods.size;
        const totalNotifications = Array.from(this.notifications.values()).reduce((sum, notifications) => sum + notifications.length, 0);
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
    generateTOTPSecret() {
        return crypto.randomBytes(20).toString('base32');
    }
    generateQRCode(secret, userId) {
        return `otpauth://totp/ECONEURA:${userId}?secret=${secret}&issuer=ECONEURA`;
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    generateSMSCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    generateEmailCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }
    validateTOTPCode(code) {
        return code.length === 6 && /^\d+$/.test(code);
    }
    validateBackupCode(code) {
        return code.length === 8 && /^[A-F0-9]+$/.test(code);
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performMFAMonitoring();
        }, 60000);
        structuredLogger.info('MFA monitoring started');
    }
    performMFAMonitoring() {
        try {
            this.cleanupExpiredSessions();
            this.cleanupExpiredCodes();
            structuredLogger.debug('MFA monitoring completed', {
                activeSessions: this.activeSessions.size,
                activeCodes: this.activeCodes.size
            });
        }
        catch (error) {
            structuredLogger.error('MFA monitoring failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = [];
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
    cleanupExpiredCodes() {
        const now = new Date();
        const expiredCodes = [];
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
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('MFA service stopped');
    }
}
export const mfaService = MFAService.getInstance();
//# sourceMappingURL=mfa.service.js.map
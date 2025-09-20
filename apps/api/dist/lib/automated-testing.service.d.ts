import { z } from 'zod';
declare const TestResultSchema: z.ZodObject<{
    id: z.ZodString;
    testName: z.ZodString;
    status: z.ZodEnum<["PASSED", "FAILED", "SKIPPED", "RUNNING"]>;
    message: z.ZodString;
    duration: z.ZodNumber;
    timestamp: z.ZodDate;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
    duration?: number;
    timestamp?: Date;
    details?: Record<string, any>;
    id?: string;
    testName?: string;
}, {
    message?: string;
    status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
    duration?: number;
    timestamp?: Date;
    details?: Record<string, any>;
    id?: string;
    testName?: string;
}>;
declare const TestSuiteSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    tests: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        testName: z.ZodString;
        status: z.ZodEnum<["PASSED", "FAILED", "SKIPPED", "RUNNING"]>;
        message: z.ZodString;
        duration: z.ZodNumber;
        timestamp: z.ZodDate;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        id?: string;
        testName?: string;
    }, {
        message?: string;
        status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        id?: string;
        testName?: string;
    }>, "many">;
    status: z.ZodEnum<["PASSED", "FAILED", "PARTIAL", "RUNNING"]>;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "PASSED" | "FAILED" | "RUNNING" | "PARTIAL";
    duration?: number;
    name?: string;
    id?: string;
    description?: string;
    tests?: {
        message?: string;
        status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        id?: string;
        testName?: string;
    }[];
    startTime?: Date;
    endTime?: Date;
}, {
    status?: "PASSED" | "FAILED" | "RUNNING" | "PARTIAL";
    duration?: number;
    name?: string;
    id?: string;
    description?: string;
    tests?: {
        message?: string;
        status?: "PASSED" | "FAILED" | "RUNNING" | "SKIPPED";
        duration?: number;
        timestamp?: Date;
        details?: Record<string, any>;
        id?: string;
        testName?: string;
    }[];
    startTime?: Date;
    endTime?: Date;
}>;
declare const SecretRotationSchema: z.ZodObject<{
    id: z.ZodString;
    secretName: z.ZodString;
    currentVersion: z.ZodString;
    newVersion: z.ZodOptional<z.ZodString>;
    rotationDate: z.ZodDate;
    status: z.ZodEnum<["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]>;
    lastRotation: z.ZodOptional<z.ZodDate>;
    nextRotation: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "FAILED" | "IN_PROGRESS" | "COMPLETED" | "PENDING";
    metadata?: Record<string, any>;
    id?: string;
    secretName?: string;
    currentVersion?: string;
    newVersion?: string;
    rotationDate?: Date;
    lastRotation?: Date;
    nextRotation?: Date;
}, {
    status?: "FAILED" | "IN_PROGRESS" | "COMPLETED" | "PENDING";
    metadata?: Record<string, any>;
    id?: string;
    secretName?: string;
    currentVersion?: string;
    newVersion?: string;
    rotationDate?: Date;
    lastRotation?: Date;
    nextRotation?: Date;
}>;
declare const SecurityChecklistSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["SECRETS", "AUTHENTICATION", "AUTHORIZATION", "ENCRYPTION", "NETWORK", "LOGGING"]>;
    status: z.ZodEnum<["PASSED", "FAILED", "WARNING", "NOT_APPLICABLE"]>;
    description: z.ZodString;
    remediation: z.ZodOptional<z.ZodString>;
    lastChecked: z.ZodDate;
    nextCheck: z.ZodDate;
    severity: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
}, "strip", z.ZodTypeAny, {
    status?: "PASSED" | "FAILED" | "WARNING" | "NOT_APPLICABLE";
    name?: string;
    lastChecked?: Date;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description?: string;
    category?: "SECRETS" | "AUTHENTICATION" | "AUTHORIZATION" | "ENCRYPTION" | "NETWORK" | "LOGGING";
    remediation?: string;
    nextCheck?: Date;
}, {
    status?: "PASSED" | "FAILED" | "WARNING" | "NOT_APPLICABLE";
    name?: string;
    lastChecked?: Date;
    id?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description?: string;
    category?: "SECRETS" | "AUTHENTICATION" | "AUTHORIZATION" | "ENCRYPTION" | "NETWORK" | "LOGGING";
    remediation?: string;
    nextCheck?: Date;
}>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
export type SecretRotation = z.infer<typeof SecretRotationSchema>;
export type SecurityChecklist = z.infer<typeof SecurityChecklistSchema>;
export interface AutomatedTestingConfig {
    testSuites: string[];
    secretRotationInterval: number;
    securityCheckInterval: number;
    maxConcurrentTests: number;
    timeoutMs: number;
    retryAttempts: number;
    notificationChannels: string[];
}
export interface TestExecution {
    id: string;
    suiteId: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    startTime: Date;
    endTime?: Date;
    results: TestResult[];
    logs: string[];
}
export declare class AutomatedTestingService {
    private config;
    private testSuites;
    private secretRotations;
    private securityChecklist;
    private executions;
    constructor(config: AutomatedTestingConfig);
    createTestSuite(suite: Omit<TestSuite, 'id' | 'startTime' | 'endTime' | 'duration'>): Promise<TestSuite>;
    getTestSuite(suiteId: string): Promise<TestSuite | null>;
    listTestSuites(): Promise<TestSuite[]>;
    updateTestSuite(suiteId: string, updates: Partial<TestSuite>): Promise<TestSuite | null>;
    deleteTestSuite(suiteId: string): Promise<boolean>;
    executeTestSuite(suiteId: string): Promise<TestExecution>;
    private executeTest;
    private runSpecificTest;
    private runSecretTest;
    private runAuthTest;
    private runApiTest;
    private runSecurityTest;
    createSecretRotation(rotation: Omit<SecretRotation, 'id'>): Promise<SecretRotation>;
    getSecretRotation(rotationId: string): Promise<SecretRotation | null>;
    listSecretRotations(): Promise<SecretRotation[]>;
    executeSecretRotation(rotationId: string): Promise<SecretRotation>;
    scheduleSecretRotations(): Promise<SecretRotation[]>;
    createSecurityChecklist(checklist: Omit<SecurityChecklist, 'id'>): Promise<SecurityChecklist>;
    getSecurityChecklist(checklistId: string): Promise<SecurityChecklist | null>;
    listSecurityChecklist(): Promise<SecurityChecklist[]>;
    executeSecurityCheck(checklistId: string): Promise<SecurityChecklist>;
    private getSecurityCheckStatus;
    executeQuarterlySecurityAudit(): Promise<SecurityChecklist[]>;
    getTestingStatistics(): Promise<{
        totalTestSuites: number;
        totalExecutions: number;
        successRate: number;
        averageExecutionTime: number;
        secretRotationsCompleted: number;
        securityChecksPassed: number;
        lastExecution: Date | null;
    }>;
    generateTestingReport(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<{
        period: string;
        generatedAt: Date;
        summary: any;
        testResults: TestResult[];
        secretRotations: SecretRotation[];
        securityChecks: SecurityChecklist[];
        recommendations: string[];
    }>;
    private getPeriodMs;
    private generateRecommendations;
    private initializeDefaultTests;
    private initializeSecretRotations;
    private initializeSecurityChecklist;
}
export default AutomatedTestingService;
//# sourceMappingURL=automated-testing.service.d.ts.map
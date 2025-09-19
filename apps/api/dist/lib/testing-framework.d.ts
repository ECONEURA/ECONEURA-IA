export interface TestConfig {
    timeout: number;
    retries: number;
    parallel: boolean;
    verbose: boolean;
    coverage: boolean;
}
export interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    coverage?: number;
    assertions: number;
    passedAssertions: number;
}
export interface TestSuite {
    name: string;
    tests: Test[];
    beforeAll?: () => Promise<void>;
    afterAll?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    afterEach?: () => Promise<void>;
}
export interface Test {
    name: string;
    fn: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    only?: boolean;
}
export declare class TestingFramework {
    private config;
    private suites;
    private results;
    private currentSuite;
    constructor(config?: Partial<TestConfig>);
    describe(name: string, fn: () => void): void;
    it(name: string, fn: () => Promise<void>, options?: {
        timeout?: number;
        skip?: boolean;
        only?: boolean;
    }): void;
    itSkip(name: string, fn: () => Promise<void>): void;
    itOnly(name: string, fn: () => Promise<void>): void;
    beforeAll(fn: () => Promise<void>): void;
    afterAll(fn: () => Promise<void>): void;
    beforeEach(fn: () => Promise<void>): void;
    afterEach(fn: () => Promise<void>): void;
    run(): Promise<{
        results: TestResult[];
        summary: TestSummary;
    }>;
    private runTestSuite;
    private runTestsSequentially;
    private runTestsInParallel;
    private runTest;
    private runWithTimeout;
    private filterTests;
    private generateSummary;
}
export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    successRate: number;
}
export declare const testingFramework: TestingFramework;
export declare const testingMetrics: {
    testsTotal: any;
    testsPassed: any;
    testsFailed: any;
    testsSkipped: any;
    testDuration: any;
};
//# sourceMappingURL=testing-framework.d.ts.map
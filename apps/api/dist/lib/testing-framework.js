import { prometheus } from '../middleware/observability.js';

import { logger } from './logger.js';
export class TestingFramework {
    config;
    suites = [];
    results = [];
    currentSuite = null;
    constructor(config = {}) {
        this.config = {
            timeout: 5000,
            retries: 0,
            parallel: false,
            verbose: false,
            coverage: false,
            ...config
        };
        logger.info('Testing Framework initialized', {
            config: this.config,
            features: [
                'unit_testing',
                'integration_testing',
                'performance_testing',
                'coverage_reporting',
                'parallel_execution',
                'retry_logic'
            ]
        });
    }
    describe(name, fn) {
        const suite = {
            name,
            tests: [],
            beforeAll: undefined,
            afterAll: undefined,
            beforeEach: undefined,
            afterEach: undefined
        };
        this.currentSuite = suite;
        this.suites.push(suite);
        try {
            fn();
        }
        catch (error) {
            logger.error('Test suite setup failed', {
                suiteName: name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        this.currentSuite = null;
    }
    it(name, fn, options = {}) {
        if (!this.currentSuite) {
            throw new Error('Test must be inside a describe block');
        }
        const test = {
            name,
            fn,
            timeout: options.timeout || this.config.timeout,
            skip: options.skip || false,
            only: options.only || false
        };
        this.currentSuite.tests.push(test);
    }
    itSkip(name, fn) {
        this.it(name, fn, { skip: true });
    }
    itOnly(name, fn) {
        this.it(name, fn, { only: true });
    }
    beforeAll(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeAll must be inside a describe block');
        }
        this.currentSuite.beforeAll = fn;
    }
    afterAll(fn) {
        if (!this.currentSuite) {
            throw new Error('afterAll must be inside a describe block');
        }
        this.currentSuite.afterAll = fn;
    }
    beforeEach(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeEach must be inside a describe block');
        }
        this.currentSuite.beforeEach = fn;
    }
    afterEach(fn) {
        if (!this.currentSuite) {
            throw new Error('afterEach must be inside a describe block');
        }
        this.currentSuite.afterEach = fn;
    }
    async run() {
        const startTime = Date.now();
        this.results = [];
        logger.info('Starting test execution', {
            totalSuites: this.suites.length,
            totalTests: this.suites.reduce((sum, suite) => sum + suite.tests.length, 0),
            config: this.config
        });
        const filteredSuites = this.filterTests();
        for (const suite of filteredSuites) {
            await this.runTestSuite(suite);
        }
        const duration = Date.now() - startTime;
        const summary = this.generateSummary(duration);
        prometheus.testsTotal.set(summary.total);
        prometheus.testsPassed.set(summary.passed);
        prometheus.testsFailed.set(summary.failed);
        prometheus.testsSkipped.set(summary.skipped);
        prometheus.testDuration.observe(duration / 1000);
        logger.info('Test execution completed', {
            summary,
            duration
        });
        return { results: this.results, summary };
    }
    async runTestSuite(suite) {
        logger.info(`Running test suite: ${suite.name}`);
        try {
            if (suite.beforeAll) {
                await suite.beforeAll();
            }
            if (this.config.parallel) {
                await this.runTestsInParallel(suite);
            }
            else {
                await this.runTestsSequentially(suite);
            }
            if (suite.afterAll) {
                await suite.afterAll();
            }
        }
        catch (error) {
            logger.error('Test suite execution failed', {
                suiteName: suite.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async runTestsSequentially(suite) {
        for (const test of suite.tests) {
            await this.runTest(suite, test);
        }
    }
    async runTestsInParallel(suite) {
        const promises = suite.tests.map(test => this.runTest(suite, test));
        await Promise.all(promises);
    }
    async runTest(suite, test) {
        const startTime = Date.now();
        const fullName = `${suite.name} - ${test.name}`;
        if (test.skip) {
            this.results.push({
                name: fullName,
                status: 'skipped',
                duration: 0,
                assertions: 0,
                passedAssertions: 0
            });
            return;
        }
        let retries = this.config.retries;
        let lastError = null;
        while (retries >= 0) {
            try {
                if (suite.beforeEach) {
                    await suite.beforeEach();
                }
                await this.runWithTimeout(test.fn, test.timeout || this.config.timeout);
                if (suite.afterEach) {
                    await suite.afterEach();
                }
                const duration = Date.now() - startTime;
                this.results.push({
                    name: fullName,
                    status: 'passed',
                    duration,
                    assertions: 1,
                    passedAssertions: 1
                });
                if (this.config.verbose) {
                    logger.info(`Test passed: ${fullName}`, { duration });
                }
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                if (retries > 0) {
                    logger.warn(`Test failed, retrying: ${fullName}`, {
                        error: lastError.message,
                        retriesLeft: retries
                    });
                    retries--;
                }
                else {
                    const duration = Date.now() - startTime;
                    this.results.push({
                        name: fullName,
                        status: 'failed',
                        duration,
                        error: lastError.message,
                        assertions: 1,
                        passedAssertions: 0
                    });
                    logger.error(`Test failed: ${fullName}`, {
                        error: lastError.message,
                        duration
                    });
                }
            }
        }
    }
    async runWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timeout after ${timeout}ms`));
            }, timeout);
            fn()
                .then(() => {
                clearTimeout(timer);
                resolve();
            })
                .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    filterTests() {
        const hasOnlyTests = this.suites.some(suite => suite.tests.some(test => test.only));
        if (!hasOnlyTests) {
            return this.suites;
        }
        return this.suites.map(suite => ({
            ...suite,
            tests: suite.tests.filter(test => test.only)
        }));
    }
    generateSummary(duration) {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const skipped = this.results.filter(r => r.status === 'skipped').length;
        return {
            total,
            passed,
            failed,
            skipped,
            duration,
            successRate: total > 0 ? (passed / total) * 100 : 0
        };
    }
}
export const testingFramework = new TestingFramework();
export const testingMetrics = {
    testsTotal: new prometheus.Gauge({
        name: 'econeura_tests_total',
        help: 'Total number of tests'
    }),
    testsPassed: new prometheus.Gauge({
        name: 'econeura_tests_passed',
        help: 'Number of passed tests'
    }),
    testsFailed: new prometheus.Gauge({
        name: 'econeura_tests_failed',
        help: 'Number of failed tests'
    }),
    testsSkipped: new prometheus.Gauge({
        name: 'econeura_tests_skipped',
        help: 'Number of skipped tests'
    }),
    testDuration: new prometheus.Histogram({
        name: 'econeura_test_duration_seconds',
        help: 'Test execution duration in seconds',
        buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    })
};
//# sourceMappingURL=testing-framework.js.map
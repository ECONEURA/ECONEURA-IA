import { logger } from './logger.js';
import { prometheus } from '../middleware/observability.js';

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

export class TestingFramework {
  private config: TestConfig;
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];
  private currentSuite: TestSuite | null = null;

  constructor(config: Partial<TestConfig> = {}) {
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

  /**
   * Create a new test suite
   */
  describe(name: string, fn: () => void): void {
    const suite: TestSuite = {
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
    } catch (error) {
      logger.error('Test suite setup failed', {
        suiteName: name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    this.currentSuite = null;
  }

  /**
   * Add a test to the current suite
   */
  it(name: string, fn: () => Promise<void>, options: { timeout?: number; skip?: boolean; only?: boolean } = {}): void {
    if (!this.currentSuite) {
      throw new Error('Test must be inside a describe block');
    }

    const test: Test = {
      name,
      fn,
      timeout: options.timeout || this.config.timeout,
      skip: options.skip || false,
      only: options.only || false
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * Add a skipped test
   */
  itSkip(name: string, fn: () => Promise<void>): void {
    this.it(name, fn, { skip: true });
  }

  /**
   * Add a test that should be the only one running
   */
  it.only(name: string, fn: () => Promise<void>): void {
    this.it(name, fn, { only: true });
  }

  /**
   * Setup function that runs before all tests in a suite
   */
  beforeAll(fn: () => Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeAll must be inside a describe block');
    }
    this.currentSuite.beforeAll = fn;
  }

  /**
   * Setup function that runs after all tests in a suite
   */
  afterAll(fn: () => Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterAll must be inside a describe block');
    }
    this.currentSuite.afterAll = fn;
  }

  /**
   * Setup function that runs before each test
   */
  beforeEach(fn: () => Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeEach must be inside a describe block');
    }
    this.currentSuite.beforeEach = fn;
  }

  /**
   * Setup function that runs after each test
   */
  afterEach(fn: () => Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterEach must be inside a describe block');
    }
    this.currentSuite.afterEach = fn;
  }

  /**
   * Run all tests
   */
  async run(): Promise<{ results: TestResult[]; summary: TestSummary }> {
    const startTime = Date.now();
    this.results = [];

    logger.info('Starting test execution', {
      totalSuites: this.suites.length,
      totalTests: this.suites.reduce((sum, suite) => sum + suite.tests.length, 0),
      config: this.config
    });

    // Filter tests if only() is used
    const filteredSuites = this.filterTests();

    // Run test suites
    for (const suite of filteredSuites) {
      await this.runTestSuite(suite);
    }

    const duration = Date.now() - startTime;
    const summary = this.generateSummary(duration);

    // Record metrics
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

  /**
   * Run a single test suite
   */
  private async runTestSuite(suite: TestSuite): Promise<void> {
    logger.info(`Running test suite: ${suite.name}`);

    try {
      // Run beforeAll
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Run tests
      if (this.config.parallel) {
        await this.runTestsInParallel(suite);
      } else {
        await this.runTestsSequentially(suite);
      }

      // Run afterAll
      if (suite.afterAll) {
        await suite.afterAll();
      }
    } catch (error) {
      logger.error('Test suite execution failed', {
        suiteName: suite.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequentially(suite: TestSuite): Promise<void> {
    for (const test of suite.tests) {
      await this.runTest(suite, test);
    }
  }

  /**
   * Run tests in parallel
   */
  private async runTestsInParallel(suite: TestSuite): Promise<void> {
    const promises = suite.tests.map(test => this.runTest(suite, test));
    await Promise.all(promises);
  }

  /**
   * Run a single test
   */
  private async runTest(suite: TestSuite, test: Test): Promise<void> {
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
    let lastError: Error | null = null;

    while (retries >= 0) {
      try {
        // Run beforeEach
        if (suite.beforeEach) {
          await suite.beforeEach();
        }

        // Run test with timeout
        await this.runWithTimeout(test.fn, test.timeout || this.config.timeout);

        // Run afterEach
        if (suite.afterEach) {
          await suite.afterEach();
        }

        // Test passed
        const duration = Date.now() - startTime;
        this.results.push({
          name: fullName,
          status: 'passed',
          duration,
          assertions: 1, // Simplified - in real implementation, track actual assertions
          passedAssertions: 1
        });

        if (this.config.verbose) {
          logger.info(`Test passed: ${fullName}`, { duration });
        }

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (retries > 0) {
          logger.warn(`Test failed, retrying: ${fullName}`, {
            error: lastError.message,
            retriesLeft: retries
          });
          retries--;
        } else {
          // Test failed
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

  /**
   * Run a function with timeout
   */
  private async runWithTimeout(fn: () => Promise<void>, timeout: number): Promise<void> {
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

  /**
   * Filter tests based on only() usage
   */
  private filterTests(): TestSuite[] {
    const hasOnlyTests = this.suites.some(suite => 
      suite.tests.some(test => test.only)
    );

    if (!hasOnlyTests) {
      return this.suites;
    }

    return this.suites.map(suite => ({
      ...suite,
      tests: suite.tests.filter(test => test.only)
    }));
  }

  /**
   * Generate test summary
   */
  private generateSummary(duration: number): TestSummary {
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

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  successRate: number;
}

// Export singleton instance
export const testingFramework = new TestingFramework();

// Export Prometheus metrics
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

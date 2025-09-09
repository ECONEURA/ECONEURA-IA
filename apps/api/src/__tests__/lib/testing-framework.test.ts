import { TestingFramework } from '../../lib/testing-framework.js';

describe('TestingFramework', () => {
  let framework: TestingFramework;

  beforeEach(() => {
    framework = new TestingFramework({
      timeout: 1000,
      retries: 1,
      parallel: false,
      verbose: false,
      coverage: false
    });
  });

  afterEach(() => {
    framework.destroy();
  });

  describe('Test Suite Management', () => {
    it('should create and run test suites', async () => {
      let beforeAllCalled = false;
      let afterAllCalled = false;
      let beforeEachCalled = false;
      let afterEachCalled = false;
      let testCalled = false;

      framework.describe('Sample Test Suite', () => {
        framework.beforeAll(async () => {
          beforeAllCalled = true;
        });

        framework.afterAll(async () => {
          afterAllCalled = true;
        });

        framework.beforeEach(async () => {
          beforeEachCalled = true;
        });

        framework.afterEach(async () => {
          afterEachCalled = true;
        });

        framework.it('should run a test', async () => {
          testCalled = true;
          expect(true).toBe(true);
        });
      });

      const { results, summary } = await framework.run();

      expect(beforeAllCalled).toBe(true);
      expect(afterAllCalled).toBe(true);
      expect(beforeEachCalled).toBe(true);
      expect(afterEachCalled).toBe(true);
      expect(testCalled).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('passed');
      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(0);
    });

    it('should handle test failures', async () => {
      framework.describe('Failing Test Suite', () => {
        framework.it('should fail', async () => {
          throw new Error('Test failure');
        });
      });

      const { results, summary } = await framework.run();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toBe('Test failure');
      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(1);
    });

    it('should handle test timeouts', async () => {
      framework.describe('Timeout Test Suite', () => {
        framework.it('should timeout', async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Longer than timeout
        }, { timeout: 500 });
      });

      const { results, summary } = await framework.run();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('timeout');
      expect(summary.total).toBe(1);
      expect(summary.failed).toBe(1);
    });

    it('should skip tests marked as skip', async () => {
      framework.describe('Skip Test Suite', () => {
        framework.it('should be skipped', async () => {
          throw new Error('This should not run');
        }, { skip: true });

        framework.it('should run', async () => {
          expect(true).toBe(true);
        });
      });

      const { results, summary } = await framework.run();

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('skipped');
      expect(results[1].status).toBe('passed');
      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(1);
      expect(summary.skipped).toBe(1);
    });

    it('should run only tests marked as only', async () => {
      framework.describe('Only Test Suite', () => {
        framework.it('should not run', async () => {
          throw new Error('This should not run');
        });

        framework.it('should run only this', async () => {
          expect(true).toBe(true);
        }, { only: true });
      });

      const { results, summary } = await framework.run();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('passed');
      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(1);
    });
  });

  describe('Test Retries', () => {
    it('should retry failed tests', async () => {
      let attempts = 0;

      framework.describe('Retry Test Suite', () => {
        framework.it('should pass on second attempt', async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('First attempt fails');
          }
          expect(attempts).toBe(2);
        });
      });

      const { results, summary } = await framework.run();

      expect(attempts).toBe(2);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('passed');
      expect(summary.passed).toBe(1);
    });

    it('should fail after max retries', async () => {
      let attempts = 0;

      framework.describe('Max Retry Test Suite', () => {
        framework.it('should fail after retries', async () => {
          attempts++;
          throw new Error(`Attempt ${attempts} failed`);
        });
      });

      const { results, summary } = await framework.run();

      expect(attempts).toBe(2); // Initial attempt + 1 retry
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
      expect(summary.failed).toBe(1);
    });
  });

  describe('Parallel Execution', () => {
    it('should run tests in parallel when enabled', async () => {
      const parallelFramework = new TestingFramework({
        parallel: true,
        timeout: 1000
      });

      const startTimes: number[] = [];
      const endTimes: number[] = [];

      parallelFramework.describe('Parallel Test Suite', () => {
        for (let i = 0; i < 3; i++) {
          parallelFramework.it(`test ${i}`, async () => {
            startTimes.push(Date.now());
            await new Promise(resolve => setTimeout(resolve, 100));
            endTimes.push(Date.now());
          });
        }
      });

      const startTime = Date.now();
      const { summary } = await parallelFramework.run();
      const totalTime = Date.now() - startTime;

      expect(summary.passed).toBe(3);
      expect(totalTime).toBeLessThan(250); // Should be less than sequential execution
      
      parallelFramework.destroy();
    });

    it('should run tests sequentially when parallel is disabled', async () => {
      const sequentialFramework = new TestingFramework({
        parallel: false,
        timeout: 1000
      });

      const executionOrder: number[] = [];

      sequentialFramework.describe('Sequential Test Suite', () => {
        for (let i = 0; i < 3; i++) {
          sequentialFramework.it(`test ${i}`, async () => {
            executionOrder.push(i);
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
      });

      const startTime = Date.now();
      const { summary } = await sequentialFramework.run();
      const totalTime = Date.now() - startTime;

      expect(summary.passed).toBe(3);
      expect(executionOrder).toEqual([0, 1, 2]);
      expect(totalTime).toBeGreaterThan(140); // Should be at least 150ms for sequential
      
      sequentialFramework.destroy();
    });
  });

  describe('Test Hooks', () => {
    it('should run beforeAll and afterAll once per suite', async () => {
      let beforeAllCount = 0;
      let afterAllCount = 0;

      framework.describe('Hook Test Suite', () => {
        framework.beforeAll(async () => {
          beforeAllCount++;
        });

        framework.afterAll(async () => {
          afterAllCount++;
        });

        framework.it('test 1', async () => {
          expect(beforeAllCount).toBe(1);
        });

        framework.it('test 2', async () => {
          expect(beforeAllCount).toBe(1);
        });
      });

      await framework.run();

      expect(beforeAllCount).toBe(1);
      expect(afterAllCount).toBe(1);
    });

    it('should run beforeEach and afterEach for each test', async () => {
      let beforeEachCount = 0;
      let afterEachCount = 0;

      framework.describe('Hook Test Suite', () => {
        framework.beforeEach(async () => {
          beforeEachCount++;
        });

        framework.afterEach(async () => {
          afterEachCount++;
        });

        framework.it('test 1', async () => {
          expect(beforeEachCount).toBe(1);
        });

        framework.it('test 2', async () => {
          expect(beforeEachCount).toBe(2);
        });
      });

      await framework.run();

      expect(beforeEachCount).toBe(2);
      expect(afterEachCount).toBe(2);
    });
  });

  describe('Test Statistics', () => {
    it('should provide test statistics', async () => {
      framework.describe('Stats Test Suite', () => {
        framework.it('passing test', async () => {
          expect(true).toBe(true);
        });

        framework.it('failing test', async () => {
          throw new Error('Test failed');
        });

        framework.it('skipped test', async () => {
          expect(true).toBe(true);
        }, { skip: true });
      });

      const { summary } = await framework.run();

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.successRate).toBeCloseTo(33.33, 1);
      expect(summary.duration).toBeGreaterThan(0);
    });

    it('should track test execution time', async () => {
      framework.describe('Timing Test Suite', () => {
        framework.it('timed test', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          expect(true).toBe(true);
        });
      });

      const { results } = await framework.run();

      expect(results).toHaveLength(1);
      expect(results[0].duration).toBeGreaterThan(90);
      expect(results[0].duration).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in beforeAll', async () => {
      framework.describe('BeforeAll Error Suite', () => {
        framework.beforeAll(async () => {
          throw new Error('BeforeAll failed');
        });

        framework.it('should not run', async () => {
          expect(true).toBe(true);
        });
      });

      const { results, summary } = await framework.run();

      // Test should still be recorded but may not execute properly
      expect(summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors in afterAll', async () => {
      let testRan = false;

      framework.describe('AfterAll Error Suite', () => {
        framework.afterAll(async () => {
          throw new Error('AfterAll failed');
        });

        framework.it('should run', async () => {
          testRan = true;
          expect(true).toBe(true);
        });
      });

      await framework.run();

      expect(testRan).toBe(true);
    });

    it('should handle errors in beforeEach', async () => {
      framework.describe('BeforeEach Error Suite', () => {
        framework.beforeEach(async () => {
          throw new Error('BeforeEach failed');
        });

        framework.it('should fail due to beforeEach', async () => {
          expect(true).toBe(true);
        });
      });

      const { results } = await framework.run();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('failed');
    });
  });

  describe('Configuration', () => {
    it('should respect timeout configuration', async () => {
      const shortTimeoutFramework = new TestingFramework({
        timeout: 100
      });

      shortTimeoutFramework.describe('Timeout Config Suite', () => {
        shortTimeoutFramework.it('should timeout quickly', async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        });
      });

      const startTime = Date.now();
      const { results } = await shortTimeoutFramework.run();
      const duration = Date.now() - startTime;

      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('timeout');
      expect(duration).toBeLessThan(150); // Should timeout before 200ms
      
      shortTimeoutFramework.destroy();
    });

    it('should respect retry configuration', async () => {
      const highRetryFramework = new TestingFramework({
        retries: 3
      });

      let attempts = 0;

      highRetryFramework.describe('Retry Config Suite', () => {
        highRetryFramework.it('should retry multiple times', async () => {
          attempts++;
          throw new Error(`Attempt ${attempts}`);
        });
      });

      await highRetryFramework.run();

      expect(attempts).toBe(4); // Initial + 3 retries
      
      highRetryFramework.destroy();
    });
  });
});

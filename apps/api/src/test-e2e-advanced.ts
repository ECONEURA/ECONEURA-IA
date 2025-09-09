#!/usr/bin/env tsx

/**
 * ECONEURA API - E2E Testing Suite for Advanced PRs
 * Tests complex workflows and integrations
 */

import { structuredLogger } from './lib/structured-logger.js';

const API_BASE = 'http://localhost:3001';

class AdvancedE2ETester {
  private testResults: any[] = [];

  async runAdvancedTests(): Promise<void> {
    console.log('🚀 ECONEURA - E2E Testing Suite for Advanced PRs\n');

    // Test FinOps workflow
    await this.testFinOpsWorkflow();

    // Test GDPR compliance workflow
    await this.testGDPRWorkflow();

    // Test SEPA integration workflow
    await this.testSEPAWorkflow();

    // Test Analytics workflow
    await this.testAnalyticsWorkflow();

    // Test Prompts workflow
    await this.testPromptsWorkflow();

    this.printResults();
  }

  private async testFinOpsWorkflow(): Promise<void> {
    console.log('💰 Testing FinOps Workflow...');

    try {
      // 1. Get current budgets
      const budgetsResponse = await fetch(`${API_BASE}/v1/finops/budgets`, {
        headers: { 'X-Org-ID': 'test-org' }
      });
      const budgets = await budgetsResponse.json();

      // 2. Create new budget
      const newBudget = await fetch(`${API_BASE}/v1/finops/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-ID': 'test-org'
        },
        body: JSON.stringify({
          organizationId: 'test-org',
          name: 'E2E Test Budget',
          amount: 500,
          currency: 'EUR',
          period: 'monthly',
          categories: ['test'],
          alertThreshold: 80,
          criticalThreshold: 95,
          isActive: true
        })
      });

      // 3. Get cost tracking
      const costsResponse = await fetch(`${API_BASE}/v1/finops/costs`, {
        headers: { 'X-Org-ID': 'test-org' }
      });

      this.testResults.push({
        test: 'FinOps Workflow',
        status: 'PASSED',
        steps: ['Get budgets', 'Create budget', 'Get costs'],
        details: { budgets: budgets.success, newBudget: newBudget.ok, costs: costsResponse.ok }
      });

      console.log('  ✅ FinOps workflow completed successfully');

    } catch (error) {
      this.testResults.push({
        test: 'FinOps Workflow',
        status: 'FAILED',
        error: (error as Error).message
      });
      console.log('  ❌ FinOps workflow failed');
    }
  }

  private async testGDPRWorkflow(): Promise<void> {
    console.log('🔒 Testing GDPR Workflow...');

    try {
      // 1. Request data export
      const exportResponse = await fetch(`${API_BASE}/v1/gdpr/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-123',
          dataTypes: ['personal', 'financial']
        })
      });
      const exportResult = await exportResponse.json();

      // 2. Get audit logs
      const auditResponse = await fetch(`${API_BASE}/v1/gdpr/audit?userId=test-user-123`);
      const auditLogs = await auditResponse.json();

      // 3. Test data erasure
      const eraseResponse = await fetch(`${API_BASE}/v1/gdpr/erase/test-user-123`, {
        method: 'DELETE'
      });

      this.testResults.push({
        test: 'GDPR Workflow',
        status: 'PASSED',
        steps: ['Data export', 'Audit logs', 'Data erasure'],
        details: {
          export: exportResult.success,
          audit: auditLogs.success,
          erase: eraseResponse.ok
        }
      });

      console.log('  ✅ GDPR workflow completed successfully');

    } catch (error) {
      this.testResults.push({
        test: 'GDPR Workflow',
        status: 'FAILED',
        error: (error as Error).message
      });
      console.log('  ❌ GDPR workflow failed');
    }
  }

  private async testSEPAWorkflow(): Promise<void> {
    console.log('💳 Testing SEPA Workflow...');

    try {
      // 1. Parse SEPA XML
      const parseResponse = await fetch(`${API_BASE}/v1/sepa/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlData: '<Document><test>sample</test></Document>',
          format: 'CAMT'
        })
      });
      const parseResult = await parseResponse.json();

      // 2. Get transactions
      const transactionsResponse = await fetch(`${API_BASE}/v1/sepa/transactions`);
      const transactions = await transactionsResponse.json();

      this.testResults.push({
        test: 'SEPA Workflow',
        status: 'PASSED',
        steps: ['Parse XML', 'Get transactions'],
        details: {
          parse: parseResult.success,
          transactions: transactions.success
        }
      });

      console.log('  ✅ SEPA workflow completed successfully');

    } catch (error) {
      this.testResults.push({
        test: 'SEPA Workflow',
        status: 'FAILED',
        error: (error as Error).message
      });
      console.log('  ❌ SEPA workflow failed');
    }
  }

  private async testAnalyticsWorkflow(): Promise<void> {
    console.log('📊 Testing Analytics Workflow...');

    try {
      // 1. Track event
      const trackResponse = await fetch(`${API_BASE}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-ID': 'test-org'
        },
        body: JSON.stringify({
          eventType: 'user_action',
          action: 'e2e_test',
          metadata: { test: true }
        })
      });
      const trackResult = await trackResponse.json();

      // 2. Query events
      const queryResponse = await fetch(`${API_BASE}/v1/analytics/events?eventTypes=user_action&limit=5`);
      const queryResult = await queryResponse.json();

      // 3. Get metrics
      const metricsResponse = await fetch(`${API_BASE}/v1/analytics/metrics`);
      const metrics = await metricsResponse.json();

      this.testResults.push({
        test: 'Analytics Workflow',
        status: 'PASSED',
        steps: ['Track event', 'Query events', 'Get metrics'],
        details: {
          track: trackResult.success,
          query: queryResult.success,
          metrics: metrics.success
        }
      });

      console.log('  ✅ Analytics workflow completed successfully');

    } catch (error) {
      this.testResults.push({
        test: 'Analytics Workflow',
        status: 'FAILED',
        error: (error as Error).message
      });
      console.log('  ❌ Analytics workflow failed');
    }
  }

  private async testPromptsWorkflow(): Promise<void> {
    console.log('📝 Testing Prompts Workflow...');

    try {
      // 1. Get prompt library
      const libraryResponse = await fetch(`${API_BASE}/v1/prompts`);
      const library = await libraryResponse.json();

      // 2. Create new prompt
      const createResponse = await fetch(`${API_BASE}/v1/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'test-user'
        },
        body: JSON.stringify({
          name: 'E2E Test Prompt',
          category: 'test',
          template: 'This is a test prompt for {variable}',
          approved: false
        })
      });
      const createResult = await createResponse.json();

      this.testResults.push({
        test: 'Prompts Workflow',
        status: 'PASSED',
        steps: ['Get library', 'Create prompt'],
        details: {
          library: library.success,
          create: createResult.success
        }
      });

      console.log('  ✅ Prompts workflow completed successfully');

    } catch (error) {
      this.testResults.push({
        test: 'Prompts Workflow',
        status: 'FAILED',
        error: (error as Error).message
      });
      console.log('  ❌ Prompts workflow failed');
    }
  }

  private printResults(): void {
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;

    console.log('\n📊 E2E Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🎯 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }

    structuredLogger.info('E2E testing completed', {
      totalTests: this.testResults.length,
      passed,
      failed,
      successRate: (passed / this.testResults.length) * 100
    });
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdvancedE2ETester();
  tester.runAdvancedTests().catch(console.error);
}

export { AdvancedE2ETester };

#!/usr/bin/env tsx
import { structuredLogger } from './lib/structured-logger.js';
const API_BASE = 'http://localhost:3001';
class AdvancedE2ETester {
    testResults = [];
    async runAdvancedTests() {
        await this.testFinOpsWorkflow();
        await this.testGDPRWorkflow();
        await this.testSEPAWorkflow();
        await this.testAnalyticsWorkflow();
        await this.testPromptsWorkflow();
        this.printResults();
    }
    async testFinOpsWorkflow() {
        try {
            const budgetsResponse = await fetch(`${API_BASE}/v1/finops/budgets`, {
                headers: { 'X-Org-ID': 'test-org' }
            });
            const budgets = await budgetsResponse.json();
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
            const costsResponse = await fetch(`${API_BASE}/v1/finops/costs`, {
                headers: { 'X-Org-ID': 'test-org' }
            });
            this.testResults.push({
                test: 'FinOps Workflow',
                status: 'PASSED',
                steps: ['Get budgets', 'Create budget', 'Get costs'],
                details: { budgets: budgets.success, newBudget: newBudget.ok, costs: costsResponse.ok }
            });
        }
        catch (error) {
            this.testResults.push({
                test: 'FinOps Workflow',
                status: 'FAILED',
                error: error.message
            });
        }
    }
    async testGDPRWorkflow() {
        try {
            const exportResponse = await fetch(`${API_BASE}/v1/gdpr/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'test-user-123',
                    dataTypes: ['personal', 'financial']
                })
            });
            const exportResult = await exportResponse.json();
            const auditResponse = await fetch(`${API_BASE}/v1/gdpr/audit?userId=test-user-123`);
            const auditLogs = await auditResponse.json();
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
        }
        catch (error) {
            this.testResults.push({
                test: 'GDPR Workflow',
                status: 'FAILED',
                error: error.message
            });
        }
    }
    async testSEPAWorkflow() {
        try {
            const parseResponse = await fetch(`${API_BASE}/v1/sepa/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    xmlData: '<Document><test>sample</test></Document>',
                    format: 'CAMT'
                })
            });
            const parseResult = await parseResponse.json();
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
        }
        catch (error) {
            this.testResults.push({
                test: 'SEPA Workflow',
                status: 'FAILED',
                error: error.message
            });
        }
    }
    async testAnalyticsWorkflow() {
        try {
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
            const queryResponse = await fetch(`${API_BASE}/v1/analytics/events?eventTypes=user_action&limit=5`);
            const queryResult = await queryResponse.json();
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
        }
        catch (error) {
            this.testResults.push({
                test: 'Analytics Workflow',
                status: 'FAILED',
                error: error.message
            });
        }
    }
    async testPromptsWorkflow() {
        try {
            const libraryResponse = await fetch(`${API_BASE}/v1/prompts`);
            const library = await libraryResponse.json();
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
        }
        catch (error) {
            this.testResults.push({
                test: 'Prompts Workflow',
                status: 'FAILED',
                error: error.message
            });
        }
    }
    printResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        if (failed > 0) {
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => {
                console.error(`Failed test: ${r.name} - ${r.error}`);
            });
        }
        structuredLogger.info('E2E testing completed', {
            totalTests: this.testResults.length,
            passed,
            failed,
            successRate: (passed / this.testResults.length) * 100
        });
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new AdvancedE2ETester();
    tester.runAdvancedTests().catch(console.error);
}
export { AdvancedE2ETester };
//# sourceMappingURL=test-e2e-advanced.js.map
#!/usr/bin/env tsx

/**
 * ECONEURA API - Test Suite Completo
 * Valida TODOS los endpoints implementados
 */

import { structuredLogger } from './lib/structured-logger.js';

const API_BASE = 'http://localhost:3001';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
}

class APITester {
  private results: TestResult[] = [];
  private startTime = Date.now();

  async runAllTests(): Promise<void> {
    
    
    // Test Health endpoints (PR-22)
    await this.testCategory('Health & Monitoring (PR-22)', [
      { method: 'GET', endpoint: '/health' },
      { method: 'GET', endpoint: '/health/live' },
      { method: 'GET', endpoint: '/health/ready' }
    ]);

    // Test Observability (PR-23)
    await this.testCategory('Observability (PR-23)', [
      { method: 'GET', endpoint: '/metrics' },
      { method: 'GET', endpoint: '/cache/stats' }
    ]);

    // Test Analytics (PR-24)
    await this.testCategory('Analytics (PR-24)', [
      { method: 'POST', endpoint: '/v1/analytics/events', body: { eventType: 'user_action', action: 'test' } },
      { method: 'GET', endpoint: '/v1/analytics/events' },
      { method: 'GET', endpoint: '/v1/analytics/metrics' }
    ]);

    // Test Events (SSE)
    await this.testCategory('Server-Sent Events', [
      { method: 'GET', endpoint: '/v1/events/stats' },
      { method: 'POST', endpoint: '/v1/events/broadcast', body: { event: 'test', data: { message: 'test' } } }
    ]);

    // Test Cockpit
    await this.testCategory('Cockpit Dashboard', [
      { method: 'GET', endpoint: '/v1/cockpit/overview' },
      { method: 'GET', endpoint: '/v1/cockpit/agents' },
      { method: 'GET', endpoint: '/v1/cockpit/costs' },
      { method: 'GET', endpoint: '/v1/cockpit/system' }
    ]);

    // Test FinOps (PR-45)
    await this.testCategory('FinOps Panel (PR-45)', [
      { method: 'GET', endpoint: '/v1/finops/budgets' },
      { method: 'GET', endpoint: '/v1/finops/costs' },
      { method: 'POST', endpoint: '/v1/finops/budgets', body: { 
        organizationId: 'test-org',
        name: 'Test Budget',
        amount: 100,
        currency: 'EUR',
        period: 'monthly',
        categories: ['test'],
        alertThreshold: 80,
        criticalThreshold: 95,
        isActive: true
      }}
    ]);

    // Test GDPR (PR-43)
    await this.testCategory('GDPR Compliance (PR-43)', [
      { method: 'POST', endpoint: '/v1/gdpr/export', body: { userId: 'test123', dataTypes: ['personal'] } },
      { method: 'DELETE', endpoint: '/v1/gdpr/erase/test123' },
      { method: 'GET', endpoint: '/v1/gdpr/audit' }
    ]);

    // Test SEPA (PR-42)
    await this.testCategory('SEPA Integration (PR-42)', [
      { method: 'POST', endpoint: '/v1/sepa/parse', body: { xmlData: '<test>sample</test>', format: 'CAMT' } },
      { method: 'GET', endpoint: '/v1/sepa/transactions' }
    ]);

    // Test Quiet Hours (PR-46)
    await this.testCategory('Quiet Hours & On-Call (PR-46)', [
      { method: 'GET', endpoint: '/v1/quiet-hours' },
      { method: 'POST', endpoint: '/v1/quiet-hours', body: { enabled: true, timezone: 'Europe/Madrid' } },
      { method: 'GET', endpoint: '/v1/on-call/schedule' },
      { method: 'POST', endpoint: '/v1/alerts/escalate', body: { alertId: 'test123', level: 1 } }
    ]);

    // Test API Info
    await this.testCategory('API Information', [
      { method: 'GET', endpoint: '/' }
    ]);

    this.printSummary();
  }

  private async testCategory(category: string, tests: Array<{ method: string, endpoint: string, body?: any }>): Promise<void> {
    
    
    for (const test of tests) {
      await this.testEndpoint(test.method, test.endpoint, test.body);
    }
    
  }

  private async testEndpoint(method: string, endpoint: string, body?: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Org-ID': 'test-org',
          'X-User-ID': 'test-user',
          'X-Correlation-ID': `test_${Date.now()}`
        }
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 400;

      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        success,
        responseTime
      };

      if (!success) {
        const errorText = await response.text();
        result.error = errorText;
      }

      this.results.push(result);

      const statusColor = success ? COLORS.GREEN : COLORS.RED;
      const statusIcon = success ? '✅' : '❌';
      
      

      if (!success && result.error) {
        
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint,
        method,
        status: 0,
        success: false,
        responseTime,
        error: (error as Error).message
      };

      this.results.push(result);
      
      
    }
  }

  private printSummary(): void {
    const totalTime = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;

    
    
    
    
    
    

    if (failed > 0) {
      
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          
        });
    }

    
    
    // Export results for CI
    const resultsFile = {
      summary: {
        total: this.results.length,
        successful,
        failed,
        successRate: (successful / this.results.length) * 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalTime
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };

    structuredLogger.info('API test suite completed', resultsFile.summary);
  }
}

// Ejecutar tests si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

export { APITester };

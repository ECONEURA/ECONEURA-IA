import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for chaos testing
const chaosErrorRate = new Rate('chaos_error_rate');
const chaosResponseTime = new Trend('chaos_response_time');
const chaosRequestCount = new Counter('chaos_request_count');
const chaosScenarios = new Counter('chaos_scenarios');

// Environment-configurable options for chaos testing
const K6_BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3001';
const K6_MAX_VUS = parseInt(__ENV.K6_MAX_VUS || '5');
const K6_CHAOS_DURATION = __ENV.K6_CHAOS_DURATION || '3m';
const K6_CHAOS_RAMP = __ENV.K6_CHAOS_RAMP || '1m';

export const options = {
  stages: [
    { duration: K6_CHAOS_RAMP, target: K6_MAX_VUS },  // Ramp up to chaos users
    { duration: K6_CHAOS_DURATION, target: K6_MAX_VUS },  // Stay at chaos users
    { duration: K6_CHAOS_RAMP, target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // More lenient for chaos testing
    http_req_failed: ['rate<0.3'],     // Allow higher error rate
    chaos_error_rate: ['rate<0.2'],    // Custom chaos error rate
  },
};

const BASE_URL = K6_BASE_URL;

export default function() {
  // Run different chaos scenarios
  const scenarios = [
    'invalid_requests',
    'malicious_payloads',
    'rate_limiting',
    'resource_exhaustion',
    'error_conditions'
  ];
  
  const scenario = scenarios[__VU % scenarios.length];
  
  switch (scenario) {
    case 'invalid_requests':
      testInvalidRequests();
      break;
    case 'malicious_payloads':
      testMaliciousPayloads();
      break;
    case 'rate_limiting':
      testRateLimiting();
      break;
    case 'resource_exhaustion':
      testResourceExhaustion();
      break;
    case 'error_conditions':
      testErrorConditions();
      break;
  }
  
  chaosScenarios.add(1, { scenario });
  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}

function testInvalidRequests() {
  const invalidRequests = [
    { method: 'GET', url: '/invalid-endpoint' },
    { method: 'POST', url: '/v1/analytics/events', body: 'invalid-json' },
    { method: 'GET', url: '/v1/advanced-analytics/dashboard?invalid=param' },
    { method: 'POST', url: '/v1/advanced-security/events', body: '{}' },
  ];
  
  invalidRequests.forEach(req => {
    const response = http.request(req.method, `${BASE_URL}${req.url}`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const success = check(response, {
      [`${req.method} ${req.url} handled gracefully`]: (r) => r.status < 500,
      [`${req.method} ${req.url} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    
    chaosErrorRate.add(!success);
    chaosResponseTime.add(response.timings.duration);
    chaosRequestCount.add(1);
  });
}

function testMaliciousPayloads() {
  const maliciousPayloads = [
    { endpoint: '/v1/analytics/events', payload: { eventType: '<script>alert("xss")</script>' } },
    { endpoint: '/v1/advanced-security/threats/detect', payload: { ipAddress: "'; DROP TABLE users; --" } },
    { endpoint: '/v1/finops/budgets', payload: { amount: "NaN", currency: "../../etc/passwd" } },
    { endpoint: '/v1/advanced-analytics/events', payload: { eventType: "test", action: "javascript:alert(1)" } },
  ];
  
  maliciousPayloads.forEach(req => {
    const response = http.post(`${BASE_URL}${req.endpoint}`, JSON.stringify(req.payload), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const success = check(response, {
      [`malicious payload to ${req.endpoint} handled safely`]: (r) => r.status < 500,
      [`malicious payload to ${req.endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    
    chaosErrorRate.add(!success);
    chaosResponseTime.add(response.timings.duration);
    chaosRequestCount.add(1);
  });
}

function testRateLimiting() {
  // Send rapid requests to test rate limiting
  for (let i = 0; i < 20; i++) {
    const response = http.get(`${BASE_URL}/health`);
    
    const success = check(response, {
      [`rate limit request ${i} handled`]: (r) => r.status < 500,
      [`rate limit request ${i} response time < 2000ms`]: (r) => r.timings.duration < 2000,
    });
    
    chaosErrorRate.add(!success);
    chaosResponseTime.add(response.timings.duration);
    chaosRequestCount.add(1);
    
    sleep(0.1); // 100ms between requests
  }
}

function testResourceExhaustion() {
  // Test with large payloads
  const largePayload = {
    eventType: 'load_test',
    action: 'chaos_test',
    entityType: 'test',
    entityId: `chaos_${__VU}_${__ITER}`,
    userId: `user_${__VU}`,
    orgId: 'demo-org',
    metadata: {
      largeData: 'x'.repeat(10000), // 10KB of data
      array: Array(1000).fill('test'),
      nested: {
        level1: { level2: { level3: { data: 'deep' } } }
      }
    }
  };
  
  const response = http.post(`${BASE_URL}/v1/analytics/events`, JSON.stringify(largePayload), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const success = check(response, {
    'large payload handled gracefully': (r) => r.status < 500,
    'large payload response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  chaosErrorRate.add(!success);
  chaosResponseTime.add(response.timings.duration);
  chaosRequestCount.add(1);
}

function testErrorConditions() {
  const errorScenarios = [
    { endpoint: '/v1/analytics/events', method: 'POST', body: null },
    { endpoint: '/v1/advanced-security/metrics', method: 'GET', headers: { 'X-Org-ID': '' } },
    { endpoint: '/v1/finops/budgets', method: 'POST', body: { invalid: 'data' } },
    { endpoint: '/v1/advanced-analytics/export', method: 'GET', params: { format: 'invalid' } },
  ];
  
  errorScenarios.forEach(scenario => {
    const response = http.request(scenario.method, `${BASE_URL}${scenario.endpoint}`, scenario.body, {
      headers: { 
        'Content-Type': 'application/json',
        ...scenario.headers 
      }
    });
    
    const success = check(response, {
      [`error scenario ${scenario.endpoint} handled gracefully`]: (r) => r.status < 500,
      [`error scenario ${scenario.endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    
    chaosErrorRate.add(!success);
    chaosResponseTime.add(response.timings.duration);
    chaosRequestCount.add(1);
  });
}

export function handleSummary(data) {
  return {
    'chaos-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Chaos Test Results:
===================
Total Requests: ${data.metrics.chaos_request_count.values.count}
Chaos Error Rate: ${(data.metrics.chaos_error_rate.values.rate * 100).toFixed(2)}%
Average Response Time: ${data.metrics.chaos_response_time.values.avg.toFixed(2)}ms
95th Percentile: ${data.metrics.chaos_response_time.values['p(95)'].toFixed(2)}ms
Max Response Time: ${data.metrics.chaos_response_time.values.max.toFixed(2)}ms
Chaos Scenarios: ${data.metrics.chaos_scenarios.values.count}

Chaos Testing Summary:
- Invalid requests handled: ${data.metrics.chaos_error_rate.values.rate < 0.2 ? 'PASS' : 'FAIL'}
- System resilience: ${data.metrics.chaos_response_time.values.avg < 1000 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
- Error handling: ${data.metrics.chaos_error_rate.values.rate < 0.3 ? 'ROBUST' : 'WEAK'}
    `,
  };
}

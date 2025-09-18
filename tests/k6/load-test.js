import http from 'k6/http.js';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    error_rate: ['rate<0.05'],        // Custom error rate below 5%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function() {
  // Test health endpoints
  testHealthEndpoints();
  
  // Test analytics endpoints
  testAnalyticsEndpoints();
  
  // Test security endpoints
  testSecurityEndpoints();
  
  // Test FinOps endpoints
  testFinOpsEndpoints();
  
  sleep(1);
}

function testHealthEndpoints() {
  const endpoints = [
    '/health',
    '/health/live',
    '/health/ready',
    '/metrics'
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`);
    const success = check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 200ms`]: (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
}

function testAnalyticsEndpoints() {
  // Test analytics events
  const eventPayload = {
    eventType: 'load_test',
    action: 'k6_test',
    entityType: 'test',
    entityId: `test_${__VU}_${__ITER}`,
    userId: `user_${__VU}`,
    orgId: 'demo-org',
    metadata: { test: true, vu: __VU, iter: __ITER }
  };
  
  const response = http.post(`${BASE_URL}/v1/analytics/events`, JSON.stringify(eventPayload), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const success = check(response, {
    'analytics event status is 201': (r) => r.status === 201,
    'analytics event response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  // Test advanced analytics dashboard
  const dashboardResponse = http.get(`${BASE_URL}/v1/advanced-analytics/dashboard`, {
    headers: { 'X-Org-ID': 'demo-org' }
  });
  
  const dashboardSuccess = check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!dashboardSuccess);
  responseTime.add(dashboardResponse.timings.duration);
  requestCount.add(1);
}

function testSecurityEndpoints() {
  // Test security metrics
  const response = http.get(`${BASE_URL}/v1/advanced-security/metrics`, {
    headers: { 'X-Org-ID': 'demo-org' }
  });
  
  const success = check(response, {
    'security metrics status is 200': (r) => r.status === 200,
    'security metrics response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  // Test threat detection
  const threatPayload = {
    ipAddress: `192.168.1.${__VU}`,
    userAgent: 'k6-load-test',
    endpoint: '/test',
    method: 'GET',
    orgId: 'demo-org'
  };
  
  const threatResponse = http.post(`${BASE_URL}/v1/advanced-security/threats/detect`, JSON.stringify(threatPayload), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const threatSuccess = check(threatResponse, {
    'threat detection status is 200': (r) => r.status === 200,
    'threat detection response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!threatSuccess);
  responseTime.add(threatResponse.timings.duration);
  requestCount.add(1);
}

function testFinOpsEndpoints() {
  // Test FinOps budgets
  const response = http.get(`${BASE_URL}/v1/finops/budgets`, {
    headers: { 'X-Org-ID': 'demo-org' }
  });
  
  const success = check(response, {
    'finops budgets status is 200': (r) => r.status === 200,
    'finops budgets response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  // Test FinOps costs
  const costsResponse = http.get(`${BASE_URL}/v1/finops/costs`, {
    headers: { 'X-Org-ID': 'demo-org' }
  });
  
  const costsSuccess = check(costsResponse, {
    'finops costs status is 200': (r) => r.status === 200,
    'finops costs response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!costsSuccess);
  responseTime.add(costsResponse.timings.duration);
  requestCount.add(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Load Test Results:
==================
Total Requests: ${data.metrics.request_count.values.count}
Error Rate: ${(data.metrics.error_rate.values.rate * 100).toFixed(2)}%
Average Response Time: ${data.metrics.response_time.values.avg.toFixed(2)}ms
95th Percentile: ${data.metrics.response_time.values['p(95)'].toFixed(2)}ms
Max Response Time: ${data.metrics.response_time.values.max.toFixed(2)}ms
    `,
  };
}

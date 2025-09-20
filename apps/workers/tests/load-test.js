import http from 'k6/http.js';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics.js';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check has success field': (r) => JSON.parse(r.body).success === true,
  });
  errorRate.add(healthResponse.status !== 200);
  responseTime.add(healthResponse.timings.duration);

  sleep(1);

  // Test metrics endpoint
  const metricsResponse = http.get(`${BASE_URL}/metrics`);
  check(metricsResponse, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 1000ms': (r) => r.timings.duration < 1000,
    'metrics content type is text/plain': (r) => r.headers['Content-Type'].includes('text/plain'),
  });
  errorRate.add(metricsResponse.status !== 200);
  responseTime.add(metricsResponse.timings.duration);

  sleep(1);

  // Test cron jobs endpoint
  const cronJobsResponse = http.get(`${BASE_URL}/cron/jobs`);
  check(cronJobsResponse, {
    'cron jobs status is 200': (r) => r.status === 200,
    'cron jobs response time < 1000ms': (r) => r.timings.duration < 1000,
    'cron jobs has jobs array': (r) => {
      const body = JSON.parse(r.body);
      return body.success && Array.isArray(body.data.jobs);
    },
  });
  errorRate.add(cronJobsResponse.status !== 200);
  responseTime.add(cronJobsResponse.timings.duration);

  sleep(1);

  // Test cron stats endpoint
  const cronStatsResponse = http.get(`${BASE_URL}/cron/stats`);
  check(cronStatsResponse, {
    'cron stats status is 200': (r) => r.status === 200,
    'cron stats response time < 1000ms': (r) => r.timings.duration < 1000,
    'cron stats has stats object': (r) => {
      const body = JSON.parse(r.body);
      return body.success && typeof body.data.stats === 'object';
    },
  });
  errorRate.add(cronStatsResponse.status !== 200);
  responseTime.add(cronStatsResponse.timings.duration);

  sleep(1);

  // Test email processing endpoint
  const emailData = {
    messageId: `email_${__VU}_${__ITER}`,
    organizationId: `org_${__VU}`
  };

  const emailResponse = http.post(
    `${BASE_URL}/emails/process`,
    JSON.stringify(emailData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  check(emailResponse, {
    'email processing status is 200': (r) => r.status === 200,
    'email processing response time < 2000ms': (r) => r.timings.duration < 2000,
    'email processing has result': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.result;
    },
  });
  errorRate.add(emailResponse.status !== 200);
  responseTime.add(emailResponse.timings.duration);

  sleep(2);

  // Test bulk email processing endpoint
  const bulkEmailData = {
    messageIds: [
      `bulk_email_${__VU}_${__ITER}_1`,
      `bulk_email_${__VU}_${__ITER}_2`,
      `bulk_email_${__VU}_${__ITER}_3`
    ],
    organizationId: `org_${__VU}`
  };

  const bulkEmailResponse = http.post(
    `${BASE_URL}/emails/process/bulk`,
    JSON.stringify(bulkEmailData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  check(bulkEmailResponse, {
    'bulk email processing status is 200': (r) => r.status === 200,
    'bulk email processing response time < 3000ms': (r) => r.timings.duration < 3000,
    'bulk email processing has results array': (r) => {
      const body = JSON.parse(r.body);
      return body.success && Array.isArray(body.data.results);
    },
  });
  errorRate.add(bulkEmailResponse.status !== 200);
  responseTime.add(bulkEmailResponse.timings.duration);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Load Test Results:
==================
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.count}
Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

Thresholds:
- 95th percentile < 2000ms: ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'PASS' : 'FAIL'}
- Error rate < 10%: ${data.metrics.http_req_failed.values.rate < 0.1 ? 'PASS' : 'FAIL'}

Test Duration: ${data.state.testRunDurationMs / 1000}s
    `,
  };
}

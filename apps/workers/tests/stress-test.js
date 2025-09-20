import http from 'k6/http.js';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics.js';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const emailProcessed = new Counter('emails_processed');
const bulkEmailsProcessed = new Counter('bulk_emails_processed');

export const options = {
  stages: [
    { duration: '1m', target: 5 },   // Ramp up to 5 users
    { duration: '2m', target: 5 },   // Stay at 5 users
    { duration: '1m', target: 15 },  // Ramp up to 15 users
    { duration: '3m', target: 15 },  // Stay at 15 users
    { duration: '1m', target: 30 },  // Ramp up to 30 users
    { duration: '3m', target: 30 },  // Stay at 30 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s
    http_req_failed: ['rate<0.2'],     // Error rate must be below 20%
    errors: ['rate<0.2'],              // Custom error rate below 20%
    emails_processed: ['count>100'],   // Process at least 100 emails
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Stress test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(healthResponse.status !== 200);
  responseTime.add(healthResponse.timings.duration);

  sleep(0.5);

  // Stress test email processing with high concurrency
  const emailData = {
    messageId: `stress_email_${__VU}_${__ITER}_${Date.now()}`,
    organizationId: `stress_org_${__VU % 10}` // Limit to 10 orgs to simulate realistic load
  };

  const emailResponse = http.post(
    `${BASE_URL}/emails/process`,
    JSON.stringify(emailData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const emailSuccess = check(emailResponse, {
    'email processing status is 200': (r) => r.status === 200,
    'email processing response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  if (emailSuccess) {
    emailProcessed.add(1);
  }
  
  errorRate.add(emailResponse.status !== 200);
  responseTime.add(emailResponse.timings.duration);

  sleep(0.3);

  // Stress test bulk email processing
  const bulkEmailData = {
    messageIds: Array.from({ length: 5 }, (_, i) => 
      `stress_bulk_${__VU}_${__ITER}_${i}_${Date.now()}`
    ),
    organizationId: `stress_org_${__VU % 10}`
  };

  const bulkEmailResponse = http.post(
    `${BASE_URL}/emails/process/bulk`,
    JSON.stringify(bulkEmailData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const bulkSuccess = check(bulkEmailResponse, {
    'bulk email processing status is 200': (r) => r.status === 200,
    'bulk email processing response time < 5000ms': (r) => r.timings.duration < 5000,
  });
  
  if (bulkSuccess) {
    bulkEmailsProcessed.add(bulkEmailData.messageIds.length);
  }
  
  errorRate.add(bulkEmailResponse.status !== 200);
  responseTime.add(bulkEmailResponse.timings.duration);

  sleep(0.2);

  // Stress test cron endpoints
  const cronJobsResponse = http.get(`${BASE_URL}/cron/jobs`);
  check(cronJobsResponse, {
    'cron jobs status is 200': (r) => r.status === 200,
    'cron jobs response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(cronJobsResponse.status !== 200);
  responseTime.add(cronJobsResponse.timings.duration);

  sleep(0.1);

  // Stress test cron stats
  const cronStatsResponse = http.get(`${BASE_URL}/cron/stats`);
  check(cronStatsResponse, {
    'cron stats status is 200': (r) => r.status === 200,
    'cron stats response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(cronStatsResponse.status !== 200);
  responseTime.add(cronStatsResponse.timings.duration);

  sleep(0.1);

  // Stress test metrics endpoint
  const metricsResponse = http.get(`${BASE_URL}/metrics`);
  check(metricsResponse, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(metricsResponse.status !== 200);
  responseTime.add(metricsResponse.timings.duration);

  sleep(0.1);
}

export function handleSummary(data) {
  const totalEmails = data.metrics.emails_processed ? data.metrics.emails_processed.values.count : 0;
  const totalBulkEmails = data.metrics.bulk_emails_processed ? data.metrics.bulk_emails_processed.values.count : 0;
  const totalEmailOperations = totalEmails + totalBulkEmails;

  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Stress Test Results:
====================
Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s
Max VUs: ${data.state.maxVUs}

Performance Metrics:
- Total Requests: ${data.metrics.http_reqs.values.count}
- Failed Requests: ${data.metrics.http_req_failed.values.count}
- Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
- Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
- 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
- Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

Email Processing:
- Individual Emails Processed: ${totalEmails}
- Bulk Emails Processed: ${totalBulkEmails}
- Total Email Operations: ${totalEmailOperations}
- Emails per Second: ${(totalEmailOperations / (data.state.testRunDurationMs / 1000)).toFixed(2)}

Thresholds:
- 95th percentile < 5000ms: ${data.metrics.http_req_duration.values['p(95)'] < 5000 ? 'PASS' : 'FAIL'}
- Error rate < 20%: ${data.metrics.http_req_failed.values.rate < 0.2 ? 'PASS' : 'FAIL'}
- Emails processed > 100: ${totalEmailOperations > 100 ? 'PASS' : 'FAIL'}

System Health:
- Memory Usage: ${data.metrics.vus_max.values.max} max VUs
- Request Rate: ${(data.metrics.http_reqs.values.count / (data.state.testRunDurationMs / 1000)).toFixed(2)} req/s
    `,
  };
}

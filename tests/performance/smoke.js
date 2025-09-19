// Basic k6 smoke test
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
  },
};

export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:3001';
  
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
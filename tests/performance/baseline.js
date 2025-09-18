// Basic k6 baseline test for nightly runs
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 2,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<3000'], // More relaxed for baseline
  },
};

export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:3001';
  
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  sleep(2);
}
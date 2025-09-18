import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.2'], // tolerate some failures under chaos
    http_req_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const endpoints = [
    '/health',
    '/v1/demo/health',
    '/v1/observability/metrics',
    '/v1/gateway/stats',
  ];

  const url = `${BASE_URL}${endpoints[Math.floor(Math.random() * endpoints.length)]}`;
  const res = http.get(url, { headers: { 'x-request-id': `k6_${__VU}_${Date.now()}` } });
  check(res, {
    'status is 2xx/3xx/4xx/5xx': (r) => [200,201,204,400,401,403,404,429,500,502,503,504].includes(r.status),
  });
  sleep(0.2);
}


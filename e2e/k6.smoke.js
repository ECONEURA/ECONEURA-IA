import http from 'k6/http.js';
import { check } from 'k6';

export default function () {
  const url = __ENV.UI_BASE_URL || 'http://localhost:3000/';
  const res = http.get(url);
  check(res, { 'status 200': (r) => r.status === 200 });
}

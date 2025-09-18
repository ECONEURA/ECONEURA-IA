import http from 'k6/http.js';
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  iterations: 3,
  thresholds: {
    http_req_duration: ['p(95)<2000']
  },
  summaryTrendStats: ['avg', 'p(95)']
};

export default function() {
  const api = http.get('https://econeura-api-dev.azurewebsites.net/health');
  const web = http.get('https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/');
  
  check(api, {
    'api 200': r => r.status === 200
  });
  
  check(web, {
    'web ok': r => [200, 301, 302].includes(r.status)
  });
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    ".artifacts/metrics-k6.json": JSON.stringify(data, null, 2)
  };
}

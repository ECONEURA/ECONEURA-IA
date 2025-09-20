#!/bin/bash

echo "🚀 Running ECONEURA k6 performance tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed. Please install k6 first.${NC}"
    echo "Installation: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Create k6 test directory if it doesn't exist
mkdir -p tests/k6

# Create basic k6 test
cat > tests/k6/basic-load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p95<2000'], // 95% of requests must complete below 2000ms
    http_req_failed: ['rate<0.01'],  // Error rate must be below 1%
  },
};

export default function () {
  // Test API health endpoint
  let response = http.get('http://localhost:3001/health');
  check(response, {
    'API health status is 200': (r) => r.status === 200,
    'API health response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test Web health endpoint
  response = http.get('http://localhost:3000/health');
  check(response, {
    'Web health status is 200': (r) => r.status === 200,
    'Web health response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test AI endpoint (if available)
  response = http.get('http://localhost:3001/v1/ai/health');
  check(response, {
    'AI health status is 200': (r) => r.status === 200,
    'AI health response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
EOF

# Create stress test
cat > tests/k6/stress-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p95<3000'], // 95% of requests must complete below 3000ms
    http_req_failed: ['rate<0.05'],  // Error rate must be below 5%
  },
};

export default function () {
  // Test API endpoints
  let response = http.get('http://localhost:3001/health');
  check(response, {
    'API health status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // Test Web endpoints
  response = http.get('http://localhost:3000/health');
  check(response, {
    'Web health status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
EOF

# Create spike test
cat > tests/k6/spike-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 }, // Normal load
    { duration: '1s', target: 200 }, // Spike to 200 users
    { duration: '10s', target: 10 }, // Back to normal
    { duration: '1s', target: 200 }, // Another spike
    { duration: '10s', target: 10 }, // Back to normal
  ],
  thresholds: {
    http_req_duration: ['p95<5000'], // 95% of requests must complete below 5000ms
    http_req_failed: ['rate<0.1'],   // Error rate must be below 10%
  },
};

export default function () {
  let response = http.get('http://localhost:3001/health');
  check(response, {
    'API health status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
EOF

echo "📋 Running k6 performance tests..."
echo ""

# Run basic load test
echo "🔥 Running basic load test..."
if k6 run tests/k6/basic-load-test.js; then
    echo -e "${GREEN}✅ Basic load test PASSED${NC}"
else
    echo -e "${RED}❌ Basic load test FAILED${NC}"
    exit 1
fi

echo ""

# Run stress test
echo "🔥 Running stress test..."
if k6 run tests/k6/stress-test.js; then
    echo -e "${GREEN}✅ Stress test PASSED${NC}"
else
    echo -e "${RED}❌ Stress test FAILED${NC}"
    exit 1
fi

echo ""

# Run spike test
echo "🔥 Running spike test..."
if k6 run tests/k6/spike-test.js; then
    echo -e "${GREEN}✅ Spike test PASSED${NC}"
else
    echo -e "${RED}❌ Spike test FAILED${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All k6 performance tests PASSED!${NC}"
echo "Performance thresholds met:"
echo "  - p95 response time < 2000ms"
echo "  - Error rate < 1%"
echo "  - System handles load spikes"
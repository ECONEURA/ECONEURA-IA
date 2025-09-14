set -euo pipefail
source scripts/ci/api-env.sh
pnpm -w i
pnpm --filter @econeura/api build >/dev/null 2>&1 || true
pnpm --filter @econeura/api dev &

for i in {1..90}; do
  curl -fsS "http://127.0.0.1:$PORT$HEALTH_PATH" && exit 0
  sleep 2
done
echo "API no arrancó"; exit 1

for i in {1..90}; do
  curl -fsS "http://127.0.0.1:$PORT$HEALTH_PATH" && exit 0
  sleep 2
done
echo "API no arrancó"; exit 1


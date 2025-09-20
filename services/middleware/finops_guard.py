# FinOps guard middleware (ASGI) - integrate into FastAPI apps
import time
from prometheus_client import Counter, Gauge
requests_total = Counter('econeura_requests_total','Total requests', ['agent','tenant'])
cost_gauge = Gauge('econeura_cost_estimate_usd','Estimated cost USD', ['tenant'])
# simple in-memory tenant caps (replace with persistent store)
TENANT_CAPS = {}  # tenant_id -> {'monthly_cap_usd':100.0,'used_usd':0.0}
def estimate_cost(request):
    # placeholder: estimate cost per request based on model_id header or route
    model = request.headers.get('X-Model-Id','default')
    return 0.01 if 'small' in model else 0.05
class FinOpsGuardMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        tenant = None
        for h in scope.get('headers',[]):
            if h[0].decode().lower() == 'x-tenant-id':
                tenant = h[1].decode()
        cost = estimate_cost(scope)
        if tenant:
            cap = TENANT_CAPS.get(tenant, {'monthly_cap_usd':100.0,'used_usd':0.0})
            if cap['used_usd'] + cost > cap['monthly_cap_usd']:
                # throttle or respond with 429
                async def _send(resp):
                    await send({'type':'http.response.start','status':429,'headers':[(b'content-type',b'application/json')]})
                    await send({'type':'http.response.body','body':b'{"error":"quota_exceeded"}'})
                await _send(None)
                return
            else:
                cap['used_usd'] += cost
                TENANT_CAPS[tenant] = cap
                cost_gauge.labels(tenant=tenant).set(cap['used_usd'])
        await self.app(scope, receive, send)

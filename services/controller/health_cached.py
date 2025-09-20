from fastapi import FastAPI
import time, asyncio
app = FastAPI()
health_cache = {}
CACHE_TTL = 30
async def check_upstream(url: str):
    # non-blocking placeholder; operator must replace with real check
    await asyncio.sleep(0.01)
    return {"ok": True}
async def cached_health(service: str, url: str):
    now = time.time()
    if service in health_cache:
        ts, status = health_cache[service]
        if now - ts < CACHE_TTL:
            return status
    status = await check_upstream(url)
    health_cache[service] = (now, status)
    return status
@app.get("/health_cached/{service_name}")
async def hc(service_name: str):
    return await cached_health(service_name, "http://localhost")

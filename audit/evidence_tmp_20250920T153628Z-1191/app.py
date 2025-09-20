from fastapi import FastAPI, Request, Header, HTTPException
import hmac, hashlib, os
app = FastAPI(title="make-adapter")
VAULT_TOKEN = os.environ.get("VAULT_TOKEN","")
# Replace with real Vault retrieval in production
SCENARIOS = {}
@app.post("/register_scenario")
async def register(req: Request):
    body = await req.json()
    scenario_id = body.get("scenario_id")
    SCENARIOS[scenario_id] = body
    return {"status":"ok","scenario_id":scenario_id}
@app.post("/trigger")
async def trigger(req: Request, x_signature: str = Header(None)):
    payload = await req.json()
    # verify signature placeholder
    return {"status":"triggered","payload":payload}

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import threading, time, logging, json, os

app = FastAPI(title="econeura-controller")
LOG = os.environ.get("CONTROLLER_LOG", "/tmp/econeura_controller.log")
logging.basicConfig(filename=LOG, level=logging.INFO)

# In-memory registry (replace with Postgres in prod)
MODEL_REGISTRY = {}
CANARY_STATE = {}

class PromoteRequest(BaseModel):
    model_id: str
    version: str
    canary_percent: int
    reason: str

@app.post("/v1/models/register")
async def register_model(payload: dict):
    model_id = payload.get("model_id")
    MODEL_REGISTRY.setdefault(model_id, []).append(payload)
    logging.info(f"model_registered:{model_id}")
    return {"status":"ok","model_id":model_id}

@app.post("/v1/models/promote")
async def promote(req: PromoteRequest):
    # Non-destructive preview: writes canary intent to state (no deploy)
    trace = f"{req.model_id}:{req.version}"
    CANARY_STATE[trace] = {"canary_percent": req.canary_percent, "status":"pending", "started_at": time.time()}
    logging.info(f"canary_preview:{trace}:{req.canary_percent}")
    return {"status":"canary_preview_created","trace":trace}

@app.post("/v1/models/rollback")
async def rollback(payload: dict):
    trace = payload.get("trace")
    if trace in CANARY_STATE:
        CANARY_STATE[trace]["status"] = "rolled_back"
        logging.info(f"rollback_executed:{trace}")
        return {"status":"rolled_back","trace":trace}
    raise HTTPException(status_code=404, detail="trace not found")

@app.get("/v1/canary_state")
async def canary_state():
    return CANARY_STATE

@app.get("/health")
def health():
    return {"service":"controller","status":"ok"}

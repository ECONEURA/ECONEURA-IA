from fastapi import FastAPI, Request
app = FastAPI(title="neura-ciso")
@app.get("/health")
def health():
    return {"service":"neura-ciso","status":"ok"}
@app.post("/v1/task")
async def task(req: Request):
    payload = await req.json()
    # placeholder: validate contract keys
    return {"status":"accepted","agent":"neura-ciso","task_id":payload.get("task_id")}

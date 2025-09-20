from fastapi import FastAPI, Request
app = FastAPI(title="neura-reception")
@app.get("/health")
def health():
    return {"service":"neura-reception","status":"ok"}
@app.post("/v1/task")
async def task(req: Request):
    payload = await req.json()
    # placeholder: validate contract keys
    return {"status":"accepted","agent":"neura-reception","task_id":payload.get("task_id")}

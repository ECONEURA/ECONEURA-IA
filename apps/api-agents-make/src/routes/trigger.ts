import { Router } from "express";
import fetch from "node-fetch";
import { upsertRun } from "../svc/runs";
import { z } from "zod";

const router = Router();

// Request validation schema
const TriggerRequestSchema = z.object({
  dept: z.string().min(1),
  agentKey: z.string().min(1),
  params: z.record(z.any()).optional(),
  hitl: z.boolean().optional()
});

/**
 * POST /agents/trigger
 * Trigger agent execution via Make webhook
 */
router.post("/trigger", async (req, res) => {
  try {
    // Validate request
    const { dept, agentKey, params, hitl } = TriggerRequestSchema.parse(req.body);

    const runId = crypto.randomUUID();
    const idempotencyKey = req.header("x-idempotency-key") || runId;
    const tenantId = req.header("x-tenant-id") || req.body.tenantId || "demo";

    // Store run in database
    await upsertRun({
      run_id: runId,
      tenant_id: tenantId,
      dept,
      agent_key: agentKey,
      status: "RUNNING",
      progress: 0,
      summary: "Agent execution started"
    });

    // Trigger Make webhook
    const makeResponse = await fetch(process.env.MAKE_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-idempotency-key": idempotencyKey,
        "x-tenant-id": tenantId,
        "x-run-id": runId
      },
      body: JSON.stringify({
        runId,
        tenantId,
        dept,
        agentKey,
        params: params || {},
        hitl: hitl || false,
        timestamp: new Date().toISOString()
      })
    });

    if (!makeResponse.ok) {
      throw new Error(`Make webhook failed: ${makeResponse.status}`);
    }

    // Response with cost tracking headers
    res.set({
      "X-Est-Cost-EUR": "0.001",
      "X-Budget-Pct": "5",
      "X-Latency-ms": "300",
      "X-Route": "agents-trigger",
      "X-Correlation-Id": req.header("x-correlation-id") || crypto.randomUUID()
    });

    res.status(202).json({
      runId,
      status: "RUNNING",
      message: "Agent execution triggered successfully"
    });

  } catch (error) {
    console.error("❌ Trigger error:", error);

    res.status(500).json({
      error: "Agent trigger failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;


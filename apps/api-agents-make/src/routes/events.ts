import { Router } from "express";
import crypto from "crypto";
import { seen, markSeen, upsertRun } from "../svc/runs";
import { z } from "zod";

const router = Router();

// Event validation schema
const EventSchema = z.object({
  runId: z.string(),
  status: z.enum(["RUNNING", "HITL", "FAILED", "COMPLETED"]),
  progress: z.number().min(0).max(100).optional(),
  summary: z.string().optional(),
  error: z.string().optional()
});

/**
 * POST /agents/events
 * Make webhook callback with HMAC verification and idempotency
 */
router.post("/events", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const raw = req.body as Buffer;
    const signature = req.header("x-signature") || "";
    const idempotencyKey = req.header("x-idempotency-key") || "";

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.MAKE_HMAC_SECRET || "")
      .update(raw)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid HMAC signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Check idempotency
    if (idempotencyKey && await seen(idempotencyKey)) {
      console.log("✅ Duplicate event ignored (idempotency)");
      return res.status(200).json({ ok: true, message: "Already processed" });
    }

    // Parse and validate event
    const event = EventSchema.parse(JSON.parse(raw.toString()));

    // Update run status
    await upsertRun({
      run_id: event.runId,
      status: event.status,
      progress: event.progress,
      summary: event.summary || event.error
    });

    // Mark as seen for idempotency
    if (idempotencyKey) {
      await markSeen(idempotencyKey);
    }

    console.log(`📥 Event received: ${event.runId} - ${event.status} (${event.progress}%)`);

    // Response with cost tracking headers
    res.set({
      "X-Est-Cost-EUR": "0.0005",
      "X-Budget-Pct": "2",
      "X-Latency-ms": "150",
      "X-Route": "agents-events",
      "X-Correlation-Id": req.header("x-correlation-id") || crypto.randomUUID()
    });

    res.status(200).json({
      ok: true,
      message: "Event processed successfully",
      runId: event.runId,
      status: event.status
    });

  } catch (error) {
    console.error("❌ Event processing error:", error);

    res.status(400).json({
      error: "Event processing failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;


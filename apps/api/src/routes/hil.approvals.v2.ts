import { Router } from "express";
import type { Request, Response } from "express";

import { requireAADRole } from '../middleware/aadRole.js';

export const hilApprovalsRouterV2 = Router();

// GET /v1/hil?state=pending_approval
hilApprovalsRouterV2.get("/v1/hil", async (req: Request, res: Response) => {
  let prisma: any = null;
  try {
    const db = await import("@econeura/db");
    const getPrisma = (db as unknown as { getPrisma?: () => unknown }).getPrisma;
    prisma = typeof getPrisma === 'function' ? getPrisma() : null;
  } catch {}
  const state = (req.query.state as string) || "pending_approval";
  if (!prisma) return res.status(200).json({ items: [], note:"DB not configured" });
  const items = await prisma.hitl_task.findMany({ where: { state } });
  res.json({ items });
});

// POST /v1/hil/:id/approve
hilApprovalsRouterV2.post("/v1/hil/:id/approve", requireAADRole("approver"), async (req: Request, res: Response) => {
  let prisma: any = null;
  try {
    const db = await import("@econeura/db");
    const getPrisma = (db as unknown as { getPrisma?: () => unknown }).getPrisma;
    prisma = typeof getPrisma === 'function' ? getPrisma() : null;
  } catch {}
  if (!prisma) return res.status(503).json({ type:"about:blank", title:"Service Unavailable", status:503, detail:"DB not configured" });
  const id = req.params.id;
  const task = await prisma.hitl_task.update({ where:{ id }, data:{ state:"approved" }});
  try { await prisma.audit_event.create({ data:{ task_id:id, type:"approved", payload:{ actor: (req as Request & { user?: any }).user?.oid ?? "unknown" } }}); } catch {}
  res.json({ status:"approved", task });
});

// POST /v1/hil/:id/reject
hilApprovalsRouterV2.post("/v1/hil/:id/reject", requireAADRole("approver"), async (req: Request, res: Response) => {
  let prisma: any = null;
  try {
    const db = await import("@econeura/db");
    const getPrisma = (db as unknown as { getPrisma?: () => unknown }).getPrisma;
    prisma = typeof getPrisma === 'function' ? getPrisma() : null;
  } catch {}
  if (!prisma) return res.status(503).json({ type:"about:blank", title:"Service Unavailable", status:503, detail:"DB not configured" });
  const id = req.params.id;
  const reason = (req.body?.reason as string) || "unspecified";
  const task = await prisma.hitl_task.update({ where:{ id }, data:{ state:"rejected" }});
  try { await prisma.audit_event.create({ data:{ task_id:id, type:"rejected", payload:{ reason } }}); } catch {}
  res.json({ status:"rejected", task });
});

import { Router } from "express";
import { requireAADRole } from '../middleware/aadRole.js';
export const hilApprovalsRouterV2 = Router();
hilApprovalsRouterV2.get("/v1/hil", async (req, res) => {
    let prisma = null;
    try {
        const db = await import("@econeura/db");
        const getPrisma = db.getPrisma;
        prisma = typeof getPrisma === 'function' ? getPrisma() : null;
    }
    catch { }
    const state = req.query.state || "pending_approval";
    if (!prisma)
        return res.status(200).json({ items: [], note: "DB not configured" });
    const items = await prisma.hitl_task.findMany({ where: { state } });
    res.json({ items });
});
hilApprovalsRouterV2.post("/v1/hil/:id/approve", requireAADRole("approver"), async (req, res) => {
    let prisma = null;
    try {
        const db = await import("@econeura/db");
        const getPrisma = db.getPrisma;
        prisma = typeof getPrisma === 'function' ? getPrisma() : null;
    }
    catch { }
    if (!prisma)
        return res.status(503).json({ type: "about:blank", title: "Service Unavailable", status: 503, detail: "DB not configured" });
    const id = req.params.id;
    const task = await prisma.hitl_task.update({ where: { id }, data: { state: "approved" } });
    try {
        await prisma.audit_event.create({ data: { task_id: id, type: "approved", payload: { actor: req.user?.oid ?? "unknown" } } });
    }
    catch { }
    res.json({ status: "approved", task });
});
hilApprovalsRouterV2.post("/v1/hil/:id/reject", requireAADRole("approver"), async (req, res) => {
    let prisma = null;
    try {
        const db = await import("@econeura/db");
        const getPrisma = db.getPrisma;
        prisma = typeof getPrisma === 'function' ? getPrisma() : null;
    }
    catch { }
    if (!prisma)
        return res.status(503).json({ type: "about:blank", title: "Service Unavailable", status: 503, detail: "DB not configured" });
    const id = req.params.id;
    const reason = req.body?.reason || "unspecified";
    const task = await prisma.hitl_task.update({ where: { id }, data: { state: "rejected" } });
    try {
        await prisma.audit_event.create({ data: { task_id: id, type: "rejected", payload: { reason } } });
    }
    catch { }
    res.json({ status: "rejected", task });
});
//# sourceMappingURL=hil.approvals.v2.js.map
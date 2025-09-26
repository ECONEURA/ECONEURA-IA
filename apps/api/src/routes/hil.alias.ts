import { Router } from "express";

import { hilApprovals } from './hil.approvals.js';

export const hilAliasRouter = Router();

// Exponer las rutas existentes (ya montan /v1/hitl y /v1/hil dentro)
hilAliasRouter.use("/", hilApprovals);

// Alias legacy /v1/hitl/* → proxy a /v1/hil/* para aprobaciones
hilAliasRouter.post("/v1/hitl/approvals/:task_id/approve", (req, res, next) => {
  req.url = `/v1/hil/approvals/${req.params.task_id}/approve`;
  // Re-dispatch to mounted approvals router by delegating to next middleware stack
  return next();
});

hilAliasRouter.post("/v1/hitl/approvals/:task_id/reject", (req, res, next) => {
  req.url = `/v1/hil/approvals/${req.params.task_id}/reject`;
  return next();
});

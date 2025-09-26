import { Router } from "express";

import { hilApprovals } from './hil.approvals.js';
export const hilAliasRouter = Router();
hilAliasRouter.use("/", hilApprovals);
hilAliasRouter.post("/v1/hitl/approvals/:task_id/approve", (req, res, next) => {
    req.url = `/v1/hil/approvals/${req.params.task_id}/approve`;
    return next();
});
hilAliasRouter.post("/v1/hitl/approvals/:task_id/reject", (req, res, next) => {
    req.url = `/v1/hil/approvals/${req.params.task_id}/reject`;
    return next();
});
//# sourceMappingURL=hil.alias.js.map
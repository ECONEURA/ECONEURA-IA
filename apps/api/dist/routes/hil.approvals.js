import { Router } from 'express';

import { requireAAD } from '../middleware/aad.js';
export const hilApprovals = Router();
hilApprovals.use('/v1/hitl', requireAAD);
hilApprovals.use('/v1/hil', requireAAD);
hilApprovals.post('/v1/hitl/:taskId/approve', (req, res) => {
    return res.status(202).json({ taskId: req.params.taskId, state: 'approved' });
});
hilApprovals.post('/v1/hil/:taskId/approve', (req, res) => {
    res.setHeader('X-Route', req.originalUrl);
    return res.status(202).json({ taskId: req.params.taskId, state: 'approved' });
});
hilApprovals.post('/v1/hitl/:taskId/reject', (req, res) => {
    return res.status(202).json({ taskId: req.params.taskId, state: 'rejected' });
});
hilApprovals.post('/v1/hil/:taskId/reject', (req, res) => {
    res.setHeader('X-Route', req.originalUrl);
    return res.status(202).json({ taskId: req.params.taskId, state: 'rejected' });
});
hilApprovals.post('/v1/hil/approvals/:task_id/approve', (req, res) => {
    res.setHeader('X-Route', req.originalUrl);
    return res.status(202).json({ taskId: req.params.task_id, state: 'approved' });
});
hilApprovals.post('/v1/hil/approvals/:task_id/reject', (req, res) => {
    res.setHeader('X-Route', req.originalUrl);
    return res.status(202).json({ taskId: req.params.task_id, state: 'rejected' });
});
//# sourceMappingURL=hil.approvals.js.map
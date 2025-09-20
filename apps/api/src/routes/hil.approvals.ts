import { Router, type Router as ExpressRouter } from 'express';
import { requireAAD } from '../middleware/aad.js';

export const hilApprovals: ExpressRouter = Router();

// Protección AAD si está activada
hilApprovals.use('/v1/hitl', requireAAD);
hilApprovals.use('/v1/hil', requireAAD);

// Stubs mínimos: aprobar/rechazar
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

// Unificado: /v1/hil/approvals/:task_id/*
hilApprovals.post('/v1/hil/approvals/:task_id/approve', (req, res) => {
  res.setHeader('X-Route', req.originalUrl);
  return res.status(202).json({ taskId: req.params.task_id, state: 'approved' });
});
hilApprovals.post('/v1/hil/approvals/:task_id/reject', (req, res) => {
  res.setHeader('X-Route', req.originalUrl);
  return res.status(202).json({ taskId: req.params.task_id, state: 'rejected' });
});

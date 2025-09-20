import { Router, type Router as ExpressRouter } from 'express';

export const supplierRoutes: ExpressRouter = Router();
supplierRoutes.get('/', (_req, res) => res.json({ suppliers: [] }));

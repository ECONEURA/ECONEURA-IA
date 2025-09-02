import { Router, type Router as ExpressRouter } from 'express';

export const companyRoutes: ExpressRouter = Router();
companyRoutes.get('/', (_req, res) => res.json({ companies: [] }));

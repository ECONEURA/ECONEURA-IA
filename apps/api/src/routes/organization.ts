import { Router, type Router as ExpressRouter } from 'express';

export const organizationRoutes: ExpressRouter = Router();
organizationRoutes.get('/', (_req, res) => res.json({ organizations: [] }));

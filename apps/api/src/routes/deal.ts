import { Router, type Router as ExpressRouter } from 'express';

export const dealRoutes: ExpressRouter = Router();
dealRoutes.get('/', (_req, res) => res.json({ deals: [] }));

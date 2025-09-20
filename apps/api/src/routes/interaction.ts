import { Router, type Router as ExpressRouter } from 'express';

export const interactionRoutes: ExpressRouter = Router();
interactionRoutes.get('/', (_req, res) => res.json({ interactions: [] }));

import { Router } from 'express';

export const interactionRoutes = Router();
interactionRoutes.get('/', (_req, res) => res.json({ interactions: [] }));

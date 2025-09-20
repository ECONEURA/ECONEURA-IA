import { Router, type Router as ExpressRouter } from 'express';

export const contactRoutes: ExpressRouter = Router();
contactRoutes.get('/', (_req, res) => res.json({ contacts: [] }));

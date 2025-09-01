import { Router } from 'express';

export const contactRoutes = Router();
contactRoutes.get('/', (_req, res) => res.json({ contacts: [] }));

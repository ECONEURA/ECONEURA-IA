import { Router } from 'express';

export const supplierRoutes = Router();
supplierRoutes.get('/', (_req, res) => res.json({ suppliers: [] }));

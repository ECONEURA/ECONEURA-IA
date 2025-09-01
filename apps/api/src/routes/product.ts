import { Router } from 'express';

export const productRoutes = Router();
productRoutes.get('/', (_req, res) => res.json({ products: [] }));

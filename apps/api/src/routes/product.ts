import { Router, type Router as ExpressRouter } from 'express';

export const productRoutes: ExpressRouter = Router();
productRoutes.get('/', (_req, res) => res.json({ products: [] }));

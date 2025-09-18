import { Router, type Router as ExpressRouter } from 'express';

export const invoiceRoutes: ExpressRouter = Router();
invoiceRoutes.get('/', (_req, res) => res.json({ invoices: [] }));

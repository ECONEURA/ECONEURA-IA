import { Router } from 'express';

export const invoiceRoutes = Router();
invoiceRoutes.get('/', (_req, res) => res.json({ invoices: [] }));

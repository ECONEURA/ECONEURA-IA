import express, { type Router as ExpressRouter } from 'express';
let helmet: any;
try {
  // prefer import at runtime if available
   
  helmet = require('helmet');
} catch (e) {
  // fallback no-op middleware
  helmet = () => (_req: any, _res: any, next: any) => next();
}
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import { authenticateToken, withTenant } from '../middleware/auth.js';

import { organizationRoutes } from './organization.js';
import { companyRoutes } from './company.js';
import { contactRoutes } from './contact.js';
import { productRoutes } from './product.js';
import { invoiceRoutes } from './invoice.js';
import { supplierRoutes } from './supplier.js';
import { dealRoutes } from './deal.js';
import { interactionRoutes } from './interaction.js';
import { agentsRoutes } from './agents.js';

const router: ExpressRouter = express.Router();

// Configuración de seguridad básica
router.use(helmet());
router.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

router.use(limiter);

// Health check endpoints
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  // TODO: Implementar checks de dependencias (DB, Redis, etc)
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas autenticadas y con tenant
router.use('/v1', authenticateToken, withTenant, [
  organizationRoutes,
  companyRoutes,
  contactRoutes,
  productRoutes,
  invoiceRoutes,
  supplierRoutes,
  dealRoutes,
  agentsRoutes,
  interactionRoutes
]);

export default router;

import express from 'express';
let helmet: any;
try {
  // prefer import at runtime if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  helmet = require('helmet');
} catch (e) {
  // fallback no-op middleware
  helmet = () => (_req: any, _res: any, next: any) => next();
}
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { authenticateToken, withTenant } from '../middleware/auth';
import { organizationRoutes } from './organization';
import { companyRoutes } from './company';
import { contactRoutes } from './contact';
import { productRoutes } from './product';
import { invoiceRoutes } from './invoice';
import { supplierRoutes } from './supplier';
import { dealRoutes } from './deal';
import { interactionRoutes } from './interaction';

const router = express.Router();

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
  interactionRoutes
]);

export default router;

import express from 'express';
let helmet;
try {
    helmet = require('helmet');
}
catch (e) {
    helmet = () => (_req, _res, next) => next();
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
const router = express.Router();
router.use(helmet());
router.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
}));
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
router.use(limiter);
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.get('/ready', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
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
//# sourceMappingURL=index.js.map
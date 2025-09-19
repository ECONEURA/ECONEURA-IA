import { Router } from 'express';
export const companyRoutes = Router();
companyRoutes.get('/', (_req, res) => res.json({ companies: [] }));
//# sourceMappingURL=company.js.map
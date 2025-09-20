import { Router } from 'express';
export const organizationRoutes = Router();
organizationRoutes.get('/', (_req, res) => res.json({ organizations: [] }));
//# sourceMappingURL=organization.js.map
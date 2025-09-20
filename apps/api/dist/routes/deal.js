import { Router } from 'express';
export const dealRoutes = Router();
dealRoutes.get('/', (_req, res) => res.json({ deals: [] }));
//# sourceMappingURL=deal.js.map
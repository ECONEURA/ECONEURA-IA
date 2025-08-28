import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { buildCorsMiddleware } from '@econeura/shared/security/cors';
import { requireOrgId } from '@econeura/shared/security/org-middleware';
import { safeLog } from '@econeura/shared/logging/redact';
// import { aiRouter } from '@econeura/shared/ai/router';
// import { getOrganizationUsage } from '@econeura/shared/ai/usage';

const router = express.Router();
router.use(helmet());
router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
router.use(buildCorsMiddleware());
router.use(requireOrgId);

router.get('/usage', (req, res) => {
  try {
    const orgId = req.header('x-org-id') || 'unknown';
    // const usage = getOrganizationUsage(orgId);
    // Simulación de respuesta
    const usage = {
      daily: 12.34,
      monthly: 123.45,
      limits: {
        perRequestEUR: 5,
        dailyEUR: 50,
        monthlyEUR: 500,
        emergencyStopEnabled: true,
        emergencyStopThresholdEUR: 1500,
      },
      utilizationDaily: 24.7,
      utilizationMonthly: 8.2,
    };
    safeLog('AI usage response', { orgId, usage });
    res.json({
      organization_id: orgId,
      daily_eur: usage.daily,
      monthly_eur: usage.monthly,
      limits: usage.limits,
      utilization: {
        daily_percent: usage.utilizationDaily,
        monthly_percent: usage.utilizationMonthly,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

export default router;

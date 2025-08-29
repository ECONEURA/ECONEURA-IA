import { Router } from 'express';
import { advancedFeaturesController } from '../controllers/advanced-features.controller';
import { validateRequest } from '../mw/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const PredictDemandSchema = z.object({
  productIds: z.array(z.string()).optional()
});

const ShippingProvidersSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  weight: z.number().positive()
});

const PaymentProvidersSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('EUR')
});

const ProcessPaymentSchema = z.object({
  provider: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  paymentData: z.record(z.any()),
  orgId: z.string().optional()
});

const MarketDataSchema = z.object({
  productIds: z.array(z.string()).min(1)
});

const WeatherForecastSchema = z.object({
  location: z.string().min(1),
  days: z.number().min(1).max(14).default(7)
});

const AuditEventsSchema = z.object({
  event_type: z.string().optional(),
  resource_type: z.string().optional(),
  user_id: z.string().optional(),
  severity: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

// AI Predictive Features Routes
router.post(
  '/ai/predict-demand/:orgId',
  validateRequest({ body: PredictDemandSchema }),
  advancedFeaturesController.predictDemand
);

router.post(
  '/ai/optimize-inventory/:orgId',
  advancedFeaturesController.optimizeInventory
);

router.post(
  '/ai/analyze-seasonality/:orgId',
  advancedFeaturesController.analyzeSeasonality
);

router.post(
  '/ai/recommendations/:orgId',
  advancedFeaturesController.generateAIRecommendations
);

// Metrics and KPI Routes
router.get(
  '/metrics/kpi-scorecard/:orgId',
  advancedFeaturesController.getKPIScorecard
);

// External Integrations Routes
router.post(
  '/integrations/shipping/providers',
  validateRequest({ body: ShippingProvidersSchema }),
  advancedFeaturesController.getShippingProviders
);

router.get(
  '/integrations/shipping/track/:carrier/:trackingNumber',
  advancedFeaturesController.trackShipment
);

router.post(
  '/integrations/payment/providers',
  validateRequest({ body: PaymentProvidersSchema }),
  advancedFeaturesController.getPaymentProviders
);

router.post(
  '/integrations/payment/process',
  validateRequest({ body: ProcessPaymentSchema }),
  advancedFeaturesController.processPayment
);

router.post(
  '/integrations/market-data',
  validateRequest({ body: MarketDataSchema }),
  advancedFeaturesController.getMarketData
);

router.get(
  '/integrations/weather/forecast',
  validateRequest({ query: WeatherForecastSchema }),
  advancedFeaturesController.getWeatherForecast
);

router.get(
  '/integrations/health',
  advancedFeaturesController.checkIntegrationHealth
);

// Audit and Compliance Routes
router.get(
  '/audit/events/:orgId',
  validateRequest({ query: AuditEventsSchema }),
  advancedFeaturesController.getAuditEvents
);

router.get(
  '/audit/report/:orgId',
  advancedFeaturesController.generateAuditReport
);

// Combined Dashboard Routes
router.get(
  '/dashboard/data/:orgId',
  advancedFeaturesController.getDashboardData
);

// System Status Routes
router.get(
  '/system/status',
  advancedFeaturesController.getSystemStatus
);

export default router;

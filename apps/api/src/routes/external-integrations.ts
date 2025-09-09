import { Router } from 'express';
import { z } from 'zod';
import { externalIntegrations } from '../services/external-integrations.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ShippingQuoteSchema = z.object({
  providerId: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  weight: z.number().min(0.1).max(1000),
  dimensions: z.object({
    length: z.number().min(0.1).max(1000),
    width: z.number().min(0.1).max(1000),
    height: z.number().min(0.1).max(1000)
  })
});

const PaymentSchema = z.object({
  providerId: z.string().min(1),
  amount: z.number().min(0.01),
  currency: z.string().length(3),
  paymentMethod: z.object({
    type: z.enum(['card', 'bank_account', 'paypal']),
    token: z.string().min(1)
  }),
  metadata: z.record(z.any()).optional()
});

const MarketDataSchema = z.object({
  providerId: z.string().min(1),
  symbol: z.string().min(1).max(10)
});

const MarketDataBatchSchema = z.object({
  providerId: z.string().min(1),
  symbols: z.array(z.string().min(1).max(10)).min(1).max(10)
});

const WeatherSchema = z.object({
  providerId: z.string().min(1),
  location: z.string().min(1)
});

const WeatherForecastSchema = z.object({
  providerId: z.string().min(1),
  location: z.string().min(1),
  days: z.number().min(1).max(10).default(5)
});

const TrackingSchema = z.object({
  providerId: z.string().min(1),
  trackingNumber: z.string().min(1)
});

const RefundSchema = z.object({
  providerId: z.string().min(1),
  transactionId: z.string().min(1),
  amount: z.number().min(0.01).optional()
});

// ============================================================================
// SHIPPING ROUTES
// ============================================================================

/**
 * POST /v1/integrations/shipping/quote
 * Get shipping quote from provider
 */
router.post('/shipping/quote', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = ShippingQuoteSchema.parse(req.body);
    const { providerId, origin, destination, weight, dimensions } = validatedData;

    const quote = await externalIntegrations.getShippingQuote(
      providerId,
      origin,
      destination,
      weight,
      dimensions
    );

    structuredLogger.info('Shipping quote requested', {
      traceId,
      spanId,
      providerId,
      origin,
      destination,
      weight,
      cost: quote.cost
    });

    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Shipping quote validation failed', {
        traceId,
        spanId,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
        traceId
      });
    } else {
      structuredLogger.error('Shipping quote failed', error as Error, {
        traceId,
        spanId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }
});

/**
 * GET /v1/integrations/shipping/track/:providerId/:trackingNumber
 * Track shipment
 */
router.get('/shipping/track/:providerId/:trackingNumber', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = TrackingSchema.parse({
      providerId: req.params.providerId,
      trackingNumber: req.params.trackingNumber
    });

    const tracking = await externalIntegrations.trackShipment(
      validatedData.providerId,
      validatedData.trackingNumber
    );

    structuredLogger.info('Shipment tracking requested', {
      traceId,
      spanId,
      providerId: validatedData.providerId,
      trackingNumber: validatedData.trackingNumber
    });

    res.json({
      success: true,
      data: tracking,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    structuredLogger.error('Shipment tracking failed', error as Error, {
      traceId,
      spanId
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      traceId
    });
  }
});

// ============================================================================
// PAYMENT ROUTES
// ============================================================================

/**
 * POST /v1/integrations/payment/process
 * Process payment
 */
router.post('/payment/process', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = PaymentSchema.parse(req.body);
    const { providerId, amount, currency, paymentMethod, metadata } = validatedData;

    const result = await externalIntegrations.processPayment(
      providerId,
      amount,
      currency,
      paymentMethod,
      metadata
    );

    structuredLogger.info('Payment processed', {
      traceId,
      spanId,
      providerId,
      amount,
      currency,
      transactionId: result.transactionId,
      status: result.status
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Payment validation failed', {
        traceId,
        spanId,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
        traceId
      });
    } else {
      structuredLogger.error('Payment processing failed', error as Error, {
        traceId,
        spanId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }
});

/**
 * POST /v1/integrations/payment/refund
 * Refund payment
 */
router.post('/payment/refund', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = RefundSchema.parse(req.body);
    const { providerId, transactionId, amount } = validatedData;

    const result = await externalIntegrations.refundPayment(
      providerId,
      transactionId,
      amount
    );

    structuredLogger.info('Payment refunded', {
      traceId,
      spanId,
      providerId,
      transactionId,
      amount: result.amount
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Refund validation failed', {
        traceId,
        spanId,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
        traceId
      });
    } else {
      structuredLogger.error('Payment refund failed', error as Error, {
        traceId,
        spanId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }
});

// ============================================================================
// MARKET DATA ROUTES
// ============================================================================

/**
 * GET /v1/integrations/market-data/:providerId/:symbol
 * Get market data for symbol
 */
router.get('/market-data/:providerId/:symbol', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = MarketDataSchema.parse({
      providerId: req.params.providerId,
      symbol: req.params.symbol
    });

    const data = await externalIntegrations.getMarketData(
      validatedData.providerId,
      validatedData.symbol
    );

    structuredLogger.info('Market data requested', {
      traceId,
      spanId,
      providerId: validatedData.providerId,
      symbol: validatedData.symbol,
      price: data.price
    });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    structuredLogger.error('Market data request failed', error as Error, {
      traceId,
      spanId
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      traceId
    });
  }
});

/**
 * POST /v1/integrations/market-data/batch
 * Get market data for multiple symbols
 */
router.post('/market-data/batch', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = MarketDataBatchSchema.parse(req.body);
    const { providerId, symbols } = validatedData;

    const data = await externalIntegrations.getMarketDataBatch(
      providerId,
      symbols
    );

    structuredLogger.info('Market data batch requested', {
      traceId,
      spanId,
      providerId,
      symbolsCount: symbols.length
    });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Market data batch validation failed', {
        traceId,
        spanId,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
        traceId
      });
    } else {
      structuredLogger.error('Market data batch request failed', error as Error, {
        traceId,
        spanId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }
});

// ============================================================================
// WEATHER ROUTES
// ============================================================================

/**
 * GET /v1/integrations/weather/:providerId/:location
 * Get weather data for location
 */
router.get('/weather/:providerId/:location', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = WeatherSchema.parse({
      providerId: req.params.providerId,
      location: req.params.location
    });

    const data = await externalIntegrations.getWeatherData(
      validatedData.providerId,
      validatedData.location
    );

    structuredLogger.info('Weather data requested', {
      traceId,
      spanId,
      providerId: validatedData.providerId,
      location: validatedData.location,
      temperature: data.temperature
    });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    structuredLogger.error('Weather data request failed', error as Error, {
      traceId,
      spanId
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      traceId
    });
  }
});

/**
 * GET /v1/integrations/weather/forecast/:providerId/:location
 * Get weather forecast for location
 */
router.get('/weather/forecast/:providerId/:location', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const validatedData = WeatherForecastSchema.parse({
      providerId: req.params.providerId,
      location: req.params.location,
      days: req.query.days ? parseInt(req.query.days as string) : 5
    });

    const data = await externalIntegrations.getWeatherForecast(
      validatedData.providerId,
      validatedData.location,
      validatedData.days
    );

    structuredLogger.info('Weather forecast requested', {
      traceId,
      spanId,
      providerId: validatedData.providerId,
      location: validatedData.location,
      days: validatedData.days
    });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      structuredLogger.warn('Weather forecast validation failed', {
        traceId,
        spanId,
        errors: error.errors
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
        traceId
      });
    } else {
      structuredLogger.error('Weather forecast request failed', error as Error, {
        traceId,
        spanId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }
});

// ============================================================================
// HEALTH AND STATUS ROUTES
// ============================================================================

/**
 * GET /v1/integrations/health
 * Get health status of all integrations
 */
router.get('/health', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const health = externalIntegrations.getIntegrationHealth();

    structuredLogger.info('Integration health requested', {
      traceId,
      spanId,
      providersCount: health.length
    });

    res.json({
      success: true,
      data: {
        providers: health,
        summary: {
          total: health.length,
          healthy: health.filter(h => h.status === 'healthy').length,
          degraded: health.filter(h => h.status === 'degraded').length,
          down: health.filter(h => h.status === 'down').length
        }
      },
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    structuredLogger.error('Integration health request failed', error as Error, {
      traceId,
      spanId
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      traceId
    });
  }
});

/**
 * GET /v1/integrations/health/:providerId
 * Get health status of specific provider
 */
router.get('/health/:providerId', async (req, res) => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const health = externalIntegrations.getProviderHealth(req.params.providerId);

    if (!health) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
        timestamp: new Date().toISOString(),
        traceId
      });
    }

    structuredLogger.info('Provider health requested', {
      traceId,
      spanId,
      providerId: req.params.providerId,
      status: health.status
    });

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
      traceId
    });
  } catch (error) {
    structuredLogger.error('Provider health request failed', error as Error, {
      traceId,
      spanId
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      traceId
    });
  }
});

export default router;

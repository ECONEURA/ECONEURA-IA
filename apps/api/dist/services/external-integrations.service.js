import { z } from 'zod';

import { logger } from '../lib/logger.js';
import { structuredLogger } from '../lib/structured-logger.js';
const ShippingProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['fedex', 'ups', 'dhl', 'usps', 'custom']),
    apiKey: z.string(),
    apiUrl: z.string().url(),
    isActive: z.boolean().default(true),
    rateLimit: z.object({
        requestsPerMinute: z.number().default(60),
        requestsPerHour: z.number().default(1000)
    }),
    settings: z.record(z.any()).optional()
});
const PaymentProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['stripe', 'paypal', 'square', 'custom']),
    apiKey: z.string(),
    apiUrl: z.string().url(),
    isActive: z.boolean().default(true),
    supportedCurrencies: z.array(z.string()).default(['USD', 'EUR']),
    settings: z.record(z.any()).optional()
});
const MarketDataProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['yahoo', 'alpha_vantage', 'iex', 'custom']),
    apiKey: z.string(),
    apiUrl: z.string().url(),
    isActive: z.boolean().default(true),
    rateLimit: z.object({
        requestsPerMinute: z.number().default(5),
        requestsPerDay: z.number().default(500)
    }),
    settings: z.record(z.any()).optional()
});
const WeatherProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['openweather', 'weather_api', 'accuweather', 'custom']),
    apiKey: z.string(),
    apiUrl: z.string().url(),
    isActive: z.boolean().default(true),
    rateLimit: z.object({
        requestsPerMinute: z.number().default(60),
        requestsPerDay: z.number().default(1000)
    }),
    settings: z.record(z.any()).optional()
});
export class ExternalIntegrationsService {
    shippingProviders = new Map();
    paymentProviders = new Map();
    marketDataProviders = new Map();
    weatherProviders = new Map();
    rateLimiters = new Map();
    healthChecks = new Map();
    constructor() {
        this.initializeDefaultProviders();
        this.startHealthChecks();
        this.startRateLimitCleanup();
        logger.info('External Integrations Service initialized', {
            shippingProviders: this.shippingProviders.size,
            paymentProviders: this.paymentProviders.size,
            marketDataProviders: this.marketDataProviders.size,
            weatherProviders: this.weatherProviders.size
        });
    }
    async getShippingQuote(providerId, origin, destination, weight, dimensions) {
        const provider = this.shippingProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Shipping provider ${providerId} not found or inactive`);
        }
        if (!this.checkRateLimit(providerId, provider.rateLimit.requestsPerMinute)) {
            throw new Error(`Rate limit exceeded for provider ${providerId}`);
        }
        try {
            const startTime = Date.now();
            const quote = await this.simulateShippingAPI(provider, origin, destination, weight, dimensions);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            structuredLogger.info('Shipping quote retrieved', {
                providerId,
                origin,
                destination,
                weight,
                cost: quote.cost,
                responseTime
            });
            return quote;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async trackShipment(providerId, trackingNumber) {
        const provider = this.shippingProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Shipping provider ${providerId} not found or inactive`);
        }
        try {
            const startTime = Date.now();
            const tracking = await this.simulateTrackingAPI(provider, trackingNumber);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return tracking;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async processPayment(providerId, amount, currency, paymentMethod, metadata) {
        const provider = this.paymentProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Payment provider ${providerId} not found or inactive`);
        }
        if (!provider.supportedCurrencies.includes(currency)) {
            throw new Error(`Currency ${currency} not supported by provider ${providerId}`);
        }
        try {
            const startTime = Date.now();
            const result = await this.simulatePaymentAPI(provider, amount, currency, paymentMethod, metadata);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            structuredLogger.info('Payment processed', {
                providerId,
                amount,
                currency,
                transactionId: result.transactionId,
                status: result.status,
                responseTime
            });
            return result;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async refundPayment(providerId, transactionId, amount) {
        const provider = this.paymentProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Payment provider ${providerId} not found or inactive`);
        }
        try {
            const startTime = Date.now();
            const result = await this.simulateRefundAPI(provider, transactionId, amount);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return result;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async getMarketData(providerId, symbol) {
        const provider = this.marketDataProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Market data provider ${providerId} not found or inactive`);
        }
        if (!this.checkRateLimit(providerId, provider.rateLimit.requestsPerMinute)) {
            throw new Error(`Rate limit exceeded for provider ${providerId}`);
        }
        try {
            const startTime = Date.now();
            const data = await this.simulateMarketDataAPI(provider, symbol);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return data;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async getMarketDataBatch(providerId, symbols) {
        const provider = this.marketDataProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Market data provider ${providerId} not found or inactive`);
        }
        if (symbols.length > 10) {
            throw new Error('Maximum 10 symbols allowed per batch request');
        }
        try {
            const startTime = Date.now();
            const results = await Promise.all(symbols.map(symbol => this.simulateMarketDataAPI(provider, symbol)));
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return results;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async getWeatherData(providerId, location) {
        const provider = this.weatherProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Weather provider ${providerId} not found or inactive`);
        }
        if (!this.checkRateLimit(providerId, provider.rateLimit.requestsPerMinute)) {
            throw new Error(`Rate limit exceeded for provider ${providerId}`);
        }
        try {
            const startTime = Date.now();
            const data = await this.simulateWeatherAPI(provider, location);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return data;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    async getWeatherForecast(providerId, location, days = 5) {
        const provider = this.weatherProviders.get(providerId);
        if (!provider || !provider.isActive) {
            throw new Error(`Weather provider ${providerId} not found or inactive`);
        }
        if (days > 10) {
            throw new Error('Maximum 10 days forecast allowed');
        }
        try {
            const startTime = Date.now();
            const data = await this.simulateWeatherForecastAPI(provider, location, days);
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
            return data;
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
            throw error;
        }
    }
    addShippingProvider(provider) {
        const id = `shipping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider = { ...provider, id };
        this.shippingProviders.set(id, newProvider);
        this.initializeHealthCheck(id);
        logger.info('Shipping provider added', { providerId: id, name: provider.name });
        return id;
    }
    addPaymentProvider(provider) {
        const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider = { ...provider, id };
        this.paymentProviders.set(id, newProvider);
        this.initializeHealthCheck(id);
        logger.info('Payment provider added', { providerId: id, name: provider.name });
        return id;
    }
    addMarketDataProvider(provider) {
        const id = `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider = { ...provider, id };
        this.marketDataProviders.set(id, newProvider);
        this.initializeHealthCheck(id);
        logger.info('Market data provider added', { providerId: id, name: provider.name });
        return id;
    }
    addWeatherProvider(provider) {
        const id = `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProvider = { ...provider, id };
        this.weatherProviders.set(id, newProvider);
        this.initializeHealthCheck(id);
        logger.info('Weather provider added', { providerId: id, name: provider.name });
        return id;
    }
    getIntegrationHealth() {
        return Array.from(this.healthChecks.values());
    }
    getProviderHealth(providerId) {
        return this.healthChecks.get(providerId) || null;
    }
    checkRateLimit(providerId, limit) {
        const now = Date.now();
        const key = `${providerId}_${Math.floor(now / 60000)}`;
        const current = this.rateLimiters.get(key) || { count: 0, resetTime: now + 60000 };
        if (current.count >= limit) {
            return false;
        }
        current.count++;
        this.rateLimiters.set(key, current);
        return true;
    }
    updateHealthCheck(providerId, status, responseTime, isError = false) {
        const health = this.healthChecks.get(providerId);
        if (!health)
            return;
        health.status = status;
        health.responseTime = responseTime;
        health.lastCheck = new Date();
        if (isError) {
            health.errorRate = Math.min(health.errorRate + 0.1, 1.0);
        }
        else {
            health.errorRate = Math.max(health.errorRate - 0.05, 0.0);
        }
    }
    initializeHealthCheck(providerId) {
        this.healthChecks.set(providerId, {
            provider: providerId,
            status: 'healthy',
            responseTime: 0,
            lastCheck: new Date(),
            errorRate: 0,
            uptime: 100
        });
    }
    startHealthChecks() {
        setInterval(() => {
            for (const [providerId] of this.healthChecks) {
                this.performHealthCheck(providerId);
            }
        }, 60000);
    }
    startRateLimitCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.rateLimiters) {
                if (data.resetTime < now) {
                    this.rateLimiters.delete(key);
                }
            }
        }, 60000);
    }
    async performHealthCheck(providerId) {
        const startTime = Date.now();
        try {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            const responseTime = Date.now() - startTime;
            this.updateHealthCheck(providerId, 'healthy', responseTime);
        }
        catch (error) {
            this.updateHealthCheck(providerId, 'down', 0, true);
        }
    }
    async simulateShippingAPI(provider, origin, destination, weight, dimensions) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
        const baseCost = weight * 0.5 + (dimensions.length * dimensions.width * dimensions.height) * 0.01;
        const cost = baseCost * (1 + Math.random() * 0.5);
        return {
            provider: provider.name,
            service: 'Standard',
            cost: Math.round(cost * 100) / 100,
            currency: 'USD',
            estimatedDays: Math.floor(Math.random() * 5) + 1,
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
    async simulateTrackingAPI(provider, trackingNumber) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 50));
        return {
            trackingNumber,
            status: 'In Transit',
            location: 'Distribution Center',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            history: [
                {
                    status: 'Picked Up',
                    location: 'Origin',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                },
                {
                    status: 'In Transit',
                    location: 'Distribution Center',
                    timestamp: new Date()
                }
            ]
        };
    }
    async simulatePaymentAPI(provider, amount, currency, paymentMethod, metadata) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
        const success = Math.random() > 0.05;
        const fees = amount * 0.029 + 0.30;
        return {
            provider: provider.name,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: success ? 'success' : 'failed',
            amount,
            currency,
            fees: success ? fees : 0,
            timestamp: new Date(),
            metadata
        };
    }
    async simulateRefundAPI(provider, transactionId, amount) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 150));
        return {
            provider: provider.name,
            transactionId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'success',
            amount: amount || 0,
            currency: 'USD',
            fees: 0,
            timestamp: new Date()
        };
    }
    async simulateMarketDataAPI(provider, symbol) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
        const basePrice = 100 + Math.random() * 200;
        const change = (Math.random() - 0.5) * 10;
        const changePercent = (change / basePrice) * 100;
        return {
            symbol,
            price: Math.round(basePrice * 100) / 100,
            currency: 'USD',
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            volume: Math.floor(Math.random() * 1000000),
            timestamp: new Date()
        };
    }
    async simulateWeatherAPI(provider, location) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
        return {
            location,
            temperature: Math.round((20 + Math.random() * 20) * 10) / 10,
            humidity: Math.round((30 + Math.random() * 40) * 10) / 10,
            description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
            windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
            timestamp: new Date()
        };
    }
    async simulateWeatherForecastAPI(provider, location, days) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
        const forecast = [];
        for (let i = 1; i <= days; i++) {
            forecast.push({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
                temperature: Math.round((15 + Math.random() * 25) * 10) / 10,
                description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
            });
        }
        return {
            location,
            temperature: Math.round((20 + Math.random() * 20) * 10) / 10,
            humidity: Math.round((30 + Math.random() * 40) * 10) / 10,
            description: 'Current conditions',
            windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
            timestamp: new Date(),
            forecast
        };
    }
    initializeDefaultProviders() {
        this.addShippingProvider({
            name: 'FedEx',
            type: 'fedex',
            apiKey: process.env.FEDEX_API_KEY || 'demo_key',
            apiUrl: 'https://api.fedex.com',
            rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }
        });
        this.addShippingProvider({
            name: 'UPS',
            type: 'ups',
            apiKey: process.env.UPS_API_KEY || 'demo_key',
            apiUrl: 'https://api.ups.com',
            rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }
        });
        this.addPaymentProvider({
            name: 'Stripe',
            type: 'stripe',
            apiKey: process.env.STRIPE_API_KEY || 'demo_key',
            apiUrl: 'https://api.stripe.com',
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD']
        });
        this.addPaymentProvider({
            name: 'PayPal',
            type: 'paypal',
            apiKey: process.env.PAYPAL_API_KEY || 'demo_key',
            apiUrl: 'https://api.paypal.com',
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
        });
        this.addMarketDataProvider({
            name: 'Alpha Vantage',
            type: 'alpha_vantage',
            apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo_key',
            apiUrl: 'https://www.alphavantage.co/query',
            rateLimit: { requestsPerMinute: 5, requestsPerDay: 500 }
        });
        this.addWeatherProvider({
            name: 'OpenWeather',
            type: 'openweather',
            apiKey: process.env.OPENWEATHER_API_KEY || 'demo_key',
            apiUrl: 'https://api.openweathermap.org/data/2.5',
            rateLimit: { requestsPerMinute: 60, requestsPerDay: 1000 }
        });
    }
}
export const externalIntegrations = new ExternalIntegrationsService();
//# sourceMappingURL=external-integrations.service.js.map
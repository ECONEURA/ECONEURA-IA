import { z } from 'zod';
declare const ShippingProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["fedex", "ups", "dhl", "usps", "custom"]>;
    apiKey: z.ZodString;
    apiUrl: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    rateLimit: z.ZodObject<{
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        requestsPerHour: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    }, {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    }>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "custom" | "fedex" | "ups" | "dhl" | "usps";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    };
    apiUrl?: string;
}, {
    type?: "custom" | "fedex" | "ups" | "dhl" | "usps";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    };
    apiUrl?: string;
}>;
declare const PaymentProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["stripe", "paypal", "square", "custom"]>;
    apiKey: z.ZodString;
    apiUrl: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    supportedCurrencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "custom" | "paypal" | "stripe" | "square";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    apiUrl?: string;
    supportedCurrencies?: string[];
}, {
    type?: "custom" | "paypal" | "stripe" | "square";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    apiUrl?: string;
    supportedCurrencies?: string[];
}>;
declare const MarketDataProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["yahoo", "alpha_vantage", "iex", "custom"]>;
    apiKey: z.ZodString;
    apiUrl: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    rateLimit: z.ZodObject<{
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        requestsPerDay: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    }, {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    }>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "custom" | "yahoo" | "alpha_vantage" | "iex";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    };
    apiUrl?: string;
}, {
    type?: "custom" | "yahoo" | "alpha_vantage" | "iex";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    };
    apiUrl?: string;
}>;
declare const WeatherProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["openweather", "weather_api", "accuweather", "custom"]>;
    apiKey: z.ZodString;
    apiUrl: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    rateLimit: z.ZodObject<{
        requestsPerMinute: z.ZodDefault<z.ZodNumber>;
        requestsPerDay: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    }, {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    }>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "custom" | "openweather" | "weather_api" | "accuweather";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    };
    apiUrl?: string;
}, {
    type?: "custom" | "openweather" | "weather_api" | "accuweather";
    name?: string;
    id?: string;
    isActive?: boolean;
    settings?: Record<string, any>;
    apiKey?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        requestsPerDay?: number;
    };
    apiUrl?: string;
}>;
export type ShippingProvider = z.infer<typeof ShippingProviderSchema>;
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;
export type MarketDataProvider = z.infer<typeof MarketDataProviderSchema>;
export type WeatherProvider = z.infer<typeof WeatherProviderSchema>;
export interface ShippingQuote {
    provider: string;
    service: string;
    cost: number;
    currency: string;
    estimatedDays: number;
    trackingNumber?: string;
    validUntil: Date;
}
export interface PaymentResult {
    provider: string;
    transactionId: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    currency: string;
    fees: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface MarketData {
    symbol: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface WeatherData {
    location: string;
    temperature: number;
    humidity: number;
    description: string;
    windSpeed: number;
    timestamp: Date;
    forecast?: Array<{
        date: Date;
        temperature: number;
        description: string;
    }>;
}
export interface IntegrationHealth {
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    lastCheck: Date;
    errorRate: number;
    uptime: number;
}
export declare class ExternalIntegrationsService {
    private shippingProviders;
    private paymentProviders;
    private marketDataProviders;
    private weatherProviders;
    private rateLimiters;
    private healthChecks;
    constructor();
    getShippingQuote(providerId: string, origin: string, destination: string, weight: number, dimensions: {
        length: number;
        width: number;
        height: number;
    }): Promise<ShippingQuote>;
    trackShipment(providerId: string, trackingNumber: string): Promise<any>;
    processPayment(providerId: string, amount: number, currency: string, paymentMethod: any, metadata?: Record<string, any>): Promise<PaymentResult>;
    refundPayment(providerId: string, transactionId: string, amount?: number): Promise<PaymentResult>;
    getMarketData(providerId: string, symbol: string): Promise<MarketData>;
    getMarketDataBatch(providerId: string, symbols: string[]): Promise<MarketData[]>;
    getWeatherData(providerId: string, location: string): Promise<WeatherData>;
    getWeatherForecast(providerId: string, location: string, days?: number): Promise<WeatherData>;
    addShippingProvider(provider: Omit<ShippingProvider, 'id'>): string;
    addPaymentProvider(provider: Omit<PaymentProvider, 'id'>): string;
    addMarketDataProvider(provider: Omit<MarketDataProvider, 'id'>): string;
    addWeatherProvider(provider: Omit<WeatherProvider, 'id'>): string;
    getIntegrationHealth(): IntegrationHealth[];
    getProviderHealth(providerId: string): IntegrationHealth | null;
    private checkRateLimit;
    private updateHealthCheck;
    private initializeHealthCheck;
    private startHealthChecks;
    private startRateLimitCleanup;
    private performHealthCheck;
    private simulateShippingAPI;
    private simulateTrackingAPI;
    private simulatePaymentAPI;
    private simulateRefundAPI;
    private simulateMarketDataAPI;
    private simulateWeatherAPI;
    private simulateWeatherForecastAPI;
    private initializeDefaultProviders;
}
export declare const externalIntegrations: ExternalIntegrationsService;
export {};
//# sourceMappingURL=external-integrations.service.d.ts.map
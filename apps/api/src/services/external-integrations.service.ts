import { logger } from '../lib/logger';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ExternalAPIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    api_name: string;
    endpoint: string;
    response_time: number;
    timestamp: Date;
    retry_count: number;
  };
}

export interface ShippingProvider {
  id: string;
  name: string;
  tracking_url: string;
  delivery_time: string;
  cost: number;
  reliability: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  transaction_fee: number;
  processing_time: string;
  supported_currencies: string[];
  security_level: 'high' | 'medium' | 'low';
}

export interface MarketData {
  product_id: string;
  competitor_prices: Array<{
    competitor: string;
    price: number;
    currency: string;
    last_updated: Date;
  }>;
  market_average: number;
  price_position: 'above' | 'below' | 'average';
  price_recommendation: number;
}

export class ExternalIntegrationsService {
  private apiClients: Map<string, AxiosInstance> = new Map();
  private rateLimitTrackers: Map<string, { requests: number[]; windowStart: number }> = new Map();

  constructor() {
    this.initializeAPIClients();
  }

  // Initialize API clients for different services
  private initializeAPIClients() {
    const configs: ExternalAPIConfig[] = [
      {
        name: 'shipping_api',
        baseUrl: process.env.SHIPPING_API_URL || 'https://api.shipping-provider.com',
        apiKey: process.env.SHIPPING_API_KEY,
        timeout: 10000,
        retries: 3,
        rateLimit: { requests: 100, window: 60000 }
      },
      {
        name: 'payment_api',
        baseUrl: process.env.PAYMENT_API_URL || 'https://api.payment-provider.com',
        apiKey: process.env.PAYMENT_API_KEY,
        timeout: 15000,
        retries: 3,
        rateLimit: { requests: 50, window: 60000 }
      },
      {
        name: 'market_data_api',
        baseUrl: process.env.MARKET_DATA_API_URL || 'https://api.market-data.com',
        apiKey: process.env.MARKET_DATA_API_KEY,
        timeout: 8000,
        retries: 2,
        rateLimit: { requests: 200, window: 60000 }
      },
      {
        name: 'weather_api',
        baseUrl: process.env.WEATHER_API_URL || 'https://api.weather.com',
        apiKey: process.env.WEATHER_API_KEY,
        timeout: 5000,
        retries: 2,
        rateLimit: { requests: 1000, window: 60000 }
      }
    ];

    configs.forEach(config => {
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: {
          'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
          'Content-Type': 'application/json',
          'User-Agent': 'ECONEURA-Inventory-System/1.0'
        }
      });

      this.apiClients.set(config.name, client);
      this.rateLimitTrackers.set(config.name, { requests: [], windowStart: Date.now() });
    });
  }

  // Generic method to make API calls with rate limiting and retries
  private async makeAPICall<T>(
    apiName: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    retryCount = 0
  ): Promise<IntegrationResult<T>> {
    const startTime = Date.now();
    const client = this.apiClients.get(apiName);
    const config = this.getAPIConfig(apiName);

    if (!client || !config) {
      return {
        success: false,
        error: `API client not configured for ${apiName}`,
        metadata: {
          api_name: apiName,
          endpoint,
          response_time: Date.now() - startTime,
          timestamp: new Date(),
          retry_count: retryCount
        }
      };
    }

    // Check rate limiting
    if (!this.checkRateLimit(apiName, config.rateLimit)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        metadata: {
          api_name: apiName,
          endpoint,
          response_time: Date.now() - startTime,
          timestamp: new Date(),
          retry_count: retryCount
        }
      };
    }

    try {
      const response: AxiosResponse<T> = await client.request({
        method,
        url: endpoint,
        data,
        headers: {
          'X-Request-ID': this.generateRequestId(),
          'X-Organization-ID': process.env.ORG_ID
        }
      });

      this.recordAPICall(apiName);

      return {
        success: true,
        data: response.data,
        metadata: {
          api_name: apiName,
          endpoint,
          response_time: Date.now() - startTime,
          timestamp: new Date(),
          retry_count: retryCount
        }
      };
    } catch (error: any) {
      logger.error(`API call failed for ${apiName}:`, error.message);

      // Retry logic
      if (retryCount < config.retries && this.shouldRetry(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await this.sleep(delay);
        return this.makeAPICall(apiName, endpoint, method, data, retryCount + 1);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        metadata: {
          api_name: apiName,
          endpoint,
          response_time: Date.now() - startTime,
          timestamp: new Date(),
          retry_count: retryCount
        }
      };
    }
  }

  // Shipping integration methods
  async getShippingProviders(origin: string, destination: string, weight: number): Promise<IntegrationResult<ShippingProvider[]>> {
    try {
      const result = await this.makeAPICall<ShippingProvider[]>(
        'shipping_api',
        '/providers',
        'POST',
        { origin, destination, weight }
      );

      if (result.success && result.data) {
        // Mock data for demonstration
        result.data = [
          {
            id: 'fedex_express',
            name: 'FedEx Express',
            tracking_url: 'https://www.fedex.com/tracking',
            delivery_time: '1-2 business days',
            cost: 25.99,
            reliability: 95
          },
          {
            id: 'ups_ground',
            name: 'UPS Ground',
            tracking_url: 'https://www.ups.com/track',
            delivery_time: '3-5 business days',
            cost: 15.50,
            reliability: 92
          },
          {
            id: 'dhl_standard',
            name: 'DHL Standard',
            tracking_url: 'https://www.dhl.com/tracking',
            delivery_time: '2-4 business days',
            cost: 18.75,
            reliability: 88
          }
        ];
      }

      return result;
    } catch (error) {
      logger.error('Error getting shipping providers:', error);
      throw error;
    }
  }

  async trackShipment(trackingNumber: string, carrier: string): Promise<IntegrationResult<any>> {
    try {
      const result = await this.makeAPICall(
        'shipping_api',
        `/track/${carrier}/${trackingNumber}`
      );

      if (result.success) {
        // Mock tracking data
        result.data = {
          tracking_number: trackingNumber,
          carrier,
          status: 'in_transit',
          estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          current_location: 'Madrid, Spain',
          history: [
            {
              timestamp: new Date(),
              status: 'in_transit',
              location: 'Madrid, Spain',
              description: 'Package in transit'
            }
          ]
        };
      }

      return result;
    } catch (error) {
      logger.error('Error tracking shipment:', error);
      throw error;
    }
  }

  // Payment integration methods
  async getPaymentProviders(amount: number, currency: string = 'EUR'): Promise<IntegrationResult<PaymentProvider[]>> {
    try {
      const result = await this.makeAPICall<PaymentProvider[]>(
        'payment_api',
        '/providers',
        'POST',
        { amount, currency }
      );

      if (result.success && result.data) {
        // Mock payment providers
        result.data = [
          {
            id: 'stripe',
            name: 'Stripe',
            transaction_fee: 0.029,
            processing_time: '2-3 business days',
            supported_currencies: ['EUR', 'USD', 'GBP'],
            security_level: 'high'
          },
          {
            id: 'paypal',
            name: 'PayPal',
            transaction_fee: 0.035,
            processing_time: '1-2 business days',
            supported_currencies: ['EUR', 'USD', 'GBP'],
            security_level: 'high'
          },
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            transaction_fee: 0.005,
            processing_time: '3-5 business days',
            supported_currencies: ['EUR'],
            security_level: 'high'
          }
        ];
      }

      return result;
    } catch (error) {
      logger.error('Error getting payment providers:', error);
      throw error;
    }
  }

  async processPayment(
    provider: string,
    amount: number,
    currency: string,
    paymentData: any
  ): Promise<IntegrationResult<any>> {
    try {
      const result = await this.makeAPICall(
        'payment_api',
        `/payments/${provider}`,
        'POST',
        { amount, currency, ...paymentData }
      );

      if (result.success) {
        // Mock payment result
        result.data = {
          transaction_id: `txn_${Date.now()}`,
          status: 'completed',
          amount,
          currency,
          provider,
          timestamp: new Date(),
          fee: amount * 0.029
        };
      }

      return result;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  // Market data integration methods
  async getMarketData(productIds: string[]): Promise<IntegrationResult<MarketData[]>> {
    try {
      const result = await this.makeAPICall<MarketData[]>(
        'market_data_api',
        '/market-data',
        'POST',
        { product_ids: productIds }
      );

      if (result.success && result.data) {
        // Mock market data
        result.data = productIds.map(id => ({
          product_id: id,
          competitor_prices: [
            { competitor: 'Competitor A', price: 45.99, currency: 'EUR', last_updated: new Date() },
            { competitor: 'Competitor B', price: 42.50, currency: 'EUR', last_updated: new Date() },
            { competitor: 'Competitor C', price: 48.75, currency: 'EUR', last_updated: new Date() }
          ],
          market_average: 45.75,
          price_position: 'average' as const,
          price_recommendation: 44.99
        }));
      }

      return result;
    } catch (error) {
      logger.error('Error getting market data:', error);
      throw error;
    }
  }

  // Weather integration for logistics planning
  async getWeatherForecast(location: string, days: number = 7): Promise<IntegrationResult<any>> {
    try {
      const result = await this.makeAPICall(
        'weather_api',
        `/forecast/${location}`,
        'GET',
        { days }
      );

      if (result.success) {
        // Mock weather data
        result.data = {
          location,
          forecast: Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            temperature: { min: 15 + Math.random() * 10, max: 25 + Math.random() * 10 },
            condition: ['sunny', 'cloudy', 'rainy', 'partly_cloudy'][Math.floor(Math.random() * 4)],
            precipitation_chance: Math.random() * 100,
            wind_speed: 5 + Math.random() * 15
          }))
        };
      }

      return result;
    } catch (error) {
      logger.error('Error getting weather forecast:', error);
      throw error;
    }
  }

  // Utility methods
  private getAPIConfig(apiName: string): ExternalAPIConfig | null {
    const configs = {
      shipping_api: {
        name: 'shipping_api',
        baseUrl: process.env.SHIPPING_API_URL || 'https://api.shipping-provider.com',
        apiKey: process.env.SHIPPING_API_KEY,
        timeout: 10000,
        retries: 3,
        rateLimit: { requests: 100, window: 60000 }
      },
      payment_api: {
        name: 'payment_api',
        baseUrl: process.env.PAYMENT_API_URL || 'https://api.payment-provider.com',
        apiKey: process.env.PAYMENT_API_KEY,
        timeout: 15000,
        retries: 3,
        rateLimit: { requests: 50, window: 60000 }
      },
      market_data_api: {
        name: 'market_data_api',
        baseUrl: process.env.MARKET_DATA_API_URL || 'https://api.market-data.com',
        apiKey: process.env.MARKET_DATA_API_KEY,
        timeout: 8000,
        retries: 2,
        rateLimit: { requests: 200, window: 60000 }
      },
      weather_api: {
        name: 'weather_api',
        baseUrl: process.env.WEATHER_API_URL || 'https://api.weather.com',
        apiKey: process.env.WEATHER_API_KEY,
        timeout: 5000,
        retries: 2,
        rateLimit: { requests: 1000, window: 60000 }
      }
    };

    return configs[apiName as keyof typeof configs] || null;
  }

  private checkRateLimit(apiName: string, rateLimit: { requests: number; window: number }): boolean {
    const tracker = this.rateLimitTrackers.get(apiName);
    if (!tracker) return true;

    const now = Date.now();
    const windowStart = tracker.windowStart;
    const windowEnd = windowStart + rateLimit.window;

    // Reset window if expired
    if (now > windowEnd) {
      tracker.requests = [];
      tracker.windowStart = now;
      return true;
    }

    // Remove old requests outside the window
    tracker.requests = tracker.requests.filter(timestamp => timestamp > windowStart);

    // Check if we're within rate limit
    return tracker.requests.length < rateLimit.requests;
  }

  private recordAPICall(apiName: string): void {
    const tracker = this.rateLimitTrackers.get(apiName);
    if (tracker) {
      tracker.requests.push(Date.now());
    }
  }

  private shouldRetry(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.response?.status) || error.code === 'ECONNABORTED';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check for all integrations
  async checkIntegrationHealth(): Promise<Record<string, { status: 'healthy' | 'unhealthy'; response_time: number; last_check: Date }>> {
    const healthStatus: Record<string, { status: 'healthy' | 'unhealthy'; response_time: number; last_check: Date }> = {};

    for (const [apiName, client] of this.apiClients) {
      const startTime = Date.now();
      try {
        await client.get('/health');
        healthStatus[apiName] = {
          status: 'healthy',
          response_time: Date.now() - startTime,
          last_check: new Date()
        };
      } catch (error) {
        healthStatus[apiName] = {
          status: 'unhealthy',
          response_time: Date.now() - startTime,
          last_check: new Date()
        };
      }
    }

    return healthStatus;
  }
}

export const externalIntegrationsService = new ExternalIntegrationsService();


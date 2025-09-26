import axios from 'axios';

import { structuredLogger } from './structured-logger.js';

// Stripe Integration
export class StripeIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor() {
    this.apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_demo';
  }

  async createPaymentIntent(amount: number, currency = 'eur', metadata = {}): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/payment_intents`, {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      structuredLogger.info('Stripe payment intent created', {
        paymentIntentId: response.data.id,
        amount,
        currency
      });

      return response.data;
    } catch (error) {
      structuredLogger.error('Stripe payment intent failed', error as Error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/payment_intents/${paymentIntentId}/confirm`, {}, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      structuredLogger.error('Stripe payment confirmation failed', error as Error);
      throw error;
    }
  }
}

// Microsoft Graph Integration
export class GraphIntegration {
  private accessToken: string;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  constructor() {
    this.accessToken = process.env.GRAPH_ACCESS_TOKEN || 'demo-token';
  }

  async sendEmail(to: string[], subject: string, body: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/me/sendMail`, {
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: body
          },
          toRecipients: to.map(email => ({
            emailAddress: { address: email }
          }))
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      structuredLogger.info('Email sent via Graph', {
        recipients: to,
        subject
      });

      return response.data;
    } catch (error) {
      structuredLogger.error('Graph email failed', error as Error);
      throw error;
    }
  }

  async createTeamsNotification(channelId: string, message: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/teams/channels/${channelId}/messages`, {
        body: {
          content: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      structuredLogger.error('Teams notification failed', error as Error);
      throw error;
    }
  }
}

// External APIs Integration Manager
export class ExternalIntegrationsManager {
  private stripe: StripeIntegration;
  private graph: GraphIntegration;

  constructor() {
    this.stripe = new StripeIntegration();
    this.graph = new GraphIntegration();
  }

  // Payment processing
  async processPayment(amount: number, currency: string, metadata: any): Promise<any> {
    return this.stripe.createPaymentIntent(amount, currency, metadata);
  }

  // Email notifications
  async sendNotificationEmail(to: string[], subject: string, body: string): Promise<any> {
    return this.graph.sendEmail(to, subject, body);
  }

  // Teams alerts
  async sendTeamsAlert(channelId: string, message: string): Promise<any> {
    return this.graph.createTeamsNotification(channelId, message);
  }

  // Shipping rates (simulated)
  async getShippingRates(origin: string, destination: string, weight: number): Promise<any> {
    // Simulate shipping API calls
    const rates = [
      {
        carrier: 'FedEx',
        service: 'Standard',
        rate: weight * 0.5 + 5.0,
        currency: 'EUR',
        estimatedDays: 3
      },
      {
        carrier: 'UPS',
        service: 'Ground',
        rate: weight * 0.45 + 4.5,
        currency: 'EUR',
        estimatedDays: 4
      },
      {
        carrier: 'DHL',
        service: 'Express',
        rate: weight * 0.8 + 8.0,
        currency: 'EUR',
        estimatedDays: 2
      }
    ];

    structuredLogger.info('Shipping rates calculated', {
      origin,
      destination,
      weight,
      ratesCount: rates.length
    });

    return rates;
  }

  // Market data (simulated)
  async getMarketData(product: string): Promise<any> {
    const marketData = {
      product,
      competitorPrices: [
        { competitor: 'Competitor A', price: 100 + Math.random() * 50, currency: 'EUR' },
        { competitor: 'Competitor B', price: 95 + Math.random() * 45, currency: 'EUR' },
        { competitor: 'Competitor C', price: 110 + Math.random() * 40, currency: 'EUR' }
      ],
      marketTrend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      demandScore: Math.round(Math.random() * 100),
      timestamp: new Date().toISOString()
    };

    return marketData;
  }

  // Weather data (simulated)
  async getWeatherForecast(location: string): Promise<any> {
    const weather = {
      location,
      current: {
        temperature: 15 + Math.random() * 20,
        humidity: 40 + Math.random() * 40,
        windSpeed: Math.random() * 20,
        conditions: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: 10 + Math.random() * 25,
        conditions: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
      }))
    };

    return weather;
  }
}

export const integrations = new ExternalIntegrationsManager();

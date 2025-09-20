export declare class StripeIntegration {
    private apiKey;
    private baseUrl;
    constructor();
    createPaymentIntent(amount: number, currency?: string, metadata?: {}): Promise<any>;
    confirmPayment(paymentIntentId: string): Promise<any>;
}
export declare class GraphIntegration {
    private accessToken;
    private baseUrl;
    constructor();
    sendEmail(to: string[], subject: string, body: string): Promise<any>;
    createTeamsNotification(channelId: string, message: string): Promise<any>;
}
export declare class ExternalIntegrationsManager {
    private stripe;
    private graph;
    constructor();
    processPayment(amount: number, currency: string, metadata: any): Promise<any>;
    sendNotificationEmail(to: string[], subject: string, body: string): Promise<any>;
    sendTeamsAlert(channelId: string, message: string): Promise<any>;
    getShippingRates(origin: string, destination: string, weight: number): Promise<any>;
    getMarketData(product: string): Promise<any>;
    getWeatherForecast(location: string): Promise<any>;
}
export declare const integrations: ExternalIntegrationsManager;
//# sourceMappingURL=integrations.d.ts.map
import { BaseResponse, PaginatedResponse, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, LogoutRequest, CreateApiKeyRequest, ApiKeyResponse, User, CreateUserRequest, UpdateUserRequest, Contact, CreateContactRequest, UpdateContactRequest, Deal, CreateDealRequest, UpdateDealRequest, Product, CreateProductRequest, UpdateProductRequest, Order, CreateOrderRequest, UpdateOrderRequest, AIRequest, AIResponse, Webhook, CreateWebhookRequest, UpdateWebhookRequest } from './index.js';
export interface SDKConfig {
    baseUrl: string;
    apiKey?: string;
    accessToken?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export declare class SDKError extends Error {
    status?: number;
    response?: any;
    constructor(message: string, status?: number, response?: any);
}
export declare class ECONEURASDK {
    private http;
    constructor(config: SDKConfig);
    login(credentials: LoginRequest): Promise<LoginResponse>;
    refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
    logout(request?: LogoutRequest): Promise<BaseResponse>;
    getCurrentUser(): Promise<BaseResponse & {
        data: User;
    }>;
    createApiKey(request: CreateApiKeyRequest): Promise<BaseResponse & {
        data: ApiKeyResponse;
    }>;
    listUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponse<User>>;
    getUser(id: string): Promise<BaseResponse & {
        data: User;
    }>;
    createUser(request: CreateUserRequest): Promise<BaseResponse & {
        data: User;
    }>;
    updateUser(id: string, request: UpdateUserRequest): Promise<BaseResponse & {
        data: User;
    }>;
    deleteUser(id: string): Promise<void>;
    listContacts(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginatedResponse<Contact>>;
    getContact(id: string): Promise<BaseResponse & {
        data: Contact;
    }>;
    createContact(request: CreateContactRequest): Promise<BaseResponse & {
        data: Contact;
    }>;
    updateContact(id: string, request: UpdateContactRequest): Promise<BaseResponse & {
        data: Contact;
    }>;
    deleteContact(id: string): Promise<void>;
    listDeals(params?: {
        page?: number;
        limit?: number;
        stage?: string;
    }): Promise<PaginatedResponse<Deal>>;
    getDeal(id: string): Promise<BaseResponse & {
        data: Deal;
    }>;
    createDeal(request: CreateDealRequest): Promise<BaseResponse & {
        data: Deal;
    }>;
    updateDeal(id: string, request: UpdateDealRequest): Promise<BaseResponse & {
        data: Deal;
    }>;
    deleteDeal(id: string): Promise<void>;
    listProducts(params?: {
        page?: number;
        limit?: number;
        category?: string;
    }): Promise<PaginatedResponse<Product>>;
    getProduct(id: string): Promise<BaseResponse & {
        data: Product;
    }>;
    createProduct(request: CreateProductRequest): Promise<BaseResponse & {
        data: Product;
    }>;
    updateProduct(id: string, request: UpdateProductRequest): Promise<BaseResponse & {
        data: Product;
    }>;
    deleteProduct(id: string): Promise<void>;
    listOrders(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<PaginatedResponse<Order>>;
    getOrder(id: string): Promise<BaseResponse & {
        data: Order;
    }>;
    createOrder(request: CreateOrderRequest): Promise<BaseResponse & {
        data: Order;
    }>;
    updateOrder(id: string, request: UpdateOrderRequest): Promise<BaseResponse & {
        data: Order;
    }>;
    deleteOrder(id: string): Promise<void>;
    aiChat(request: AIRequest): Promise<BaseResponse & {
        data: AIResponse;
    }>;
    listWebhooks(params?: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<Webhook>>;
    getWebhook(id: string): Promise<BaseResponse & {
        data: Webhook;
    }>;
    createWebhook(request: CreateWebhookRequest): Promise<BaseResponse & {
        data: Webhook;
    }>;
    updateWebhook(id: string, request: UpdateWebhookRequest): Promise<BaseResponse & {
        data: Webhook;
    }>;
    deleteWebhook(id: string): Promise<void>;
    healthCheck(): Promise<BaseResponse & {
        data: any;
    }>;
    getMetrics(): Promise<BaseResponse & {
        data: any;
    }>;
    setAccessToken(token: string): void;
    setApiKey(apiKey: string): void;
}
export declare function createSDK(config: SDKConfig): ECONEURASDK;
export default ECONEURASDK;
//# sourceMappingURL=sdk.d.ts.map
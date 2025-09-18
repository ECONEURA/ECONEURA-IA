export class SDKError extends Error {
    status;
    response;
    constructor(message, status, response) {
        super(message);
        this.status = status;
        this.response = response;
        this.name = 'SDKError';
    }
}
class HttpClient {
    config;
    defaultHeaders;
    constructor(config) {
        this.config = {
            timeout: 30000,
            retries: 3,
            retryDelay: 1000,
            ...config
        };
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'ECONEURA-SDK/1.0.0'
        };
        if (this.config.apiKey) {
            this.defaultHeaders['X-API-Key'] = this.config.apiKey;
        }
        if (this.config.accessToken) {
            this.defaultHeaders['Authorization'] = `Bearer ${this.config.accessToken}`;
        }
    }
    async request(method, path, data, options = {}) {
        const url = `${this.config.baseUrl}${path}`;
        const retries = options.retries ?? this.config.retries ?? 3;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
                const response = await fetch(url, {
                    method,
                    headers: this.defaultHeaders,
                    body: data ? JSON.stringify(data) : undefined,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const responseData = await response.json();
                if (!response.ok) {
                    throw new SDKError(responseData.message || `HTTP ${response.status}`, response.status, responseData);
                }
                return responseData;
            }
            catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                if (error instanceof SDKError && error.status && error.status < 500) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            }
        }
        throw new SDKError('Max retries exceeded');
    }
    async get(path) {
        return this.request('GET', path);
    }
    async post(path, data) {
        return this.request('POST', path, data);
    }
    async put(path, data) {
        return this.request('PUT', path, data);
    }
    async delete(path) {
        return this.request('DELETE', path);
    }
    setAccessToken(token) {
        this.config.accessToken = token;
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.defaultHeaders['X-API-Key'] = apiKey;
    }
}
export class ECONEURASDK {
    http;
    constructor(config) {
        this.http = new HttpClient(config);
    }
    async login(credentials) {
        const response = await this.http.post('/auth/login', credentials);
        if (response.data?.accessToken) {
            this.http.setAccessToken(response.data.accessToken);
        }
        return response;
    }
    async refreshToken(request) {
        const response = await this.http.post('/auth/refresh', request);
        if (response.data?.accessToken) {
            this.http.setAccessToken(response.data.accessToken);
        }
        return response;
    }
    async logout(request) {
        return this.http.post('/auth/logout', request);
    }
    async getCurrentUser() {
        return this.http.get('/auth/me');
    }
    async createApiKey(request) {
        return this.http.post('/auth/api-keys', request);
    }
    async listUsers(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.search)
            searchParams.set('search', params.search);
        const query = searchParams.toString();
        return this.http.get(`/users${query ? `?${query}` : ''}`);
    }
    async getUser(id) {
        return this.http.get(`/users/${id}`);
    }
    async createUser(request) {
        return this.http.post('/users', request);
    }
    async updateUser(id, request) {
        return this.http.put(`/users/${id}`, request);
    }
    async deleteUser(id) {
        await this.http.delete(`/users/${id}`);
    }
    async listContacts(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.search)
            searchParams.set('search', params.search);
        const query = searchParams.toString();
        return this.http.get(`/contacts${query ? `?${query}` : ''}`);
    }
    async getContact(id) {
        return this.http.get(`/contacts/${id}`);
    }
    async createContact(request) {
        return this.http.post('/contacts', request);
    }
    async updateContact(id, request) {
        return this.http.put(`/contacts/${id}`, request);
    }
    async deleteContact(id) {
        await this.http.delete(`/contacts/${id}`);
    }
    async listDeals(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.stage)
            searchParams.set('stage', params.stage);
        const query = searchParams.toString();
        return this.http.get(`/deals${query ? `?${query}` : ''}`);
    }
    async getDeal(id) {
        return this.http.get(`/deals/${id}`);
    }
    async createDeal(request) {
        return this.http.post('/deals', request);
    }
    async updateDeal(id, request) {
        return this.http.put(`/deals/${id}`, request);
    }
    async deleteDeal(id) {
        await this.http.delete(`/deals/${id}`);
    }
    async listProducts(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.category)
            searchParams.set('category', params.category);
        const query = searchParams.toString();
        return this.http.get(`/products${query ? `?${query}` : ''}`);
    }
    async getProduct(id) {
        return this.http.get(`/products/${id}`);
    }
    async createProduct(request) {
        return this.http.post('/products', request);
    }
    async updateProduct(id, request) {
        return this.http.put(`/products/${id}`, request);
    }
    async deleteProduct(id) {
        await this.http.delete(`/products/${id}`);
    }
    async listOrders(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        if (params?.status)
            searchParams.set('status', params.status);
        const query = searchParams.toString();
        return this.http.get(`/orders${query ? `?${query}` : ''}`);
    }
    async getOrder(id) {
        return this.http.get(`/orders/${id}`);
    }
    async createOrder(request) {
        return this.http.post('/orders', request);
    }
    async updateOrder(id, request) {
        return this.http.put(`/orders/${id}`, request);
    }
    async deleteOrder(id) {
        await this.http.delete(`/orders/${id}`);
    }
    async aiChat(request) {
        return this.http.post('/ai/chat', request);
    }
    async listWebhooks(params) {
        const searchParams = new URLSearchParams();
        if (params?.page)
            searchParams.set('page', params.page.toString());
        if (params?.limit)
            searchParams.set('limit', params.limit.toString());
        const query = searchParams.toString();
        return this.http.get(`/webhooks${query ? `?${query}` : ''}`);
    }
    async getWebhook(id) {
        return this.http.get(`/webhooks/${id}`);
    }
    async createWebhook(request) {
        return this.http.post('/webhooks', request);
    }
    async updateWebhook(id, request) {
        return this.http.put(`/webhooks/${id}`, request);
    }
    async deleteWebhook(id) {
        await this.http.delete(`/webhooks/${id}`);
    }
    async healthCheck() {
        return this.http.get('/health');
    }
    async getMetrics() {
        return this.http.get('/metrics');
    }
    setAccessToken(token) {
        this.http.setAccessToken(token);
    }
    setApiKey(apiKey) {
        this.http.setApiKey(apiKey);
    }
}
export function createSDK(config) {
    return new ECONEURASDK(config);
}
export default ECONEURASDK;
//# sourceMappingURL=sdk.js.map
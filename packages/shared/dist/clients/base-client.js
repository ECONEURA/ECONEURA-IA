import axios from 'axios';
export class BaseClient {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ECONEURA-SDK/1.0.0',
                ...config.headers,
            },
        });
        this.client.interceptors.request.use((config) => {
            if (this.config.apiKey) {
                config.headers.Authorization = `Bearer ${this.config.apiKey}`;
            }
            if (this.config.organizationId) {
                config.headers['X-Org'] = this.config.organizationId;
            }
            config.headers['X-Correlation-Id'] = this.generateCorrelationId();
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                throw new Error('Authentication required. Please provide a valid API key.');
            }
            if (error.response?.status === 403) {
                throw new Error('Access forbidden. Check your permissions.');
            }
            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            if (error.response?.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
            throw error;
        });
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return this.handleResponse(response);
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return this.handleResponse(response);
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return this.handleResponse(response);
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return this.handleResponse(response);
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        this.handleResponse(response);
    }
    handleResponse(response) {
        const { data } = response.data;
        if (!response.data.success) {
            throw new Error(response.data.error || 'Unknown error occurred');
        }
        return data;
    }
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
    }
    setOrganizationId(organizationId) {
        this.config.organizationId = organizationId;
    }
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=base-client.js.map
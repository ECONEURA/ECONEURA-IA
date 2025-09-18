import { AxiosInstance, AxiosRequestConfig } from 'axios';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export interface BaseClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    apiKey?: string;
    organizationId?: string;
}
export declare class BaseClient {
    protected client: AxiosInstance;
    protected config: BaseClientConfig;
    constructor(config: BaseClientConfig);
    protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    protected post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    protected patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    protected put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<void>;
    private handleResponse;
    private generateCorrelationId;
    setApiKey(apiKey: string): void;
    setOrganizationId(organizationId: string): void;
    getConfig(): BaseClientConfig;
}
//# sourceMappingURL=base-client.d.ts.map
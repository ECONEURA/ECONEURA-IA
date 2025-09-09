/**
 * ECONEURA SDK
 * TypeScript SDK for the ECONEURA API
 */

export { ApiClient, ApiError, type ClientConfig, type RequestOptions, type ApiResponse } from './client';
export { AuthResource } from './resources/auth';
export { CrmResource, CompaniesResource, ContactsResource, DealsResource, ActivitiesResource } from './resources/crm';

// Re-export types from shared
export type {
  // Auth types
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  MeResponse,
  SessionsResponse,
  User,
  Organization,
  Role,
  Permission,
  DeviceSession,

  // CRM types
  Company,
  CreateCompany,
  UpdateCompany,
  CompanyFilter,
  Contact,
  CreateContact,
  UpdateContact,
  ContactFilter,
  Deal,
  CreateDeal,
  UpdateDeal,
  DealFilter,
  MoveDealStage,
  Activity,
  CreateActivity,
  UpdateActivity,

  // ERP types
  Product,
  CreateProduct,
  UpdateProduct,
  ProductFilter,
  Supplier,
  CreateSupplier,
  UpdateSupplier,
  SupplierFilter,
  Warehouse,
  CreateWarehouse,
  UpdateWarehouse,
  Inventory,
  CreateInventory,
  UpdateInventory,
  InventoryAdjustment,
  CreateInventoryAdjustment,
  PurchaseOrder,
  CreatePurchaseOrder,

  // Finance types
  Invoice,
  CreateInvoice,
  UpdateInvoice,
  InvoiceFilter,
  Payment,
  CreatePayment,
  UpdatePayment,
  Expense,
  CreateExpense,
  UpdateExpense,
  FinancialSummary,

  // Common types
  PaginationRequest,
  PaginationResponse,
  ProblemDetails,
  ValidationError,
  HealthCheckResponse,
} from '@econeura/shared';

import { ApiClient } from './client';
import { AuthResource } from './resources/auth';
import { CrmResource } from './resources/crm';

/**
 * Main SDK class that provides access to all API resources
 */
export class EconeuraSDK {
  public client: ApiClient;
  public auth: AuthResource;
  public crm: CrmResource;

  constructor(config: {
    baseUrl: string;
    accessToken?: string;
    refreshToken?: string;
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
    timeout?: number;
    retries?: number;
  }) {
    this.client = new ApiClient(config);
    this.auth = new AuthResource(this.client);
    this.crm = new CrmResource(this.client);
  }

  /**
   * Create a new SDK instance
   */
  static create(config: {
    baseUrl: string;
    accessToken?: string;
    refreshToken?: string;
    onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
    timeout?: number;
    retries?: number;
  }): EconeuraSDK {
    return new EconeuraSDK(config);
  }
}

// Default export
export default EconeuraSDK;

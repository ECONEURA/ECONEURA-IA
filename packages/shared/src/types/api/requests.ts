import type { CustomerPreferences, CustomerType, CustomerSegment, CustomerPriority } from '../models/customer.js';
import type { OrganizationSettings, SubscriptionPlan } from '../models/org.js';
import type { Metadata, PaginationParams, FilterParams } from '../models/base.js';

/**
 * Base list request interface
 */
export interface ListRequestParams extends PaginationParams, FilterParams {}

/**
 * Organization Requests
 */
export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  domain: string;
  settings?: Partial<OrganizationSettings>;
  plan?: SubscriptionPlan;
  metadata?: Metadata;
}

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: Partial<OrganizationSettings>;
  plan?: SubscriptionPlan;
  metadata?: Metadata;
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Customer Requests
 */
export interface CreateCustomerRequest {
  type: CustomerType;
  segment: CustomerSegment;
  priority: CustomerPriority;
  name: string;
  taxId?: string;
  industry?: string;
  website?: string;
  contact: {
    email: string;
    phone?: string;
    mobile?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    preferredChannel: 'email' | 'phone' | 'sms' | 'whatsapp';
  };
  preferences?: Partial<CustomerPreferences>;
  metadata?: Metadata;
}

export interface UpdateCustomerRequest {
  name?: string;
  type?: CustomerType;
  segment?: CustomerSegment;
  priority?: CustomerPriority;
  status?: 'active' | 'inactive';
  contact?: Partial<CreateCustomerRequest['contact']>;
  preferences?: Partial<CustomerPreferences>;
  metadata?: Metadata;
}

/**
 * API Key Requests
 */
export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: Date;
  scopes: string[];
}

/**
 * Webhook Subscription Request
 */
export interface CreateWebhookSubscriptionRequest {
  url: string;
  secret: string;
  events: string[];
  description?: string;
  metadata?: Metadata;
}

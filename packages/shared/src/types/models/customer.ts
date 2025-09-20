import { Metadata, Status, TenantEntity } from './base.js';

/**
 * Customer type definitions
 */
export type CustomerType = 'individual' | 'company' | 'government';
export type CustomerSegment = 'retail' | 'sme' | 'enterprise' | 'public';
export type CustomerPriority = 'low' | 'medium' | 'high' | 'vip';

/**
 * Customer contact information
 */
export interface ContactInfo {
  email: string;
  phone?: string;
  mobile?: string;
  address?: Address;
  preferredChannel: 'email' | 'phone' | 'sms' | 'whatsapp';
}

/**
 * Physical address
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Customer preferences
 */
export interface CustomerPreferences {
  language: string;
  timezone: string;
  currency: string;
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  optIns: {
    marketing: boolean;
    newsletter: boolean;
    productUpdates: boolean;
  };
}

/**
 * Customer main interface
 */
export interface Customer extends TenantEntity {
  type: CustomerType;
  segment: CustomerSegment;
  priority: CustomerPriority;
  status: Status;
  
  // Basic info
  name: string;
  taxId?: string;
  industry?: string;
  website?: string;
  
  // Contact
  contact: ContactInfo;
  preferences: CustomerPreferences;
  
  // Business info
  accountManager?: string;
  creditLimit?: number;
  paymentTerms?: number;
  
  // Metrics
  lifetimeValue?: number;
  lastPurchaseDate?: Date;
  lastContactDate?: Date;
  
  // Custom fields
  metadata: Metadata;
}

/**
 * Customer contact person
 */
export interface Contact extends TenantEntity {
  customerId: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  isMainContact: boolean;
  status: Status;
  preferences?: {
    language: string;
    timezone: string;
  };
  metadata: Metadata;
}

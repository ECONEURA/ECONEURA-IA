import { Metadata, Status, TenantEntity } from './base.js';
export type CustomerType = 'individual' | 'company' | 'government';
export type CustomerSegment = 'retail' | 'sme' | 'enterprise' | 'public';
export type CustomerPriority = 'low' | 'medium' | 'high' | 'vip';
export interface ContactInfo {
    email: string;
    phone?: string;
    mobile?: string;
    address?: Address;
    preferredChannel: 'email' | 'phone' | 'sms' | 'whatsapp';
}
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
export interface Customer extends TenantEntity {
    type: CustomerType;
    segment: CustomerSegment;
    priority: CustomerPriority;
    status: Status;
    name: string;
    taxId?: string;
    industry?: string;
    website?: string;
    contact: ContactInfo;
    preferences: CustomerPreferences;
    accountManager?: string;
    creditLimit?: number;
    paymentTerms?: number;
    lifetimeValue?: number;
    lastPurchaseDate?: Date;
    lastContactDate?: Date;
    metadata: Metadata;
}
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
//# sourceMappingURL=customer.d.ts.map
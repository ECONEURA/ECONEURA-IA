import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';
export interface CompanyId {
    value: string;
}
export interface OrganizationId {
    value: string;
}
export interface CompanyType {
    value: 'customer' | 'supplier' | 'partner' | 'prospect' | 'competitor';
}
export interface CompanyStatus {
    value: 'active' | 'inactive' | 'suspended' | 'prospect' | 'lead';
}
export interface CompanySize {
    value: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
}
export interface CompanyIndustry {
    value: string;
}
export interface CompanySource {
    value: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'event' | 'other';
}
export interface CompanySettings {
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    preferences: {
        language: string;
        timezone: string;
        currency: string;
        dateFormat: string;
    };
    customFields: Record<string, any>;
    tags: string[];
    notes: string;
}
export interface CompanyProps {
    id: CompanyId;
    organizationId: OrganizationId;
    name: string;
    legalName?: string;
    type: CompanyType;
    status: CompanyStatus;
    size: CompanySize;
    industry: CompanyIndustry;
    source: CompanySource;
    website?: string;
    email?: string;
    phone?: string;
    address?: Address;
    billingAddress?: Address;
    shippingAddress?: Address;
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    description?: string;
    settings: CompanySettings;
    annualRevenue?: Money;
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: CompanyId;
    assignedUserId?: string;
    lastContactDate?: Date;
    nextFollowUpDate?: Date;
    leadScore?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Company {
    private props;
    private constructor();
    static create(props: Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt'>): Company;
    static fromPersistence(data: any): Company;
    private static getDefaultSettings;
    get id(): CompanyId;
    get organizationId(): OrganizationId;
    get name(): string;
    get legalName(): string | undefined;
    get type(): CompanyType;
    get status(): CompanyStatus;
    get size(): CompanySize;
    get industry(): CompanyIndustry;
    get source(): CompanySource;
    get website(): string | undefined;
    get email(): string | undefined;
    get phone(): string | undefined;
    get address(): Address | undefined;
    get billingAddress(): Address | undefined;
    get shippingAddress(): Address | undefined;
    get taxId(): string | undefined;
    get vatNumber(): string | undefined;
    get registrationNumber(): string | undefined;
    get description(): string | undefined;
    get settings(): CompanySettings;
    get annualRevenue(): Money | undefined;
    get employeeCount(): number | undefined;
    get foundedYear(): number | undefined;
    get parentCompanyId(): CompanyId | undefined;
    get assignedUserId(): string | undefined;
    get lastContactDate(): Date | undefined;
    get nextFollowUpDate(): Date | undefined;
    get leadScore(): number | undefined;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateLegalName(legalName: string): void;
    updateType(type: CompanyType['value']): void;
    updateStatus(status: CompanyStatus['value']): void;
    updateSize(size: CompanySize['value']): void;
    updateIndustry(industry: string): void;
    updateSource(source: CompanySource['value']): void;
    updateContactInfo(email?: string, phone?: string, website?: string): void;
    updateAddress(address: Address): void;
    updateBillingAddress(address: Address): void;
    updateShippingAddress(address: Address): void;
    updateTaxInfo(taxId?: string, vatNumber?: string, registrationNumber?: string): void;
    updateDescription(description: string): void;
    updateSettings(settings: Partial<CompanySettings>): void;
    updateAnnualRevenue(revenue: Money): void;
    updateEmployeeCount(count: number): void;
    updateFoundedYear(year: number): void;
    assignToUser(userId: string): void;
    unassignUser(): void;
    recordContact(): void;
    scheduleFollowUp(date: Date): void;
    updateLeadScore(score: number): void;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    isCustomer(): boolean;
    isSupplier(): boolean;
    isPartner(): boolean;
    isProspect(): boolean;
    isLead(): boolean;
    isAssigned(): boolean;
    hasParentCompany(): boolean;
    isOverdueForFollowUp(): boolean;
    getDaysSinceLastContact(): number;
    getDaysUntilFollowUp(): number;
    getLeadScoreLevel(): 'low' | 'medium' | 'high';
    static validateName(name: string): {
        isValid: boolean;
        errors: string[];
    };
    static validateEmail(email: string): boolean;
    static validateWebsite(website: string): boolean;
    static validatePhone(phone: string): boolean;
    static validateTaxId(taxId: string): boolean;
    static validateVatNumber(vatNumber: string): boolean;
    toPersistence(): any;
    toDTO(): any;
    equals(other: Company): boolean;
    hashCode(): string;
}
//# sourceMappingURL=company.entity.d.ts.map
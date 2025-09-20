import { Company } from '../../../domain/entities/company.entity.js';
import { CompanyRepository } from '../../../domain/repositories/company.repository.js';
export interface CreateCompanyRequest {
    organizationId: string;
    name: string;
    legalName?: string;
    type: 'customer' | 'supplier' | 'partner' | 'prospect' | 'competitor';
    status: 'active' | 'inactive' | 'suspended' | 'prospect' | 'lead';
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    industry: string;
    source: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'event' | 'other';
    website?: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
        countryCode: string;
    };
    billingAddress?: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
        countryCode: string;
    };
    shippingAddress?: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
        countryCode: string;
    };
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    description?: string;
    annualRevenue?: {
        amount: number;
        currency: string;
    };
    employeeCount?: number;
    foundedYear?: number;
    parentCompanyId?: string;
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    settings?: {
        notifications?: {
            email?: boolean;
            sms?: boolean;
            push?: boolean;
        };
        preferences?: {
            language?: string;
            timezone?: string;
            currency?: string;
            dateFormat?: string;
        };
        customFields?: Record<string, any>;
        tags?: string[];
        notes?: string;
    };
    createdBy: string;
}
export interface CreateCompanyResponse {
    success: boolean;
    company?: Company;
    error?: string;
}
export declare class CreateCompanyUseCase {
    private companyRepository;
    constructor(companyRepository: CompanyRepository);
    execute(request: CreateCompanyRequest): Promise<CreateCompanyResponse>;
    private validateRequest;
}
//# sourceMappingURL=create-company.use-case.d.ts.map
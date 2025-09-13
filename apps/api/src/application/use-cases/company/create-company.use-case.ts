import { Company } from '../../../domain/entities/company.entity.js';
import { CompanyRepository } from '../../../domain/repositories/company.repository.js';
import { Address } from '../../../domain/value-objects/address.vo.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

// ============================================================================
// CREATE COMPANY USE CASE
// ============================================================================

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

export class CreateCompanyUseCase {
  constructor(private companyRepository: CompanyRepository) {}

  async execute(request: CreateCompanyRequest): Promise<CreateCompanyResponse> {
    try {
      // Validate input
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if company with same name already exists in organization
      const existingCompany = await this.companyRepository.searchByName(
        request.name,
        request.organizationId
      );

      if (existingCompany.length > 0) {
        return {
          success: false,
          error: 'Company with this name already exists in the organization'
        };
      }

      // Create address objects if provided
      let address: Address | undefined;
      let billingAddress: Address | undefined;
      let shippingAddress: Address | undefined;

      if (request.address) {
        address = Address.create(request.address);
      }

      if (request.billingAddress) {
        billingAddress = Address.create(request.billingAddress);
      }

      if (request.shippingAddress) {
        shippingAddress = Address.create(request.shippingAddress);
      }

      // Create money object if annual revenue provided
      let annualRevenue: Money | undefined;
      if (request.annualRevenue) {
        annualRevenue = Money.create(request.annualRevenue.amount, request.annualRevenue.currency);
      }

      // Create company entity
      const company = Company.create({
        organizationId: { value: request.organizationId },
        name: request.name,
        legalName: request.legalName,
        type: { value: request.type },
        status: { value: request.status },
        size: { value: request.size },
        industry: { value: request.industry },
        source: { value: request.source },
        website: request.website,
        email: request.email,
        phone: request.phone,
        address,
        billingAddress,
        shippingAddress,
        taxId: request.taxId,
        vatNumber: request.vatNumber,
        registrationNumber: request.registrationNumber,
        description: request.description,
        settings: {
          notifications: {
            email: request.settings?.notifications?.email ?? true,
            sms: request.settings?.notifications?.sms ?? false,
            push: request.settings?.notifications?.push ?? false
          },
          preferences: {
            language: request.settings?.preferences?.language ?? 'en',
            timezone: request.settings?.preferences?.timezone ?? 'UTC',
            currency: request.settings?.preferences?.currency ?? 'EUR',
            dateFormat: request.settings?.preferences?.dateFormat ?? 'DD/MM/YYYY'
          },
          customFields: request.settings?.customFields ?? {},
          tags: request.settings?.tags ?? [],
          notes: request.settings?.notes ?? ''
        },
        annualRevenue,
        employeeCount: request.employeeCount,
        foundedYear: request.foundedYear,
        parentCompanyId: request.parentCompanyId ? { value: request.parentCompanyId } : undefined,
        assignedUserId: request.assignedUserId,
        nextFollowUpDate: request.nextFollowUpDate,
        leadScore: request.leadScore,
        isActive: true
      });

      // Save company
      const savedCompany = await this.companyRepository.save(company);

      return {
        success: true,
        company: savedCompany
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validateRequest(request: CreateCompanyRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate organization ID
    if (!request.organizationId || request.organizationId.trim().length === 0) {
      errors.push('Organization ID is required');
    }

    // Validate name
    const nameValidation = Company.validateName(request.name);
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }

    // Validate legal name if provided
    if (request.legalName) {
      const legalNameValidation = Company.validateName(request.legalName);
      if (!legalNameValidation.isValid) {
        errors.push(...legalNameValidation.errors.map(err => `Legal name: ${err}`));
      }
    }

    // Validate type
    const validTypes = ['customer', 'supplier', 'partner', 'prospect', 'competitor'];
    if (!validTypes.includes(request.type)) {
      errors.push('Invalid company type');
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'prospect', 'lead'];
    if (!validStatuses.includes(request.status)) {
      errors.push('Invalid company status');
    }

    // Validate size
    const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
    if (!validSizes.includes(request.size)) {
      errors.push('Invalid company size');
    }

    // Validate industry
    if (!request.industry || request.industry.trim().length === 0) {
      errors.push('Industry is required');
    }

    // Validate source
    const validSources = ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other'];
    if (!validSources.includes(request.source)) {
      errors.push('Invalid company source');
    }

    // Validate email if provided
    if (request.email && !Company.validateEmail(request.email)) {
      errors.push('Invalid email format');
    }

    // Validate website if provided
    if (request.website && !Company.validateWebsite(request.website)) {
      errors.push('Invalid website URL');
    }

    // Validate phone if provided
    if (request.phone && !Company.validatePhone(request.phone)) {
      errors.push('Invalid phone number format');
    }

    // Validate tax ID if provided
    if (request.taxId && !Company.validateTaxId(request.taxId)) {
      errors.push('Invalid tax ID format');
    }

    // Validate VAT number if provided
    if (request.vatNumber && !Company.validateVatNumber(request.vatNumber)) {
      errors.push('Invalid VAT number format');
    }

    // Validate employee count if provided
    if (request.employeeCount !== undefined && (request.employeeCount < 0 || request.employeeCount > 1000000)) {
      errors.push('Employee count must be between 0 and 1,000,000');
    }

    // Validate founded year if provided
    if (request.foundedYear !== undefined) {
      const currentYear = new Date().getFullYear();
      if (request.foundedYear < 1800 || request.foundedYear > currentYear) {
        errors.push(`Founded year must be between 1800 and ${currentYear}`);
      }
    }

    // Validate lead score if provided
    if (request.leadScore !== undefined && (request.leadScore < 0 || request.leadScore > 100)) {
      errors.push('Lead score must be between 0 and 100');
    }

    // Validate annual revenue if provided
    if (request.annualRevenue) {
      if (request.annualRevenue.amount < 0) {
        errors.push('Annual revenue cannot be negative');
      }
      if (!request.annualRevenue.currency || request.annualRevenue.currency.length !== 3) {
        errors.push('Annual revenue currency must be a 3-letter code');
      }
    }

    // Validate created by
    if (!request.createdBy || request.createdBy.trim().length === 0) {
      errors.push('Created by user ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

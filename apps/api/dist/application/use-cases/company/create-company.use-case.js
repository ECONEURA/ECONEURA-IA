import { Company } from '../../../domain/entities/company.entity.js';
import { Address } from '../../../domain/value-objects/address.vo.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class CreateCompanyUseCase {
    companyRepository;
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }
    async execute(request) {
        try {
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }
            const existingCompany = await this.companyRepository.searchByName(request.name, request.organizationId);
            if (existingCompany.length > 0) {
                return {
                    success: false,
                    error: 'Company with this name already exists in the organization'
                };
            }
            let address;
            let billingAddress;
            let shippingAddress;
            if (request.address) {
                address = Address.create(request.address);
            }
            if (request.billingAddress) {
                billingAddress = Address.create(request.billingAddress);
            }
            if (request.shippingAddress) {
                shippingAddress = Address.create(request.shippingAddress);
            }
            let annualRevenue;
            if (request.annualRevenue) {
                annualRevenue = Money.create(request.annualRevenue.amount, request.annualRevenue.currency);
            }
            const company = Company.create({
                organizationId: request.organizationId,
                name: request.name,
                legalName: request.legalName,
                type: request.type,
                status: request.status,
                size: request.size,
                industry: request.industry,
                source: request.source,
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
                parentCompanyId: request.parentCompanyId ? request.parentCompanyId : undefined,
                assignedUserId: request.assignedUserId,
                nextFollowUpDate: request.nextFollowUpDate,
                leadScore: request.leadScore,
                isActive: true
            });
            const savedCompany = await this.companyRepository.save(company);
            return {
                success: true,
                company: savedCompany
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.organizationId || request.organizationId.trim().length === 0) {
            errors.push('Organization ID is required');
        }
        const nameValidation = Company.validateName(request.name);
        if (!nameValidation.isValid) {
            errors.push(...nameValidation.errors);
        }
        if (request.legalName) {
            const legalNameValidation = Company.validateName(request.legalName);
            if (!legalNameValidation.isValid) {
                errors.push(...legalNameValidation.errors.map(err => `Legal name: ${err}`));
            }
        }
        const validTypes = ['customer', 'supplier', 'partner', 'prospect', 'competitor'];
        if (!validTypes.includes(request.type)) {
            errors.push('Invalid company type');
        }
        const validStatuses = ['active', 'inactive', 'suspended', 'prospect', 'lead'];
        if (!validStatuses.includes(request.status)) {
            errors.push('Invalid company status');
        }
        const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
        if (!validSizes.includes(request.size)) {
            errors.push('Invalid company size');
        }
        if (!request.industry || request.industry.trim().length === 0) {
            errors.push('Industry is required');
        }
        const validSources = ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other'];
        if (!validSources.includes(request.source)) {
            errors.push('Invalid company source');
        }
        if (request.email && !Company.validateEmail(request.email)) {
            errors.push('Invalid email format');
        }
        if (request.website && !Company.validateWebsite(request.website)) {
            errors.push('Invalid website URL');
        }
        if (request.phone && !Company.validatePhone(request.phone)) {
            errors.push('Invalid phone number format');
        }
        if (request.taxId && !Company.validateTaxId(request.taxId)) {
            errors.push('Invalid tax ID format');
        }
        if (request.vatNumber && !Company.validateVatNumber(request.vatNumber)) {
            errors.push('Invalid VAT number format');
        }
        if (request.employeeCount !== undefined && (request.employeeCount < 0 || request.employeeCount > 1000000)) {
            errors.push('Employee count must be between 0 and 1,000,000');
        }
        if (request.foundedYear !== undefined) {
            const currentYear = new Date().getFullYear();
            if (request.foundedYear < 1800 || request.foundedYear > currentYear) {
                errors.push(`Founded year must be between 1800 and ${currentYear}`);
            }
        }
        if (request.leadScore !== undefined && (request.leadScore < 0 || request.leadScore > 100)) {
            errors.push('Lead score must be between 0 and 100');
        }
        if (request.annualRevenue) {
            if (request.annualRevenue.amount < 0) {
                errors.push('Annual revenue cannot be negative');
            }
            if (!request.annualRevenue.currency || request.annualRevenue.currency.length !== 3) {
                errors.push('Annual revenue currency must be a 3-letter code');
            }
        }
        if (!request.createdBy || request.createdBy.trim().length === 0) {
            errors.push('Created by user ID is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=create-company.use-case.js.map
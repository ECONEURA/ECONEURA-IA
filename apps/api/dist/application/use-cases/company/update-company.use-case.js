import { Company } from '../../../domain/entities/company.entity.js';
import { Address } from '../../../domain/value-objects/address.vo.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class UpdateCompanyUseCase {
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
            const company = await this.companyRepository.findById(request.companyId);
            if (!company) {
                return {
                    success: false,
                    error: 'Company not found'
                };
            }
            if (request.name && request.name !== company.name) {
                const existingCompany = await this.companyRepository.searchByName(request.name, company.organizationId.value);
                if (existingCompany.length > 0 && existingCompany[0].id.value !== request.companyId) {
                    return {
                        success: false,
                        error: 'Company with this name already exists in the organization'
                    };
                }
            }
            if (request.name !== undefined) {
                company.updateName(request.name);
            }
            if (request.legalName !== undefined) {
                company.updateLegalName(request.legalName);
            }
            if (request.type !== undefined) {
                company.updateType(request.type);
            }
            if (request.status !== undefined) {
                company.updateStatus(request.status);
            }
            if (request.size !== undefined) {
                company.updateSize(request.size);
            }
            if (request.industry !== undefined) {
                company.updateIndustry(request.industry);
            }
            if (request.source !== undefined) {
                company.updateSource(request.source);
            }
            if (request.email !== undefined || request.phone !== undefined || request.website !== undefined) {
                company.updateContactInfo(request.email, request.phone, request.website);
            }
            if (request.address !== undefined) {
                const address = Address.create(request.address);
                company.updateAddress(address);
            }
            if (request.billingAddress !== undefined) {
                const billingAddress = Address.create(request.billingAddress);
                company.updateBillingAddress(billingAddress);
            }
            if (request.shippingAddress !== undefined) {
                const shippingAddress = Address.create(request.shippingAddress);
                company.updateShippingAddress(shippingAddress);
            }
            if (request.taxId !== undefined || request.vatNumber !== undefined || request.registrationNumber !== undefined) {
                company.updateTaxInfo(request.taxId, request.vatNumber, request.registrationNumber);
            }
            if (request.description !== undefined) {
                company.updateDescription(request.description);
            }
            if (request.settings !== undefined) {
                company.updateSettings(request.settings);
            }
            if (request.annualRevenue !== undefined) {
                const annualRevenue = Money.create(request.annualRevenue.amount, request.annualRevenue.currency);
                company.updateAnnualRevenue(annualRevenue);
            }
            if (request.employeeCount !== undefined) {
                company.updateEmployeeCount(request.employeeCount);
            }
            if (request.foundedYear !== undefined) {
                company.updateFoundedYear(request.foundedYear);
            }
            if (request.assignedUserId !== undefined) {
                if (request.assignedUserId) {
                    company.assignToUser(request.assignedUserId);
                }
                else {
                    company.unassignUser();
                }
            }
            if (request.nextFollowUpDate !== undefined) {
                if (request.nextFollowUpDate) {
                    company.scheduleFollowUp(request.nextFollowUpDate);
                }
                else {
                    company.scheduleFollowUp(new Date(0));
                }
            }
            if (request.leadScore !== undefined) {
                company.updateLeadScore(request.leadScore);
            }
            const updatedCompany = await this.companyRepository.update(company);
            return {
                success: true,
                company: updatedCompany
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
        if (!request.companyId || request.companyId.trim().length === 0) {
            errors.push('Company ID is required');
        }
        if (request.name !== undefined) {
            const nameValidation = Company.validateName(request.name);
            if (!nameValidation.isValid) {
                errors.push(...nameValidation.errors);
            }
        }
        if (request.legalName !== undefined && request.legalName) {
            const legalNameValidation = Company.validateName(request.legalName);
            if (!legalNameValidation.isValid) {
                errors.push(...legalNameValidation.errors.map(err => `Legal name: ${err}`));
            }
        }
        if (request.type !== undefined) {
            const validTypes = ['customer', 'supplier', 'partner', 'prospect', 'competitor'];
            if (!validTypes.includes(request.type)) {
                errors.push('Invalid company type');
            }
        }
        if (request.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'suspended', 'prospect', 'lead'];
            if (!validStatuses.includes(request.status)) {
                errors.push('Invalid company status');
            }
        }
        if (request.size !== undefined) {
            const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
            if (!validSizes.includes(request.size)) {
                errors.push('Invalid company size');
            }
        }
        if (request.industry !== undefined && (!request.industry || request.industry.trim().length === 0)) {
            errors.push('Industry cannot be empty');
        }
        if (request.source !== undefined) {
            const validSources = ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other'];
            if (!validSources.includes(request.source)) {
                errors.push('Invalid company source');
            }
        }
        if (request.email !== undefined && request.email && !Company.validateEmail(request.email)) {
            errors.push('Invalid email format');
        }
        if (request.website !== undefined && request.website && !Company.validateWebsite(request.website)) {
            errors.push('Invalid website URL');
        }
        if (request.phone !== undefined && request.phone && !Company.validatePhone(request.phone)) {
            errors.push('Invalid phone number format');
        }
        if (request.taxId !== undefined && request.taxId && !Company.validateTaxId(request.taxId)) {
            errors.push('Invalid tax ID format');
        }
        if (request.vatNumber !== undefined && request.vatNumber && !Company.validateVatNumber(request.vatNumber)) {
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
        if (request.annualRevenue !== undefined) {
            if (request.annualRevenue.amount < 0) {
                errors.push('Annual revenue cannot be negative');
            }
            if (!request.annualRevenue.currency || request.annualRevenue.currency.length !== 3) {
                errors.push('Annual revenue currency must be a 3-letter code');
            }
        }
        if (!request.updatedBy || request.updatedBy.trim().length === 0) {
            errors.push('Updated by user ID is required');
        }
        const hasUpdates = Object.keys(request).some(key => key !== 'companyId' &&
            key !== 'updatedBy' &&
            request[key] !== undefined);
        if (!hasUpdates) {
            errors.push('At least one field must be provided for update');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=update-company.use-case.js.map
import { z } from 'zod';
import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';
export class Company {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Company({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static fromPersistence(data) {
        return new Company({
            id: data.id,
            organizationId: data.organizationId,
            name: data.name,
            legalName: data.legalName,
            type: data.type,
            status: data.status,
            size: data.size,
            industry: data.industry,
            source: data.source,
            website: data.website,
            email: data.email,
            phone: data.phone,
            address: data.address ? Address.create(data.address) : undefined,
            billingAddress: data.billingAddress ? Address.create(data.billingAddress) : undefined,
            shippingAddress: data.shippingAddress ? Address.create(data.shippingAddress) : undefined,
            taxId: data.taxId,
            vatNumber: data.vatNumber,
            registrationNumber: data.registrationNumber,
            description: data.description,
            settings: data.settings || this.getDefaultSettings(),
            annualRevenue: data.annualRevenue ? Money.create(data.annualRevenue.amount, data.annualRevenue.currency) : undefined,
            employeeCount: data.employeeCount,
            foundedYear: data.foundedYear,
            parentCompanyId: data.parentCompanyId ? data.parentCompanyId : undefined,
            assignedUserId: data.assignedUserId,
            lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : undefined,
            nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
            leadScore: data.leadScore,
            isActive: data.isActive,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    static getDefaultSettings() {
        return {
            notifications: {
                email: true,
                sms: false,
                push: false
            },
            preferences: {
                language: 'en',
                timezone: 'UTC',
                currency: 'EUR',
                dateFormat: 'DD/MM/YYYY'
            },
            customFields: {},
            tags: [],
            notes: ''
        };
    }
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get name() {
        return this.props.name;
    }
    get legalName() {
        return this.props.legalName;
    }
    get type() {
        return this.props.type;
    }
    get status() {
        return this.props.status;
    }
    get size() {
        return this.props.size;
    }
    get industry() {
        return this.props.industry;
    }
    get source() {
        return this.props.source;
    }
    get website() {
        return this.props.website;
    }
    get email() {
        return this.props.email;
    }
    get phone() {
        return this.props.phone;
    }
    get address() {
        return this.props.address;
    }
    get billingAddress() {
        return this.props.billingAddress;
    }
    get shippingAddress() {
        return this.props.shippingAddress;
    }
    get taxId() {
        return this.props.taxId;
    }
    get vatNumber() {
        return this.props.vatNumber;
    }
    get registrationNumber() {
        return this.props.registrationNumber;
    }
    get description() {
        return this.props.description;
    }
    get settings() {
        return this.props.settings;
    }
    get annualRevenue() {
        return this.props.annualRevenue;
    }
    get employeeCount() {
        return this.props.employeeCount;
    }
    get foundedYear() {
        return this.props.foundedYear;
    }
    get parentCompanyId() {
        return this.props.parentCompanyId;
    }
    get assignedUserId() {
        return this.props.assignedUserId;
    }
    get lastContactDate() {
        return this.props.lastContactDate;
    }
    get nextFollowUpDate() {
        return this.props.nextFollowUpDate;
    }
    get leadScore() {
        return this.props.leadScore;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateName(name) {
        this.props.name = name;
        this.props.updatedAt = new Date();
    }
    updateLegalName(legalName) {
        this.props.legalName = legalName;
        this.props.updatedAt = new Date();
    }
    updateType(type) {
        this.props.type = type;
        this.props.updatedAt = new Date();
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }
    updateSize(size) {
        this.props.size = size;
        this.props.updatedAt = new Date();
    }
    updateIndustry(industry) {
        this.props.industry = industry;
        this.props.updatedAt = new Date();
    }
    updateSource(source) {
        this.props.source = source;
        this.props.updatedAt = new Date();
    }
    updateContactInfo(email, phone, website) {
        if (email !== undefined)
            this.props.email = email;
        if (phone !== undefined)
            this.props.phone = phone;
        if (website !== undefined)
            this.props.website = website;
        this.props.updatedAt = new Date();
    }
    updateAddress(address) {
        this.props.address = address;
        this.props.updatedAt = new Date();
    }
    updateBillingAddress(address) {
        this.props.billingAddress = address;
        this.props.updatedAt = new Date();
    }
    updateShippingAddress(address) {
        this.props.shippingAddress = address;
        this.props.updatedAt = new Date();
    }
    updateTaxInfo(taxId, vatNumber, registrationNumber) {
        if (taxId !== undefined)
            this.props.taxId = taxId;
        if (vatNumber !== undefined)
            this.props.vatNumber = vatNumber;
        if (registrationNumber !== undefined)
            this.props.registrationNumber = registrationNumber;
        this.props.updatedAt = new Date();
    }
    updateDescription(description) {
        this.props.description = description;
        this.props.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.props.settings = { ...this.props.settings, ...settings };
        this.props.updatedAt = new Date();
    }
    updateAnnualRevenue(revenue) {
        this.props.annualRevenue = revenue;
        this.props.updatedAt = new Date();
    }
    updateEmployeeCount(count) {
        this.props.employeeCount = count;
        this.props.updatedAt = new Date();
    }
    updateFoundedYear(year) {
        this.props.foundedYear = year;
        this.props.updatedAt = new Date();
    }
    assignToUser(userId) {
        this.props.assignedUserId = userId;
        this.props.updatedAt = new Date();
    }
    unassignUser() {
        this.props.assignedUserId = undefined;
        this.props.updatedAt = new Date();
    }
    recordContact() {
        this.props.lastContactDate = new Date();
        this.props.updatedAt = new Date();
    }
    scheduleFollowUp(date) {
        this.props.nextFollowUpDate = date;
        this.props.updatedAt = new Date();
    }
    updateLeadScore(score) {
        this.props.leadScore = Math.max(0, Math.min(100, score));
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    isActive() {
        return this.props.isActive && this.props.status.value === 'active';
    }
    isCustomer() {
        return this.props.type.value === 'customer';
    }
    isSupplier() {
        return this.props.type.value === 'supplier';
    }
    isPartner() {
        return this.props.type.value === 'partner';
    }
    isProspect() {
        return this.props.type.value === 'prospect' || this.props.status.value === 'prospect';
    }
    isLead() {
        return this.props.status.value === 'lead';
    }
    isAssigned() {
        return !!this.props.assignedUserId;
    }
    hasParentCompany() {
        return !!this.props.parentCompanyId;
    }
    isOverdueForFollowUp() {
        if (!this.props.nextFollowUpDate)
            return false;
        return new Date() > this.props.nextFollowUpDate;
    }
    getDaysSinceLastContact() {
        if (!this.props.lastContactDate)
            return -1;
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this.props.lastContactDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getDaysUntilFollowUp() {
        if (!this.props.nextFollowUpDate)
            return -1;
        const now = new Date();
        const diffTime = this.props.nextFollowUpDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getLeadScoreLevel() {
        if (!this.props.leadScore)
            return 'low';
        if (this.props.leadScore < 30)
            return 'low';
        if (this.props.leadScore < 70)
            return 'medium';
        return 'high';
    }
    static validateName(name) {
        const errors = [];
        if (!name || name.trim().length === 0) {
            errors.push('Company name is required');
        }
        if (name.length > 200) {
            errors.push('Company name cannot exceed 200 characters');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static validateEmail(email) {
        const emailSchema = z.string().email();
        return emailSchema.safeParse(email).success;
    }
    static validateWebsite(website) {
        try {
            new URL(website);
            return true;
        }
        catch {
            return false;
        }
    }
    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    static validateTaxId(taxId) {
        return taxId.length >= 5 && taxId.length <= 20;
    }
    static validateVatNumber(vatNumber) {
        return vatNumber.length >= 8 && vatNumber.length <= 15;
    }
    toPersistence() {
        return {
            id: this.props.id.value,
            organizationId: this.props.organizationId.value,
            name: this.props.name,
            legalName: this.props.legalName,
            type: this.props.type.value,
            status: this.props.status.value,
            size: this.props.size.value,
            industry: this.props.industry.value,
            source: this.props.source.value,
            website: this.props.website,
            email: this.props.email,
            phone: this.props.phone,
            address: this.props.address?.toJSON(),
            billingAddress: this.props.billingAddress?.toJSON(),
            shippingAddress: this.props.shippingAddress?.toJSON(),
            taxId: this.props.taxId,
            vatNumber: this.props.vatNumber,
            registrationNumber: this.props.registrationNumber,
            description: this.props.description,
            settings: this.props.settings,
            annualRevenue: this.props.annualRevenue?.toJSON(),
            employeeCount: this.props.employeeCount,
            foundedYear: this.props.foundedYear,
            parentCompanyId: this.props.parentCompanyId?.value,
            assignedUserId: this.props.assignedUserId,
            lastContactDate: this.props.lastContactDate,
            nextFollowUpDate: this.props.nextFollowUpDate,
            leadScore: this.props.leadScore,
            isActive: this.props.isActive,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
    toDTO() {
        return {
            id: this.props.id.value,
            organizationId: this.props.organizationId.value,
            name: this.props.name,
            legalName: this.props.legalName,
            type: this.props.type.value,
            status: this.props.status.value,
            size: this.props.size.value,
            industry: this.props.industry.value,
            source: this.props.source.value,
            website: this.props.website,
            email: this.props.email,
            phone: this.props.phone,
            address: this.props.address?.toJSON(),
            billingAddress: this.props.billingAddress?.toJSON(),
            shippingAddress: this.props.shippingAddress?.toJSON(),
            taxId: this.props.taxId,
            vatNumber: this.props.vatNumber,
            registrationNumber: this.props.registrationNumber,
            description: this.props.description,
            settings: this.props.settings,
            annualRevenue: this.props.annualRevenue?.toJSON(),
            employeeCount: this.props.employeeCount,
            foundedYear: this.props.foundedYear,
            parentCompanyId: this.props.parentCompanyId?.value,
            assignedUserId: this.props.assignedUserId,
            lastContactDate: this.props.lastContactDate,
            nextFollowUpDate: this.props.nextFollowUpDate,
            leadScore: this.props.leadScore,
            leadScoreLevel: this.getLeadScoreLevel(),
            isActive: this.props.isActive,
            isCustomer: this.isCustomer(),
            isSupplier: this.isSupplier(),
            isPartner: this.isPartner(),
            isProspect: this.isProspect(),
            isLead: this.isLead(),
            isAssigned: this.isAssigned(),
            hasParentCompany: this.hasParentCompany(),
            isOverdueForFollowUp: this.isOverdueForFollowUp(),
            daysSinceLastContact: this.getDaysSinceLastContact(),
            daysUntilFollowUp: this.getDaysUntilFollowUp(),
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }
    equals(other) {
        return this.props.id.value === other.props.id.value;
    }
    hashCode() {
        return this.props.id.value;
    }
}
//# sourceMappingURL=company.entity.js.map
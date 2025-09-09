import { z } from 'zod';
import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';

// ============================================================================
// COMPANY ENTITY
// ============================================================================

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

export class Company {
  private constructor(private props: CompanyProps) {}

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt'>): Company {
    const now = new Date();
    return new Company({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now
    });
  }

  static fromPersistence(data: any): Company {
    return new Company({
      id: { value: data.id },
      organizationId: { value: data.organizationId },
      name: data.name,
      legalName: data.legalName,
      type: { value: data.type },
      status: { value: data.status },
      size: { value: data.size },
      industry: { value: data.industry },
      source: { value: data.source },
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
      parentCompanyId: data.parentCompanyId ? { value: data.parentCompanyId } : undefined,
      assignedUserId: data.assignedUserId,
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : undefined,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
      leadScore: data.leadScore,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  private static getDefaultSettings(): CompanySettings {
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

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): CompanyId {
    return this.props.id;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get legalName(): string | undefined {
    return this.props.legalName;
  }

  get type(): CompanyType {
    return this.props.type;
  }

  get status(): CompanyStatus {
    return this.props.status;
  }

  get size(): CompanySize {
    return this.props.size;
  }

  get industry(): CompanyIndustry {
    return this.props.industry;
  }

  get source(): CompanySource {
    return this.props.source;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get address(): Address | undefined {
    return this.props.address;
  }

  get billingAddress(): Address | undefined {
    return this.props.billingAddress;
  }

  get shippingAddress(): Address | undefined {
    return this.props.shippingAddress;
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  get vatNumber(): string | undefined {
    return this.props.vatNumber;
  }

  get registrationNumber(): string | undefined {
    return this.props.registrationNumber;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get settings(): CompanySettings {
    return this.props.settings;
  }

  get annualRevenue(): Money | undefined {
    return this.props.annualRevenue;
  }

  get employeeCount(): number | undefined {
    return this.props.employeeCount;
  }

  get foundedYear(): number | undefined {
    return this.props.foundedYear;
  }

  get parentCompanyId(): CompanyId | undefined {
    return this.props.parentCompanyId;
  }

  get assignedUserId(): string | undefined {
    return this.props.assignedUserId;
  }

  get lastContactDate(): Date | undefined {
    return this.props.lastContactDate;
  }

  get nextFollowUpDate(): Date | undefined {
    return this.props.nextFollowUpDate;
  }

  get leadScore(): number | undefined {
    return this.props.leadScore;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateLegalName(legalName: string): void {
    this.props.legalName = legalName;
    this.props.updatedAt = new Date();
  }

  updateType(type: CompanyType['value']): void {
    this.props.type = { value: type };
    this.props.updatedAt = new Date();
  }

  updateStatus(status: CompanyStatus['value']): void {
    this.props.status = { value: status };
    this.props.updatedAt = new Date();
  }

  updateSize(size: CompanySize['value']): void {
    this.props.size = { value: size };
    this.props.updatedAt = new Date();
  }

  updateIndustry(industry: string): void {
    this.props.industry = { value: industry };
    this.props.updatedAt = new Date();
  }

  updateSource(source: CompanySource['value']): void {
    this.props.source = { value: source };
    this.props.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phone?: string, website?: string): void {
    if (email !== undefined) this.props.email = email;
    if (phone !== undefined) this.props.phone = phone;
    if (website !== undefined) this.props.website = website;
    this.props.updatedAt = new Date();
  }

  updateAddress(address: Address): void {
    this.props.address = address;
    this.props.updatedAt = new Date();
  }

  updateBillingAddress(address: Address): void {
    this.props.billingAddress = address;
    this.props.updatedAt = new Date();
  }

  updateShippingAddress(address: Address): void {
    this.props.shippingAddress = address;
    this.props.updatedAt = new Date();
  }

  updateTaxInfo(taxId?: string, vatNumber?: string, registrationNumber?: string): void {
    if (taxId !== undefined) this.props.taxId = taxId;
    if (vatNumber !== undefined) this.props.vatNumber = vatNumber;
    if (registrationNumber !== undefined) this.props.registrationNumber = registrationNumber;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: Partial<CompanySettings>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  updateAnnualRevenue(revenue: Money): void {
    this.props.annualRevenue = revenue;
    this.props.updatedAt = new Date();
  }

  updateEmployeeCount(count: number): void {
    this.props.employeeCount = count;
    this.props.updatedAt = new Date();
  }

  updateFoundedYear(year: number): void {
    this.props.foundedYear = year;
    this.props.updatedAt = new Date();
  }

  assignToUser(userId: string): void {
    this.props.assignedUserId = userId;
    this.props.updatedAt = new Date();
  }

  unassignUser(): void {
    this.props.assignedUserId = undefined;
    this.props.updatedAt = new Date();
  }

  recordContact(): void {
    this.props.lastContactDate = new Date();
    this.props.updatedAt = new Date();
  }

  scheduleFollowUp(date: Date): void {
    this.props.nextFollowUpDate = date;
    this.props.updatedAt = new Date();
  }

  updateLeadScore(score: number): void {
    this.props.leadScore = Math.max(0, Math.min(100, score));
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // BUSINESS RULES
  // ========================================================================

  isActive(): boolean {
    return this.props.isActive && this.props.status.value === 'active';
  }

  isCustomer(): boolean {
    return this.props.type.value === 'customer';
  }

  isSupplier(): boolean {
    return this.props.type.value === 'supplier';
  }

  isPartner(): boolean {
    return this.props.type.value === 'partner';
  }

  isProspect(): boolean {
    return this.props.type.value === 'prospect' || this.props.status.value === 'prospect';
  }

  isLead(): boolean {
    return this.props.status.value === 'lead';
  }

  isAssigned(): boolean {
    return !!this.props.assignedUserId;
  }

  hasParentCompany(): boolean {
    return !!this.props.parentCompanyId;
  }

  isOverdueForFollowUp(): boolean {
    if (!this.props.nextFollowUpDate) return false;
    return new Date() > this.props.nextFollowUpDate;
  }

  getDaysSinceLastContact(): number {
    if (!this.props.lastContactDate) return -1;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.lastContactDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilFollowUp(): number {
    if (!this.props.nextFollowUpDate) return -1;
    const now = new Date();
    const diffTime = this.props.nextFollowUpDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getLeadScoreLevel(): 'low' | 'medium' | 'high' {
    if (!this.props.leadScore) return 'low';
    if (this.props.leadScore < 30) return 'low';
    if (this.props.leadScore < 70) return 'medium';
    return 'high';
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  static validateName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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

  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  static validateWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static validateTaxId(taxId: string): boolean {
    // Basic validation - can be enhanced based on country
    return taxId.length >= 5 && taxId.length <= 20;
  }

  static validateVatNumber(vatNumber: string): boolean {
    // Basic validation - can be enhanced based on country
    return vatNumber.length >= 8 && vatNumber.length <= 15;
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toPersistence(): any {
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

  toDTO(): any {
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

  // ========================================================================
  // EQUALITY
  // ========================================================================

  equals(other: Company): boolean {
    return this.props.id.value === other.props.id.value;
  }

  hashCode(): string {
    return this.props.id.value;
  }
}

import { z } from 'zod';
import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';

// ============================================================================
// CONTACT ENTITY
// ============================================================================

export interface ContactId {
  value: string;
}

export interface OrganizationId {
  value: string;
}

export interface CompanyId {
  value: string;
}

export interface ContactType {
  value: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user' | 'technical' | 'financial' | 'procurement';
}

export interface ContactStatus {
  value: 'active' | 'inactive' | 'unsubscribed' | 'bounced' | 'spam' | 'deleted';
}

export interface ContactSource {
  value: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'event' | 'trade_show' | 'webinar' | 'content' | 'advertising' | 'other';
}

export interface ContactPriority {
  value: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ContactSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    phone: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  customFields: Record<string, any>;
  tags: string[];
  notes: string;
  internalNotes: string;
}

export interface ContactProps {
  id: ContactId;
  organizationId: OrganizationId;
  companyId?: CompanyId;
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  department?: string;
  type: ContactType;
  status: ContactStatus;
  source: ContactSource;
  priority: ContactPriority;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  address?: Address;
  birthday?: Date;
  anniversary?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  children?: number;
  education?: string;
  profession?: string;
  industry?: string;
  experience?: number;
  salary?: Money;
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    other?: Record<string, string>;
  };
  communication: {
    preferredMethod: 'email' | 'phone' | 'sms' | 'whatsapp' | 'linkedin' | 'other';
    bestTimeToCall: string;
    timeZone: string;
    doNotCall: boolean;
    doNotEmail: boolean;
    doNotSms: boolean;
    optInDate?: Date;
    optOutDate?: Date;
  };
  settings: ContactSettings;
  assignedUserId?: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  leadScore?: number;
  engagementScore?: number;
  lastEmailOpen?: Date;
  lastEmailClick?: Date;
  lastWebsiteVisit?: Date;
  lastSocialMediaInteraction?: Date;
  totalInteractions: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalCallsMade: number;
  totalMeetingsScheduled: number;
  totalMeetingsAttended: number;
  totalDealsWon: number;
  totalDealsLost: number;
  totalRevenue: Money;
  isActive: boolean;
  isVerified: boolean;
  isOptedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Contact {
  private constructor(private props: ContactProps) {}

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<ContactProps, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const now = new Date();
    return new Contact({
      ...props,
      id: { value: crypto.randomUUID() },
      createdAt: now,
      updatedAt: now
    });
  }

  static fromPersistence(data: any): Contact {
    return new Contact({
      id: { value: data.id },
      organizationId: { value: data.organizationId },
      companyId: data.companyId ? { value: data.companyId } : undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      title: data.title,
      department: data.department,
      type: { value: data.type },
      status: { value: data.status },
      source: { value: data.source },
      priority: { value: data.priority },
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      fax: data.fax,
      website: data.website,
      address: data.address ? Address.create(data.address) : undefined,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      anniversary: data.anniversary ? new Date(data.anniversary) : undefined,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      children: data.children,
      education: data.education,
      profession: data.profession,
      industry: data.industry,
      experience: data.experience,
      salary: data.salary ? Money.create(data.salary.amount, data.salary.currency) : undefined,
      socialMedia: data.socialMedia || {},
      communication: data.communication || this.getDefaultCommunication(),
      settings: data.settings || this.getDefaultSettings(),
      assignedUserId: data.assignedUserId,
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : undefined,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
      leadScore: data.leadScore,
      engagementScore: data.engagementScore,
      lastEmailOpen: data.lastEmailOpen ? new Date(data.lastEmailOpen) : undefined,
      lastEmailClick: data.lastEmailClick ? new Date(data.lastEmailClick) : undefined,
      lastWebsiteVisit: data.lastWebsiteVisit ? new Date(data.lastWebsiteVisit) : undefined,
      lastSocialMediaInteraction: data.lastSocialMediaInteraction ? new Date(data.lastSocialMediaInteraction) : undefined,
      totalInteractions: data.totalInteractions || 0,
      totalEmailsSent: data.totalEmailsSent || 0,
      totalEmailsOpened: data.totalEmailsOpened || 0,
      totalEmailsClicked: data.totalEmailsClicked || 0,
      totalCallsMade: data.totalCallsMade || 0,
      totalMeetingsScheduled: data.totalMeetingsScheduled || 0,
      totalMeetingsAttended: data.totalMeetingsAttended || 0,
      totalDealsWon: data.totalDealsWon || 0,
      totalDealsLost: data.totalDealsLost || 0,
      totalRevenue: data.totalRevenue ? Money.create(data.totalRevenue.amount, data.totalRevenue.currency) : Money.create(0, 'EUR'),
      isActive: data.isActive,
      isVerified: data.isVerified || false,
      isOptedIn: data.isOptedIn || false,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  private static getDefaultCommunication() {
    return {
      preferredMethod: 'email' as const,
      bestTimeToCall: '9:00-17:00',
      timeZone: 'UTC',
      doNotCall: false,
      doNotEmail: false,
      doNotSms: false
    };
  }

  private static getDefaultSettings(): ContactSettings {
    return {
      notifications: {
        email: true,
        sms: false,
        push: false,
        phone: false
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      },
      customFields: {},
      tags: [],
      notes: '',
      internalNotes: ''
    };
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get id(): ContactId {
    return this.props.id;
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get companyId(): CompanyId | undefined {
    return this.props.companyId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get middleName(): string | undefined {
    return this.props.middleName;
  }

  get title(): string | undefined {
    return this.props.title;
  }

  get department(): string | undefined {
    return this.props.department;
  }

  get type(): ContactType {
    return this.props.type;
  }

  get status(): ContactStatus {
    return this.props.status;
  }

  get source(): ContactSource {
    return this.props.source;
  }

  get priority(): ContactPriority {
    return this.props.priority;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get mobile(): string | undefined {
    return this.props.mobile;
  }

  get fax(): string | undefined {
    return this.props.fax;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get address(): Address | undefined {
    return this.props.address;
  }

  get birthday(): Date | undefined {
    return this.props.birthday;
  }

  get anniversary(): Date | undefined {
    return this.props.anniversary;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get maritalStatus(): string | undefined {
    return this.props.maritalStatus;
  }

  get children(): number | undefined {
    return this.props.children;
  }

  get education(): string | undefined {
    return this.props.education;
  }

  get profession(): string | undefined {
    return this.props.profession;
  }

  get industry(): string | undefined {
    return this.props.industry;
  }

  get experience(): number | undefined {
    return this.props.experience;
  }

  get salary(): Money | undefined {
    return this.props.salary;
  }

  get socialMedia(): Record<string, any> {
    return this.props.socialMedia;
  }

  get communication(): Record<string, any> {
    return this.props.communication;
  }

  get settings(): ContactSettings {
    return this.props.settings;
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

  get engagementScore(): number | undefined {
    return this.props.engagementScore;
  }

  get lastEmailOpen(): Date | undefined {
    return this.props.lastEmailOpen;
  }

  get lastEmailClick(): Date | undefined {
    return this.props.lastEmailClick;
  }

  get lastWebsiteVisit(): Date | undefined {
    return this.props.lastWebsiteVisit;
  }

  get lastSocialMediaInteraction(): Date | undefined {
    return this.props.lastSocialMediaInteraction;
  }

  get totalInteractions(): number {
    return this.props.totalInteractions;
  }

  get totalEmailsSent(): number {
    return this.props.totalEmailsSent;
  }

  get totalEmailsOpened(): number {
    return this.props.totalEmailsOpened;
  }

  get totalEmailsClicked(): number {
    return this.props.totalEmailsClicked;
  }

  get totalCallsMade(): number {
    return this.props.totalCallsMade;
  }

  get totalMeetingsScheduled(): number {
    return this.props.totalMeetingsScheduled;
  }

  get totalMeetingsAttended(): number {
    return this.props.totalMeetingsAttended;
  }

  get totalDealsWon(): number {
    return this.props.totalDealsWon;
  }

  get totalDealsLost(): number {
    return this.props.totalDealsLost;
  }

  get totalRevenue(): Money {
    return this.props.totalRevenue;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get isOptedIn(): boolean {
    return this.props.isOptedIn;
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

  updateName(firstName: string, lastName: string, middleName?: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    if (middleName !== undefined) this.props.middleName = middleName;
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDepartment(department: string): void {
    this.props.department = department;
    this.props.updatedAt = new Date();
  }

  updateType(type: ContactType['value']): void {
    this.props.type = { value: type };
    this.props.updatedAt = new Date();
  }

  updateStatus(status: ContactStatus['value']): void {
    this.props.status = { value: status };
    this.props.updatedAt = new Date();
  }

  updateSource(source: ContactSource['value']): void {
    this.props.source = { value: source };
    this.props.updatedAt = new Date();
  }

  updatePriority(priority: ContactPriority['value']): void {
    this.props.priority = { value: priority };
    this.props.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phone?: string, mobile?: string, fax?: string, website?: string): void {
    if (email !== undefined) this.props.email = email;
    if (phone !== undefined) this.props.phone = phone;
    if (mobile !== undefined) this.props.mobile = mobile;
    if (fax !== undefined) this.props.fax = fax;
    if (website !== undefined) this.props.website = website;
    this.props.updatedAt = new Date();
  }

  updateAddress(address: Address): void {
    this.props.address = address;
    this.props.updatedAt = new Date();
  }

  updatePersonalInfo(birthday?: Date, anniversary?: Date, gender?: string, maritalStatus?: string, children?: number): void {
    if (birthday !== undefined) this.props.birthday = birthday;
    if (anniversary !== undefined) this.props.anniversary = anniversary;
    if (gender !== undefined) this.props.gender = gender;
    if (maritalStatus !== undefined) this.props.maritalStatus = maritalStatus;
    if (children !== undefined) this.props.children = children;
    this.props.updatedAt = new Date();
  }

  updateProfessionalInfo(education?: string, profession?: string, industry?: string, experience?: number, salary?: Money): void {
    if (education !== undefined) this.props.education = education;
    if (profession !== undefined) this.props.profession = profession;
    if (industry !== undefined) this.props.industry = industry;
    if (experience !== undefined) this.props.experience = experience;
    if (salary !== undefined) this.props.salary = salary;
    this.props.updatedAt = new Date();
  }

  updateSocialMedia(socialMedia: Record<string, any>): void {
    this.props.socialMedia = { ...this.props.socialMedia, ...socialMedia };
    this.props.updatedAt = new Date();
  }

  updateCommunication(communication: Partial<Record<string, any>>): void {
    this.props.communication = { ...this.props.communication, ...communication };
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: Partial<ContactSettings>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  assignToCompany(companyId: string): void {
    this.props.companyId = { value: companyId };
    this.props.updatedAt = new Date();
  }

  unassignFromCompany(): void {
    this.props.companyId = undefined;
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
    this.props.totalInteractions += 1;
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

  updateEngagementScore(score: number): void {
    this.props.engagementScore = Math.max(0, Math.min(100, score));
    this.props.updatedAt = new Date();
  }

  recordEmailSent(): void {
    this.props.totalEmailsSent += 1;
    this.props.updatedAt = new Date();
  }

  recordEmailOpened(): void {
    this.props.totalEmailsOpened += 1;
    this.props.lastEmailOpen = new Date();
    this.props.updatedAt = new Date();
  }

  recordEmailClicked(): void {
    this.props.totalEmailsClicked += 1;
    this.props.lastEmailClick = new Date();
    this.props.updatedAt = new Date();
  }

  recordCallMade(): void {
    this.props.totalCallsMade += 1;
    this.props.updatedAt = new Date();
  }

  recordMeetingScheduled(): void {
    this.props.totalMeetingsScheduled += 1;
    this.props.updatedAt = new Date();
  }

  recordMeetingAttended(): void {
    this.props.totalMeetingsAttended += 1;
    this.props.updatedAt = new Date();
  }

  recordDealWon(revenue: Money): void {
    this.props.totalDealsWon += 1;
    this.props.totalRevenue = this.props.totalRevenue.add(revenue);
    this.props.updatedAt = new Date();
  }

  recordDealLost(): void {
    this.props.totalDealsLost += 1;
    this.props.updatedAt = new Date();
  }

  recordWebsiteVisit(): void {
    this.props.lastWebsiteVisit = new Date();
    this.props.updatedAt = new Date();
  }

  recordSocialMediaInteraction(): void {
    this.props.lastSocialMediaInteraction = new Date();
    this.props.updatedAt = new Date();
  }

  verify(): void {
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
  }

  unverify(): void {
    this.props.isVerified = false;
    this.props.updatedAt = new Date();
  }

  optIn(): void {
    this.props.isOptedIn = true;
    this.props.communication.optInDate = new Date();
    this.props.updatedAt = new Date();
  }

  optOut(): void {
    this.props.isOptedIn = false;
    this.props.communication.optOutDate = new Date();
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

  isPrimary(): boolean {
    return this.props.type.value === 'primary';
  }

  isDecisionMaker(): boolean {
    return this.props.type.value === 'decision_maker';
  }

  isInfluencer(): boolean {
    return this.props.type.value === 'influencer';
  }

  isTechnical(): boolean {
    return this.props.type.value === 'technical';
  }

  isFinancial(): boolean {
    return this.props.type.value === 'financial';
  }

  isProcurement(): boolean {
    return this.props.type.value === 'procurement';
  }

  isAssigned(): boolean {
    return !!this.props.assignedUserId;
  }

  hasCompany(): boolean {
    return !!this.props.companyId;
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

  getEngagementScoreLevel(): 'low' | 'medium' | 'high' {
    if (!this.props.engagementScore) return 'low';
    if (this.props.engagementScore < 30) return 'low';
    if (this.props.engagementScore < 70) return 'medium';
    return 'high';
  }

  getFullName(): string {
    const parts = [this.props.firstName];
    if (this.props.middleName) parts.push(this.props.middleName);
    parts.push(this.props.lastName);
    return parts.join(' ');
  }

  getDisplayName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  getEmailOpenRate(): number {
    if (this.props.totalEmailsSent === 0) return 0;
    return (this.props.totalEmailsOpened / this.props.totalEmailsSent) * 100;
  }

  getEmailClickRate(): number {
    if (this.props.totalEmailsSent === 0) return 0;
    return (this.props.totalEmailsClicked / this.props.totalEmailsSent) * 100;
  }

  getMeetingAttendanceRate(): number {
    if (this.props.totalMeetingsScheduled === 0) return 0;
    return (this.props.totalMeetingsAttended / this.props.totalMeetingsScheduled) * 100;
  }

  getDealWinRate(): number {
    const totalDeals = this.props.totalDealsWon + this.props.totalDealsLost;
    if (totalDeals === 0) return 0;
    return (this.props.totalDealsWon / totalDeals) * 100;
  }

  getAverageDealValue(): Money {
    if (this.props.totalDealsWon === 0) return Money.create(0, this.props.totalRevenue.currency);
    return this.props.totalRevenue.divide(this.props.totalDealsWon);
  }

  isBirthdayToday(): boolean {
    if (!this.props.birthday) return false;
    const today = new Date();
    const birthday = new Date(this.props.birthday);
    return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
  }

  isAnniversaryToday(): boolean {
    if (!this.props.anniversary) return false;
    const today = new Date();
    const anniversary = new Date(this.props.anniversary);
    return today.getMonth() === anniversary.getMonth() && today.getDate() === anniversary.getDate();
  }

  getAge(): number | null {
    if (!this.props.birthday) return null;
    const today = new Date();
    const birthday = new Date(this.props.birthday);
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  static validateName(firstName: string, lastName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!firstName || firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!lastName || lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (firstName.length > 100) {
      errors.push('First name cannot exceed 100 characters');
    }

    if (lastName.length > 100) {
      errors.push('Last name cannot exceed 100 characters');
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

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static validateWebsite(website: string): boolean {
    try {
      new URL(website);
      return true;
    } catch {
      return false;
    }
  }

  static validateSocialMediaUrl(url: string, platform: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      switch (platform.toLowerCase()) {
        case 'linkedin':
          return domain.includes('linkedin.com');
        case 'twitter':
          return domain.includes('twitter.com') || domain.includes('x.com');
        case 'facebook':
          return domain.includes('facebook.com');
        case 'instagram':
          return domain.includes('instagram.com');
        case 'youtube':
          return domain.includes('youtube.com');
        case 'tiktok':
          return domain.includes('tiktok.com');
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toPersistence(): any {
    return {
      id: this.props.id.value,
      organizationId: this.props.organizationId.value,
      companyId: this.props.companyId?.value,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      middleName: this.props.middleName,
      title: this.props.title,
      department: this.props.department,
      type: this.props.type.value,
      status: this.props.status.value,
      source: this.props.source.value,
      priority: this.props.priority.value,
      email: this.props.email,
      phone: this.props.phone,
      mobile: this.props.mobile,
      fax: this.props.fax,
      website: this.props.website,
      address: this.props.address?.toJSON(),
      birthday: this.props.birthday,
      anniversary: this.props.anniversary,
      gender: this.props.gender,
      maritalStatus: this.props.maritalStatus,
      children: this.props.children,
      education: this.props.education,
      profession: this.props.profession,
      industry: this.props.industry,
      experience: this.props.experience,
      salary: this.props.salary?.toJSON(),
      socialMedia: this.props.socialMedia,
      communication: this.props.communication,
      settings: this.props.settings,
      assignedUserId: this.props.assignedUserId,
      lastContactDate: this.props.lastContactDate,
      nextFollowUpDate: this.props.nextFollowUpDate,
      leadScore: this.props.leadScore,
      engagementScore: this.props.engagementScore,
      lastEmailOpen: this.props.lastEmailOpen,
      lastEmailClick: this.props.lastEmailClick,
      lastWebsiteVisit: this.props.lastWebsiteVisit,
      lastSocialMediaInteraction: this.props.lastSocialMediaInteraction,
      totalInteractions: this.props.totalInteractions,
      totalEmailsSent: this.props.totalEmailsSent,
      totalEmailsOpened: this.props.totalEmailsOpened,
      totalEmailsClicked: this.props.totalEmailsClicked,
      totalCallsMade: this.props.totalCallsMade,
      totalMeetingsScheduled: this.props.totalMeetingsScheduled,
      totalMeetingsAttended: this.props.totalMeetingsAttended,
      totalDealsWon: this.props.totalDealsWon,
      totalDealsLost: this.props.totalDealsLost,
      totalRevenue: this.props.totalRevenue.toJSON(),
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      isOptedIn: this.props.isOptedIn,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }

  toDTO(): any {
    return {
      id: this.props.id.value,
      organizationId: this.props.organizationId.value,
      companyId: this.props.companyId?.value,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      middleName: this.props.middleName,
      title: this.props.title,
      department: this.props.department,
      type: this.props.type.value,
      status: this.props.status.value,
      source: this.props.source.value,
      priority: this.props.priority.value,
      email: this.props.email,
      phone: this.props.phone,
      mobile: this.props.mobile,
      fax: this.props.fax,
      website: this.props.website,
      address: this.props.address?.toJSON(),
      birthday: this.props.birthday,
      anniversary: this.props.anniversary,
      gender: this.props.gender,
      maritalStatus: this.props.maritalStatus,
      children: this.props.children,
      education: this.props.education,
      profession: this.props.profession,
      industry: this.props.industry,
      experience: this.props.experience,
      salary: this.props.salary?.toJSON(),
      socialMedia: this.props.socialMedia,
      communication: this.props.communication,
      settings: this.props.settings,
      assignedUserId: this.props.assignedUserId,
      lastContactDate: this.props.lastContactDate,
      nextFollowUpDate: this.props.nextFollowUpDate,
      leadScore: this.props.leadScore,
      engagementScore: this.props.engagementScore,
      lastEmailOpen: this.props.lastEmailOpen,
      lastEmailClick: this.props.lastEmailClick,
      lastWebsiteVisit: this.props.lastWebsiteVisit,
      lastSocialMediaInteraction: this.props.lastSocialMediaInteraction,
      totalInteractions: this.props.totalInteractions,
      totalEmailsSent: this.props.totalEmailsSent,
      totalEmailsOpened: this.props.totalEmailsOpened,
      totalEmailsClicked: this.props.totalEmailsClicked,
      totalCallsMade: this.props.totalCallsMade,
      totalMeetingsScheduled: this.props.totalMeetingsScheduled,
      totalMeetingsAttended: this.props.totalMeetingsAttended,
      totalDealsWon: this.props.totalDealsWon,
      totalDealsLost: this.props.totalDealsLost,
      totalRevenue: this.props.totalRevenue.toJSON(),
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      isOptedIn: this.props.isOptedIn,
      fullName: this.getFullName(),
      displayName: this.getDisplayName(),
      leadScoreLevel: this.getLeadScoreLevel(),
      engagementScoreLevel: this.getEngagementScoreLevel(),
      emailOpenRate: this.getEmailOpenRate(),
      emailClickRate: this.getEmailClickRate(),
      meetingAttendanceRate: this.getMeetingAttendanceRate(),
      dealWinRate: this.getDealWinRate(),
      averageDealValue: this.getAverageDealValue().toJSON(),
      isPrimary: this.isPrimary(),
      isDecisionMaker: this.isDecisionMaker(),
      isInfluencer: this.isInfluencer(),
      isTechnical: this.isTechnical(),
      isFinancial: this.isFinancial(),
      isProcurement: this.isProcurement(),
      isAssigned: this.isAssigned(),
      hasCompany: this.hasCompany(),
      isOverdueForFollowUp: this.isOverdueForFollowUp(),
      daysSinceLastContact: this.getDaysSinceLastContact(),
      daysUntilFollowUp: this.getDaysUntilFollowUp(),
      age: this.getAge(),
      isBirthdayToday: this.isBirthdayToday(),
      isAnniversaryToday: this.isAnniversaryToday(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt
    };
  }

  // ========================================================================
  // EQUALITY
  // ========================================================================

  equals(other: Contact): boolean {
    return this.props.id.value === other.props.id.value;
  }

  hashCode(): string {
    return this.props.id.value;
  }
}

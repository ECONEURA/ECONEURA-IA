import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';
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
export declare class Contact {
    private props;
    private constructor();
    static create(props: Omit<ContactProps, 'id' | 'createdAt' | 'updatedAt'>): Contact;
    static fromPersistence(data: any): Contact;
    private static getDefaultCommunication;
    private static getDefaultSettings;
    get id(): ContactId;
    get organizationId(): OrganizationId;
    get companyId(): CompanyId | undefined;
    get firstName(): string;
    get lastName(): string;
    get middleName(): string | undefined;
    get title(): string | undefined;
    get department(): string | undefined;
    get type(): ContactType;
    get status(): ContactStatus;
    get source(): ContactSource;
    get priority(): ContactPriority;
    get email(): string | undefined;
    get phone(): string | undefined;
    get mobile(): string | undefined;
    get fax(): string | undefined;
    get website(): string | undefined;
    get address(): Address | undefined;
    get birthday(): Date | undefined;
    get anniversary(): Date | undefined;
    get gender(): string | undefined;
    get maritalStatus(): string | undefined;
    get children(): number | undefined;
    get education(): string | undefined;
    get profession(): string | undefined;
    get industry(): string | undefined;
    get experience(): number | undefined;
    get salary(): Money | undefined;
    get socialMedia(): Record<string, any>;
    get communication(): Record<string, any>;
    get settings(): ContactSettings;
    get assignedUserId(): string | undefined;
    get lastContactDate(): Date | undefined;
    get nextFollowUpDate(): Date | undefined;
    get leadScore(): number | undefined;
    get engagementScore(): number | undefined;
    get lastEmailOpen(): Date | undefined;
    get lastEmailClick(): Date | undefined;
    get lastWebsiteVisit(): Date | undefined;
    get lastSocialMediaInteraction(): Date | undefined;
    get totalInteractions(): number;
    get totalEmailsSent(): number;
    get totalEmailsOpened(): number;
    get totalEmailsClicked(): number;
    get totalCallsMade(): number;
    get totalMeetingsScheduled(): number;
    get totalMeetingsAttended(): number;
    get totalDealsWon(): number;
    get totalDealsLost(): number;
    get totalRevenue(): Money;
    get isActive(): boolean;
    get isVerified(): boolean;
    get isOptedIn(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(firstName: string, lastName: string, middleName?: string): void;
    updateTitle(title: string): void;
    updateDepartment(department: string): void;
    updateType(type: ContactType['value']): void;
    updateStatus(status: ContactStatus['value']): void;
    updateSource(source: ContactSource['value']): void;
    updatePriority(priority: ContactPriority['value']): void;
    updateContactInfo(email?: string, phone?: string, mobile?: string, fax?: string, website?: string): void;
    updateAddress(address: Address): void;
    updatePersonalInfo(birthday?: Date, anniversary?: Date, gender?: string, maritalStatus?: string, children?: number): void;
    updateProfessionalInfo(education?: string, profession?: string, industry?: string, experience?: number, salary?: Money): void;
    updateSocialMedia(socialMedia: Record<string, any>): void;
    updateCommunication(communication: Partial<Record<string, any>>): void;
    updateSettings(settings: Partial<ContactSettings>): void;
    assignToCompany(companyId: string): void;
    unassignFromCompany(): void;
    assignToUser(userId: string): void;
    unassignUser(): void;
    recordContact(): void;
    scheduleFollowUp(date: Date): void;
    updateLeadScore(score: number): void;
    updateEngagementScore(score: number): void;
    recordEmailSent(): void;
    recordEmailOpened(): void;
    recordEmailClicked(): void;
    recordCallMade(): void;
    recordMeetingScheduled(): void;
    recordMeetingAttended(): void;
    recordDealWon(revenue: Money): void;
    recordDealLost(): void;
    recordWebsiteVisit(): void;
    recordSocialMediaInteraction(): void;
    verify(): void;
    unverify(): void;
    optIn(): void;
    optOut(): void;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    isPrimary(): boolean;
    isDecisionMaker(): boolean;
    isInfluencer(): boolean;
    isTechnical(): boolean;
    isFinancial(): boolean;
    isProcurement(): boolean;
    isAssigned(): boolean;
    hasCompany(): boolean;
    isOverdueForFollowUp(): boolean;
    getDaysSinceLastContact(): number;
    getDaysUntilFollowUp(): number;
    getLeadScoreLevel(): 'low' | 'medium' | 'high';
    getEngagementScoreLevel(): 'low' | 'medium' | 'high';
    getFullName(): string;
    getDisplayName(): string;
    getEmailOpenRate(): number;
    getEmailClickRate(): number;
    getMeetingAttendanceRate(): number;
    getDealWinRate(): number;
    getAverageDealValue(): Money;
    isBirthdayToday(): boolean;
    isAnniversaryToday(): boolean;
    getAge(): number | null;
    static validateName(firstName: string, lastName: string): {
        isValid: boolean;
        errors: string[];
    };
    static validateEmail(email: string): boolean;
    static validatePhone(phone: string): boolean;
    static validateWebsite(website: string): boolean;
    static validateSocialMediaUrl(url: string, platform: string): boolean;
    toPersistence(): any;
    toDTO(): any;
    equals(other: Contact): boolean;
    hashCode(): string;
}
//# sourceMappingURL=contact.entity.d.ts.map
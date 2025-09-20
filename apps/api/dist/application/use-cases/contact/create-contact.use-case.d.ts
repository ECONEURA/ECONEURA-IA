import { Contact } from '../../../domain/entities/contact.entity.js';
import { ContactRepository } from '../../../domain/repositories/contact.repository.js';
export interface CreateContactRequest {
    organizationId: string;
    companyId?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    title?: string;
    department?: string;
    type: 'primary' | 'secondary' | 'decision_maker' | 'influencer' | 'user' | 'technical' | 'financial' | 'procurement';
    status: 'active' | 'inactive' | 'unsubscribed' | 'bounced' | 'spam' | 'deleted';
    source: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'event' | 'trade_show' | 'webinar' | 'content' | 'advertising' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    email?: string;
    phone?: string;
    mobile?: string;
    fax?: string;
    website?: string;
    address?: {
        street: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
        countryCode: string;
    };
    birthday?: Date;
    anniversary?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
    children?: number;
    education?: string;
    profession?: string;
    industry?: string;
    experience?: number;
    salary?: {
        amount: number;
        currency: string;
    };
    socialMedia?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        tiktok?: string;
        other?: Record<string, string>;
    };
    communication?: {
        preferredMethod?: 'email' | 'phone' | 'sms' | 'whatsapp' | 'linkedin' | 'other';
        bestTimeToCall?: string;
        timeZone?: string;
        doNotCall?: boolean;
        doNotEmail?: boolean;
        doNotSms?: boolean;
    };
    settings?: {
        notifications?: {
            email?: boolean;
            sms?: boolean;
            push?: boolean;
            phone?: boolean;
        };
        preferences?: {
            language?: string;
            timezone?: string;
            currency?: string;
            dateFormat?: string;
            timeFormat?: string;
        };
        customFields?: Record<string, any>;
        tags?: string[];
        notes?: string;
        internalNotes?: string;
    };
    assignedUserId?: string;
    nextFollowUpDate?: Date;
    leadScore?: number;
    engagementScore?: number;
    createdBy: string;
}
export interface CreateContactResponse {
    success: boolean;
    contact?: Contact;
    error?: string;
}
export declare class CreateContactUseCase {
    private contactRepository;
    constructor(contactRepository: ContactRepository);
    execute(request: CreateContactRequest): Promise<CreateContactResponse>;
    private validateRequest;
}
//# sourceMappingURL=create-contact.use-case.d.ts.map
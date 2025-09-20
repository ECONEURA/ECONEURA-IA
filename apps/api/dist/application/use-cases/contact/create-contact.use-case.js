import { Contact } from '../../../domain/entities/contact.entity.js';
import { Address } from '../../../domain/value-objects/address.vo.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class CreateContactUseCase {
    contactRepository;
    constructor(contactRepository) {
        this.contactRepository = contactRepository;
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
            if (request.email) {
                const existingContact = await this.contactRepository.searchByEmail(request.email, request.organizationId);
                if (existingContact.length > 0) {
                    return {
                        success: false,
                        error: 'Contact with this email already exists in the organization'
                    };
                }
            }
            let address;
            if (request.address) {
                address = Address.create(request.address);
            }
            let salary;
            if (request.salary) {
                salary = Money.create(request.salary.amount, request.salary.currency);
            }
            const contact = Contact.create({
                organizationId: request.organizationId,
                companyId: request.companyId ? request.companyId : undefined,
                firstName: request.firstName,
                lastName: request.lastName,
                middleName: request.middleName,
                title: request.title,
                department: request.department,
                type: request.type,
                status: request.status,
                source: request.source,
                priority: request.priority,
                email: request.email,
                phone: request.phone,
                mobile: request.mobile,
                fax: request.fax,
                website: request.website,
                address,
                birthday: request.birthday,
                anniversary: request.anniversary,
                gender: request.gender,
                maritalStatus: request.maritalStatus,
                children: request.children,
                education: request.education,
                profession: request.profession,
                industry: request.industry,
                experience: request.experience,
                salary,
                socialMedia: request.socialMedia || {},
                communication: {
                    preferredMethod: request.communication?.preferredMethod || 'email',
                    bestTimeToCall: request.communication?.bestTimeToCall || '9:00-17:00',
                    timeZone: request.communication?.timeZone || 'UTC',
                    doNotCall: request.communication?.doNotCall || false,
                    doNotEmail: request.communication?.doNotEmail || false,
                    doNotSms: request.communication?.doNotSms || false
                },
                settings: {
                    notifications: {
                        email: request.settings?.notifications?.email ?? true,
                        sms: request.settings?.notifications?.sms ?? false,
                        push: request.settings?.notifications?.push ?? false,
                        phone: request.settings?.notifications?.phone ?? false
                    },
                    preferences: {
                        language: request.settings?.preferences?.language ?? 'en',
                        timezone: request.settings?.preferences?.timezone ?? 'UTC',
                        currency: request.settings?.preferences?.currency ?? 'EUR',
                        dateFormat: request.settings?.preferences?.dateFormat ?? 'DD/MM/YYYY',
                        timeFormat: request.settings?.preferences?.timeFormat ?? '24h'
                    },
                    customFields: request.settings?.customFields ?? {},
                    tags: request.settings?.tags ?? [],
                    notes: request.settings?.notes ?? '',
                    internalNotes: request.settings?.internalNotes ?? ''
                },
                assignedUserId: request.assignedUserId,
                nextFollowUpDate: request.nextFollowUpDate,
                leadScore: request.leadScore,
                engagementScore: request.engagementScore,
                totalInteractions: 0,
                totalEmailsSent: 0,
                totalEmailsOpened: 0,
                totalEmailsClicked: 0,
                totalCallsMade: 0,
                totalMeetingsScheduled: 0,
                totalMeetingsAttended: 0,
                totalDealsWon: 0,
                totalDealsLost: 0,
                totalRevenue: Money.create(0, request.settings?.preferences?.currency || 'EUR'),
                isActive: true,
                isVerified: false,
                isOptedIn: false
            });
            const savedContact = await this.contactRepository.save(contact);
            return {
                success: true,
                contact: savedContact
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
        const nameValidation = Contact.validateName(request.firstName, request.lastName);
        if (!nameValidation.isValid) {
            errors.push(...nameValidation.errors);
        }
        if (request.middleName && request.middleName.length > 100) {
            errors.push('Middle name cannot exceed 100 characters');
        }
        const validTypes = ['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement'];
        if (!validTypes.includes(request.type)) {
            errors.push('Invalid contact type');
        }
        const validStatuses = ['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted'];
        if (!validStatuses.includes(request.status)) {
            errors.push('Invalid contact status');
        }
        const validSources = ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other'];
        if (!validSources.includes(request.source)) {
            errors.push('Invalid contact source');
        }
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(request.priority)) {
            errors.push('Invalid contact priority');
        }
        if (request.email && !Contact.validateEmail(request.email)) {
            errors.push('Invalid email format');
        }
        if (request.phone && !Contact.validatePhone(request.phone)) {
            errors.push('Invalid phone number format');
        }
        if (request.mobile && !Contact.validatePhone(request.mobile)) {
            errors.push('Invalid mobile number format');
        }
        if (request.fax && !Contact.validatePhone(request.fax)) {
            errors.push('Invalid fax number format');
        }
        if (request.website && !Contact.validateWebsite(request.website)) {
            errors.push('Invalid website URL');
        }
        if (request.companyId && request.companyId.trim().length === 0) {
            errors.push('Company ID cannot be empty');
        }
        if (request.children !== undefined && (request.children < 0 || request.children > 20)) {
            errors.push('Children count must be between 0 and 20');
        }
        if (request.experience !== undefined && (request.experience < 0 || request.experience > 50)) {
            errors.push('Experience must be between 0 and 50 years');
        }
        if (request.leadScore !== undefined && (request.leadScore < 0 || request.leadScore > 100)) {
            errors.push('Lead score must be between 0 and 100');
        }
        if (request.engagementScore !== undefined && (request.engagementScore < 0 || request.engagementScore > 100)) {
            errors.push('Engagement score must be between 0 and 100');
        }
        if (request.salary) {
            if (request.salary.amount < 0) {
                errors.push('Salary cannot be negative');
            }
            if (!request.salary.currency || request.salary.currency.length !== 3) {
                errors.push('Salary currency must be a 3-letter code');
            }
        }
        if (request.socialMedia) {
            if (request.socialMedia.linkedin && !Contact.validateSocialMediaUrl(request.socialMedia.linkedin, 'linkedin')) {
                errors.push('Invalid LinkedIn URL');
            }
            if (request.socialMedia.twitter && !Contact.validateSocialMediaUrl(request.socialMedia.twitter, 'twitter')) {
                errors.push('Invalid Twitter URL');
            }
            if (request.socialMedia.facebook && !Contact.validateSocialMediaUrl(request.socialMedia.facebook, 'facebook')) {
                errors.push('Invalid Facebook URL');
            }
            if (request.socialMedia.instagram && !Contact.validateSocialMediaUrl(request.socialMedia.instagram, 'instagram')) {
                errors.push('Invalid Instagram URL');
            }
            if (request.socialMedia.youtube && !Contact.validateSocialMediaUrl(request.socialMedia.youtube, 'youtube')) {
                errors.push('Invalid YouTube URL');
            }
            if (request.socialMedia.tiktok && !Contact.validateSocialMediaUrl(request.socialMedia.tiktok, 'tiktok')) {
                errors.push('Invalid TikTok URL');
            }
        }
        if (request.communication) {
            const validMethods = ['email', 'phone', 'sms', 'whatsapp', 'linkedin', 'other'];
            if (request.communication.preferredMethod && !validMethods.includes(request.communication.preferredMethod)) {
                errors.push('Invalid preferred communication method');
            }
        }
        if (request.assignedUserId && request.assignedUserId.trim().length === 0) {
            errors.push('Assigned user ID cannot be empty');
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
//# sourceMappingURL=create-contact.use-case.js.map
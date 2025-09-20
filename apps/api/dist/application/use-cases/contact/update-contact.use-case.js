import { Contact } from '../../../domain/entities/contact.entity.js';
import { Address } from '../../../domain/value-objects/address.vo.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
export class UpdateContactUseCase {
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
            const contact = await this.contactRepository.findById(request.contactId);
            if (!contact) {
                return {
                    success: false,
                    error: 'Contact not found'
                };
            }
            if (request.email && request.email !== contact.email) {
                const existingContact = await this.contactRepository.searchByEmail(request.email, contact.organizationId.value);
                if (existingContact.length > 0 && existingContact[0].id.value !== request.contactId) {
                    return {
                        success: false,
                        error: 'Contact with this email already exists in the organization'
                    };
                }
            }
            if (request.firstName !== undefined || request.lastName !== undefined || request.middleName !== undefined) {
                contact.updateName(request.firstName ?? contact.firstName, request.lastName ?? contact.lastName, request.middleName);
            }
            if (request.title !== undefined) {
                contact.updateTitle(request.title);
            }
            if (request.department !== undefined) {
                contact.updateDepartment(request.department);
            }
            if (request.type !== undefined) {
                contact.updateType(request.type);
            }
            if (request.status !== undefined) {
                contact.updateStatus(request.status);
            }
            if (request.source !== undefined) {
                contact.updateSource(request.source);
            }
            if (request.priority !== undefined) {
                contact.updatePriority(request.priority);
            }
            if (request.email !== undefined || request.phone !== undefined || request.mobile !== undefined || request.fax !== undefined || request.website !== undefined) {
                contact.updateContactInfo(request.email, request.phone, request.mobile, request.fax, request.website);
            }
            if (request.address !== undefined) {
                const address = Address.create(request.address);
                contact.updateAddress(address);
            }
            if (request.birthday !== undefined || request.anniversary !== undefined || request.gender !== undefined || request.maritalStatus !== undefined || request.children !== undefined) {
                contact.updatePersonalInfo(request.birthday, request.anniversary, request.gender, request.maritalStatus, request.children);
            }
            if (request.education !== undefined || request.profession !== undefined || request.industry !== undefined || request.experience !== undefined || request.salary !== undefined) {
                let salary;
                if (request.salary) {
                    salary = Money.create(request.salary.amount, request.salary.currency);
                }
                contact.updateProfessionalInfo(request.education, request.profession, request.industry, request.experience, salary);
            }
            if (request.socialMedia !== undefined) {
                contact.updateSocialMedia(request.socialMedia);
            }
            if (request.communication !== undefined) {
                contact.updateCommunication(request.communication);
            }
            if (request.settings !== undefined) {
                contact.updateSettings(request.settings);
            }
            if (request.companyId !== undefined) {
                if (request.companyId) {
                    contact.assignToCompany(request.companyId);
                }
                else {
                    contact.unassignFromCompany();
                }
            }
            if (request.assignedUserId !== undefined) {
                if (request.assignedUserId) {
                    contact.assignToUser(request.assignedUserId);
                }
                else {
                    contact.unassignUser();
                }
            }
            if (request.nextFollowUpDate !== undefined) {
                if (request.nextFollowUpDate) {
                    contact.scheduleFollowUp(request.nextFollowUpDate);
                }
                else {
                    contact.scheduleFollowUp(new Date(0));
                }
            }
            if (request.leadScore !== undefined) {
                contact.updateLeadScore(request.leadScore);
            }
            if (request.engagementScore !== undefined) {
                contact.updateEngagementScore(request.engagementScore);
            }
            const updatedContact = await this.contactRepository.update(contact);
            return {
                success: true,
                contact: updatedContact
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
        if (!request.contactId || request.contactId.trim().length === 0) {
            errors.push('Contact ID is required');
        }
        if (request.firstName !== undefined || request.lastName !== undefined) {
            const firstName = request.firstName || '';
            const lastName = request.lastName || '';
            const nameValidation = Contact.validateName(firstName, lastName);
            if (!nameValidation.isValid) {
                errors.push(...nameValidation.errors);
            }
        }
        if (request.middleName !== undefined && request.middleName && request.middleName.length > 100) {
            errors.push('Middle name cannot exceed 100 characters');
        }
        if (request.type !== undefined) {
            const validTypes = ['primary', 'secondary', 'decision_maker', 'influencer', 'user', 'technical', 'financial', 'procurement'];
            if (!validTypes.includes(request.type)) {
                errors.push('Invalid contact type');
            }
        }
        if (request.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'unsubscribed', 'bounced', 'spam', 'deleted'];
            if (!validStatuses.includes(request.status)) {
                errors.push('Invalid contact status');
            }
        }
        if (request.source !== undefined) {
            const validSources = ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'trade_show', 'webinar', 'content', 'advertising', 'other'];
            if (!validSources.includes(request.source)) {
                errors.push('Invalid contact source');
            }
        }
        if (request.priority !== undefined) {
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(request.priority)) {
                errors.push('Invalid contact priority');
            }
        }
        if (request.email !== undefined && request.email && !Contact.validateEmail(request.email)) {
            errors.push('Invalid email format');
        }
        if (request.phone !== undefined && request.phone && !Contact.validatePhone(request.phone)) {
            errors.push('Invalid phone number format');
        }
        if (request.mobile !== undefined && request.mobile && !Contact.validatePhone(request.mobile)) {
            errors.push('Invalid mobile number format');
        }
        if (request.fax !== undefined && request.fax && !Contact.validatePhone(request.fax)) {
            errors.push('Invalid fax number format');
        }
        if (request.website !== undefined && request.website && !Contact.validateWebsite(request.website)) {
            errors.push('Invalid website URL');
        }
        if (request.companyId !== undefined && request.companyId && request.companyId.trim().length === 0) {
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
        if (request.salary !== undefined) {
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
        if (request.assignedUserId !== undefined && request.assignedUserId && request.assignedUserId.trim().length === 0) {
            errors.push('Assigned user ID cannot be empty');
        }
        if (!request.updatedBy || request.updatedBy.trim().length === 0) {
            errors.push('Updated by user ID is required');
        }
        const hasUpdates = Object.keys(request).some(key => key !== 'contactId' &&
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
//# sourceMappingURL=update-contact.use-case.js.map
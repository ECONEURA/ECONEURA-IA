import { z } from 'zod';

import { Address } from '../value-objects/address.vo.js';
import { Money } from '../value-objects/money.vo.js';
export class Contact {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new Contact({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    static fromPersistence(data) {
        return new Contact({
            id: data.id,
            organizationId: data.organizationId,
            companyId: data.companyId ? data.companyId : undefined,
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            title: data.title,
            department: data.department,
            type: data.type,
            status: data.status,
            source: data.source,
            priority: data.priority,
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
    static getDefaultCommunication() {
        return {
            preferredMethod: 'email',
            bestTimeToCall: '9:00-17:00',
            timeZone: 'UTC',
            doNotCall: false,
            doNotEmail: false,
            doNotSms: false
        };
    }
    static getDefaultSettings() {
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
    get id() {
        return this.props.id;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get companyId() {
        return this.props.companyId;
    }
    get firstName() {
        return this.props.firstName;
    }
    get lastName() {
        return this.props.lastName;
    }
    get middleName() {
        return this.props.middleName;
    }
    get title() {
        return this.props.title;
    }
    get department() {
        return this.props.department;
    }
    get type() {
        return this.props.type;
    }
    get status() {
        return this.props.status;
    }
    get source() {
        return this.props.source;
    }
    get priority() {
        return this.props.priority;
    }
    get email() {
        return this.props.email;
    }
    get phone() {
        return this.props.phone;
    }
    get mobile() {
        return this.props.mobile;
    }
    get fax() {
        return this.props.fax;
    }
    get website() {
        return this.props.website;
    }
    get address() {
        return this.props.address;
    }
    get birthday() {
        return this.props.birthday;
    }
    get anniversary() {
        return this.props.anniversary;
    }
    get gender() {
        return this.props.gender;
    }
    get maritalStatus() {
        return this.props.maritalStatus;
    }
    get children() {
        return this.props.children;
    }
    get education() {
        return this.props.education;
    }
    get profession() {
        return this.props.profession;
    }
    get industry() {
        return this.props.industry;
    }
    get experience() {
        return this.props.experience;
    }
    get salary() {
        return this.props.salary;
    }
    get socialMedia() {
        return this.props.socialMedia;
    }
    get communication() {
        return this.props.communication;
    }
    get settings() {
        return this.props.settings;
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
    get engagementScore() {
        return this.props.engagementScore;
    }
    get lastEmailOpen() {
        return this.props.lastEmailOpen;
    }
    get lastEmailClick() {
        return this.props.lastEmailClick;
    }
    get lastWebsiteVisit() {
        return this.props.lastWebsiteVisit;
    }
    get lastSocialMediaInteraction() {
        return this.props.lastSocialMediaInteraction;
    }
    get totalInteractions() {
        return this.props.totalInteractions;
    }
    get totalEmailsSent() {
        return this.props.totalEmailsSent;
    }
    get totalEmailsOpened() {
        return this.props.totalEmailsOpened;
    }
    get totalEmailsClicked() {
        return this.props.totalEmailsClicked;
    }
    get totalCallsMade() {
        return this.props.totalCallsMade;
    }
    get totalMeetingsScheduled() {
        return this.props.totalMeetingsScheduled;
    }
    get totalMeetingsAttended() {
        return this.props.totalMeetingsAttended;
    }
    get totalDealsWon() {
        return this.props.totalDealsWon;
    }
    get totalDealsLost() {
        return this.props.totalDealsLost;
    }
    get totalRevenue() {
        return this.props.totalRevenue;
    }
    get isActive() {
        return this.props.isActive;
    }
    get isVerified() {
        return this.props.isVerified;
    }
    get isOptedIn() {
        return this.props.isOptedIn;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateName(firstName, lastName, middleName) {
        this.props.firstName = firstName;
        this.props.lastName = lastName;
        if (middleName !== undefined)
            this.props.middleName = middleName;
        this.props.updatedAt = new Date();
    }
    updateTitle(title) {
        this.props.title = title;
        this.props.updatedAt = new Date();
    }
    updateDepartment(department) {
        this.props.department = department;
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
    updateSource(source) {
        this.props.source = source;
        this.props.updatedAt = new Date();
    }
    updatePriority(priority) {
        this.props.priority = priority;
        this.props.updatedAt = new Date();
    }
    updateContactInfo(email, phone, mobile, fax, website) {
        if (email !== undefined)
            this.props.email = email;
        if (phone !== undefined)
            this.props.phone = phone;
        if (mobile !== undefined)
            this.props.mobile = mobile;
        if (fax !== undefined)
            this.props.fax = fax;
        if (website !== undefined)
            this.props.website = website;
        this.props.updatedAt = new Date();
    }
    updateAddress(address) {
        this.props.address = address;
        this.props.updatedAt = new Date();
    }
    updatePersonalInfo(birthday, anniversary, gender, maritalStatus, children) {
        if (birthday !== undefined)
            this.props.birthday = birthday;
        if (anniversary !== undefined)
            this.props.anniversary = anniversary;
        if (gender !== undefined)
            this.props.gender = gender;
        if (maritalStatus !== undefined)
            this.props.maritalStatus = maritalStatus;
        if (children !== undefined)
            this.props.children = children;
        this.props.updatedAt = new Date();
    }
    updateProfessionalInfo(education, profession, industry, experience, salary) {
        if (education !== undefined)
            this.props.education = education;
        if (profession !== undefined)
            this.props.profession = profession;
        if (industry !== undefined)
            this.props.industry = industry;
        if (experience !== undefined)
            this.props.experience = experience;
        if (salary !== undefined)
            this.props.salary = salary;
        this.props.updatedAt = new Date();
    }
    updateSocialMedia(socialMedia) {
        this.props.socialMedia = { ...this.props.socialMedia, ...socialMedia };
        this.props.updatedAt = new Date();
    }
    updateCommunication(communication) {
        this.props.communication = { ...this.props.communication, ...communication };
        this.props.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.props.settings = { ...this.props.settings, ...settings };
        this.props.updatedAt = new Date();
    }
    assignToCompany(companyId) {
        this.props.companyId = companyId;
        this.props.updatedAt = new Date();
    }
    unassignFromCompany() {
        this.props.companyId = undefined;
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
        this.props.totalInteractions += 1;
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
    updateEngagementScore(score) {
        this.props.engagementScore = Math.max(0, Math.min(100, score));
        this.props.updatedAt = new Date();
    }
    recordEmailSent() {
        this.props.totalEmailsSent += 1;
        this.props.updatedAt = new Date();
    }
    recordEmailOpened() {
        this.props.totalEmailsOpened += 1;
        this.props.lastEmailOpen = new Date();
        this.props.updatedAt = new Date();
    }
    recordEmailClicked() {
        this.props.totalEmailsClicked += 1;
        this.props.lastEmailClick = new Date();
        this.props.updatedAt = new Date();
    }
    recordCallMade() {
        this.props.totalCallsMade += 1;
        this.props.updatedAt = new Date();
    }
    recordMeetingScheduled() {
        this.props.totalMeetingsScheduled += 1;
        this.props.updatedAt = new Date();
    }
    recordMeetingAttended() {
        this.props.totalMeetingsAttended += 1;
        this.props.updatedAt = new Date();
    }
    recordDealWon(revenue) {
        this.props.totalDealsWon += 1;
        this.props.totalRevenue = this.props.totalRevenue.add(revenue);
        this.props.updatedAt = new Date();
    }
    recordDealLost() {
        this.props.totalDealsLost += 1;
        this.props.updatedAt = new Date();
    }
    recordWebsiteVisit() {
        this.props.lastWebsiteVisit = new Date();
        this.props.updatedAt = new Date();
    }
    recordSocialMediaInteraction() {
        this.props.lastSocialMediaInteraction = new Date();
        this.props.updatedAt = new Date();
    }
    verify() {
        this.props.isVerified = true;
        this.props.updatedAt = new Date();
    }
    unverify() {
        this.props.isVerified = false;
        this.props.updatedAt = new Date();
    }
    optIn() {
        this.props.isOptedIn = true;
        this.props.communication.optInDate = new Date();
        this.props.updatedAt = new Date();
    }
    optOut() {
        this.props.isOptedIn = false;
        this.props.communication.optOutDate = new Date();
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
    isPrimary() {
        return this.props.type.value === 'primary';
    }
    isDecisionMaker() {
        return this.props.type.value === 'decision_maker';
    }
    isInfluencer() {
        return this.props.type.value === 'influencer';
    }
    isTechnical() {
        return this.props.type.value === 'technical';
    }
    isFinancial() {
        return this.props.type.value === 'financial';
    }
    isProcurement() {
        return this.props.type.value === 'procurement';
    }
    isAssigned() {
        return !!this.props.assignedUserId;
    }
    hasCompany() {
        return !!this.props.companyId;
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
    getEngagementScoreLevel() {
        if (!this.props.engagementScore)
            return 'low';
        if (this.props.engagementScore < 30)
            return 'low';
        if (this.props.engagementScore < 70)
            return 'medium';
        return 'high';
    }
    getFullName() {
        const parts = [this.props.firstName];
        if (this.props.middleName)
            parts.push(this.props.middleName);
        parts.push(this.props.lastName);
        return parts.join(' ');
    }
    getDisplayName() {
        return `${this.props.firstName} ${this.props.lastName}`;
    }
    getEmailOpenRate() {
        if (this.props.totalEmailsSent === 0)
            return 0;
        return (this.props.totalEmailsOpened / this.props.totalEmailsSent) * 100;
    }
    getEmailClickRate() {
        if (this.props.totalEmailsSent === 0)
            return 0;
        return (this.props.totalEmailsClicked / this.props.totalEmailsSent) * 100;
    }
    getMeetingAttendanceRate() {
        if (this.props.totalMeetingsScheduled === 0)
            return 0;
        return (this.props.totalMeetingsAttended / this.props.totalMeetingsScheduled) * 100;
    }
    getDealWinRate() {
        const totalDeals = this.props.totalDealsWon + this.props.totalDealsLost;
        if (totalDeals === 0)
            return 0;
        return (this.props.totalDealsWon / totalDeals) * 100;
    }
    getAverageDealValue() {
        if (this.props.totalDealsWon === 0)
            return Money.create(0, this.props.totalRevenue.currency);
        return this.props.totalRevenue.divide(this.props.totalDealsWon);
    }
    isBirthdayToday() {
        if (!this.props.birthday)
            return false;
        const today = new Date();
        const birthday = new Date(this.props.birthday);
        return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
    }
    isAnniversaryToday() {
        if (!this.props.anniversary)
            return false;
        const today = new Date();
        const anniversary = new Date(this.props.anniversary);
        return today.getMonth() === anniversary.getMonth() && today.getDate() === anniversary.getDate();
    }
    getAge() {
        if (!this.props.birthday)
            return null;
        const today = new Date();
        const birthday = new Date(this.props.birthday);
        let age = today.getFullYear() - birthday.getFullYear();
        const monthDiff = today.getMonth() - birthday.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }
        return age;
    }
    static validateName(firstName, lastName) {
        const errors = [];
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
    static validateEmail(email) {
        const emailSchema = z.string().email();
        return emailSchema.safeParse(email).success;
    }
    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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
    static validateSocialMediaUrl(url, platform) {
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
        }
        catch {
            return false;
        }
    }
    toPersistence() {
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
    toDTO() {
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
    equals(other) {
        return this.props.id.value === other.props.id.value;
    }
    hashCode() {
        return this.props.id.value;
    }
}
//# sourceMappingURL=contact.entity.js.map
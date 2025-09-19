import { z } from 'zod';
export class Email {
    value;
    constructor(email) {
        this.value = email.toLowerCase().trim();
    }
    static create(email) {
        if (!Email.isValid(email)) {
            throw new Error(`Invalid email format: ${email}`);
        }
        return new Email(email);
    }
    static fromString(email) {
        return Email.create(email);
    }
    static isValid(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        const emailSchema = z.string().email();
        return emailSchema.safeParse(email).success;
    }
    getValue() {
        return this.value;
    }
    getDomain() {
        return this.value.split('@')[1];
    }
    getLocalPart() {
        return this.value.split('@')[0];
    }
    isGmail() {
        return this.getDomain() === 'gmail.com';
    }
    isOutlook() {
        return ['outlook.com', 'hotmail.com', 'live.com'].includes(this.getDomain());
    }
    isCorporate() {
        const corporateDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com'];
        return !corporateDomains.includes(this.getDomain());
    }
    getDisplayName() {
        return this.value;
    }
    getMasked() {
        const [localPart, domain] = this.value.split('@');
        if (localPart.length <= 2) {
            return `${localPart[0]}*@${domain}`;
        }
        return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
    }
    toString() {
        return this.value;
    }
    toJSON() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    hashCode() {
        return this.value;
    }
}
//# sourceMappingURL=email.vo.js.map
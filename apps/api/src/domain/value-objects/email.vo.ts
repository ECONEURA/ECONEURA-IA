import { z } from 'zod';

// ============================================================================
// EMAIL VALUE OBJECT
// ============================================================================

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email.toLowerCase().trim();
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    return new Email(email);
  }

  static fromString(email: string): Email {
    return Email.create(email);
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  static isValid(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  isGmail(): boolean {
    return this.getDomain() === 'gmail.com';
  }

  isOutlook(): boolean {
    return ['outlook.com', 'hotmail.com', 'live.com'].includes(this.getDomain());
  }

  isCorporate(): boolean {
    const corporateDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com'];
    return !corporateDomains.includes(this.getDomain());
  }

  getDisplayName(): string {
    return this.value;
  }

  getMasked(): string {
    const [localPart, domain] = this.value.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`;
    }
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  // ========================================================================
  // EQUALITY
  // ========================================================================

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  hashCode(): string {
    return this.value;
  }
}

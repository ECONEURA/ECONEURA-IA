export declare class Email {
    private readonly value;
    private constructor();
    static create(email: string): Email;
    static fromString(email: string): Email;
    static isValid(email: string): boolean;
    getValue(): string;
    getDomain(): string;
    getLocalPart(): string;
    isGmail(): boolean;
    isOutlook(): boolean;
    isCorporate(): boolean;
    getDisplayName(): string;
    getMasked(): string;
    toString(): string;
    toJSON(): string;
    equals(other: Email): boolean;
    hashCode(): string;
}
//# sourceMappingURL=email.vo.d.ts.map
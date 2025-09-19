export interface Currency {
    code: string;
    symbol: string;
    decimals: number;
}
export declare class Money {
    private readonly amount;
    private readonly currency;
    private constructor();
    static create(amount: number, currencyCode: string): Money;
    static zero(currencyCode: string): Money;
    static fromCents(cents: number, currencyCode: string): Money;
    private static readonly CURRENCIES;
    private static getCurrency;
    getAmount(): number;
    getCurrency(): Currency;
    getCurrencyCode(): string;
    getSymbol(): string;
    getDecimals(): number;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(factor: number): Money;
    divide(divisor: number): Money;
    percentage(percent: number): Money;
    equals(other: Money): boolean;
    isGreaterThan(other: Money): boolean;
    isGreaterThanOrEqual(other: Money): boolean;
    isLessThan(other: Money): boolean;
    isLessThanOrEqual(other: Money): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    abs(): Money;
    negate(): Money;
    round(): Money;
    floor(): Money;
    ceil(): Money;
    format(locale?: string): string;
    formatWithSymbol(): string;
    formatWithoutSymbol(): string;
    toCents(): number;
    convertTo(newCurrencyCode: string, exchangeRate: number): Money;
    private ensureSameCurrency;
    static isValidAmount(amount: number): boolean;
    static isValidCurrency(currencyCode: string): boolean;
    toJSON(): {
        amount: number;
        currency: string;
    };
    toString(): string;
    hashCode(): string;
}
//# sourceMappingURL=money.vo.d.ts.map
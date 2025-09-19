export class Money {
    amount;
    currency;
    constructor(amount, currency) {
        this.amount = Math.round(amount * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals);
        this.currency = currency;
    }
    static create(amount, currencyCode) {
        const currency = Money.getCurrency(currencyCode);
        return new Money(amount, currency);
    }
    static zero(currencyCode) {
        return Money.create(0, currencyCode);
    }
    static fromCents(cents, currencyCode) {
        const currency = Money.getCurrency(currencyCode);
        return new Money(cents / Math.pow(10, currency.decimals), currency);
    }
    static CURRENCIES = {
        'EUR': { code: 'EUR', symbol: '€', decimals: 2 },
        'USD': { code: 'USD', symbol: '$', decimals: 2 },
        'GBP': { code: 'GBP', symbol: '£', decimals: 2 },
        'JPY': { code: 'JPY', symbol: '¥', decimals: 0 },
        'CHF': { code: 'CHF', symbol: 'CHF', decimals: 2 },
        'CAD': { code: 'CAD', symbol: 'C$', decimals: 2 },
        'AUD': { code: 'AUD', symbol: 'A$', decimals: 2 },
        'SEK': { code: 'SEK', symbol: 'kr', decimals: 2 },
        'NOK': { code: 'NOK', symbol: 'kr', decimals: 2 },
        'DKK': { code: 'DKK', symbol: 'kr', decimals: 2 },
        'PLN': { code: 'PLN', symbol: 'zł', decimals: 2 },
        'CZK': { code: 'CZK', symbol: 'Kč', decimals: 2 },
        'HUF': { code: 'HUF', symbol: 'Ft', decimals: 2 },
        'RON': { code: 'RON', symbol: 'lei', decimals: 2 },
        'BGN': { code: 'BGN', symbol: 'лв', decimals: 2 },
        'HRK': { code: 'HRK', symbol: 'kn', decimals: 2 },
        'RUB': { code: 'RUB', symbol: '₽', decimals: 2 },
        'CNY': { code: 'CNY', symbol: '¥', decimals: 2 },
        'INR': { code: 'INR', symbol: '₹', decimals: 2 },
        'BRL': { code: 'BRL', symbol: 'R$', decimals: 2 },
        'MXN': { code: 'MXN', symbol: '$', decimals: 2 },
        'ZAR': { code: 'ZAR', symbol: 'R', decimals: 2 },
        'KRW': { code: 'KRW', symbol: '₩', decimals: 0 },
        'SGD': { code: 'SGD', symbol: 'S$', decimals: 2 },
        'HKD': { code: 'HKD', symbol: 'HK$', decimals: 2 },
        'NZD': { code: 'NZD', symbol: 'NZ$', decimals: 2 },
        'TRY': { code: 'TRY', symbol: '₺', decimals: 2 },
        'ILS': { code: 'ILS', symbol: '₪', decimals: 2 },
        'AED': { code: 'AED', symbol: 'د.إ', decimals: 2 },
        'SAR': { code: 'SAR', symbol: '﷼', decimals: 2 }
    };
    static getCurrency(currencyCode) {
        const currency = Money.CURRENCIES[currencyCode.toUpperCase()];
        if (!currency) {
            throw new Error(`Unsupported currency: ${currencyCode}`);
        }
        return currency;
    }
    getAmount() {
        return this.amount;
    }
    getCurrency() {
        return this.currency;
    }
    getCurrencyCode() {
        return this.currency.code;
    }
    getSymbol() {
        return this.currency.symbol;
    }
    getDecimals() {
        return this.currency.decimals;
    }
    add(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amount + other.amount, this.currency);
    }
    subtract(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amount - other.amount, this.currency);
    }
    multiply(factor) {
        return new Money(this.amount * factor, this.currency);
    }
    divide(divisor) {
        if (divisor === 0) {
            throw new Error('Cannot divide by zero');
        }
        return new Money(this.amount / divisor, this.currency);
    }
    percentage(percent) {
        return this.multiply(percent / 100);
    }
    equals(other) {
        return this.amount === other.amount && this.currency.code === other.currency.code;
    }
    isGreaterThan(other) {
        this.ensureSameCurrency(other);
        return this.amount > other.amount;
    }
    isGreaterThanOrEqual(other) {
        this.ensureSameCurrency(other);
        return this.amount >= other.amount;
    }
    isLessThan(other) {
        this.ensureSameCurrency(other);
        return this.amount < other.amount;
    }
    isLessThanOrEqual(other) {
        this.ensureSameCurrency(other);
        return this.amount <= other.amount;
    }
    isZero() {
        return this.amount === 0;
    }
    isPositive() {
        return this.amount > 0;
    }
    isNegative() {
        return this.amount < 0;
    }
    abs() {
        return new Money(Math.abs(this.amount), this.currency);
    }
    negate() {
        return new Money(-this.amount, this.currency);
    }
    round() {
        return new Money(Math.round(this.amount), this.currency);
    }
    floor() {
        return new Money(Math.floor(this.amount), this.currency);
    }
    ceil() {
        return new Money(Math.ceil(this.amount), this.currency);
    }
    format(locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.currency.code,
            minimumFractionDigits: this.currency.decimals,
            maximumFractionDigits: this.currency.decimals
        }).format(this.amount);
    }
    formatWithSymbol() {
        return `${this.currency.symbol}${this.amount.toFixed(this.currency.decimals)}`;
    }
    formatWithoutSymbol() {
        return this.amount.toFixed(this.currency.decimals);
    }
    toCents() {
        return Math.round(this.amount * Math.pow(10, this.currency.decimals));
    }
    convertTo(newCurrencyCode, exchangeRate) {
        const newCurrency = Money.getCurrency(newCurrencyCode);
        const convertedAmount = this.amount * exchangeRate;
        return new Money(convertedAmount, newCurrency);
    }
    ensureSameCurrency(other) {
        if (this.currency.code !== other.currency.code) {
            throw new Error(`Cannot perform operation on different currencies: ${this.currency.code} and ${other.currency.code}`);
        }
    }
    static isValidAmount(amount) {
        return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
    }
    static isValidCurrency(currencyCode) {
        return currencyCode in Money.CURRENCIES;
    }
    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency.code
        };
    }
    toString() {
        return this.format();
    }
    hashCode() {
        return `${this.currency.code}:${this.amount}`;
    }
}
//# sourceMappingURL=money.vo.js.map
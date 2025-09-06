import { z } from 'zod';

// ============================================================================
// MONEY VALUE OBJECT
// ============================================================================

export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}

export class Money {
  private readonly amount: number;
  private readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    this.amount = Math.round(amount * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals);
    this.currency = currency;
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(amount: number, currencyCode: string): Money {
    const currency = Money.getCurrency(currencyCode);
    return new Money(amount, currency);
  }

  static zero(currencyCode: string): Money {
    return Money.create(0, currencyCode);
  }

  static fromCents(cents: number, currencyCode: string): Money {
    const currency = Money.getCurrency(currencyCode);
    return new Money(cents / Math.pow(10, currency.decimals), currency);
  }

  // ========================================================================
  // CURRENCY SUPPORT
  // ========================================================================

  private static readonly CURRENCIES: Record<string, Currency> = {
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

  private static getCurrency(currencyCode: string): Currency {
    const currency = Money.CURRENCIES[currencyCode.toUpperCase()];
    if (!currency) {
      throw new Error(`Unsupported currency: ${currencyCode}`);
    }
    return currency;
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getCurrencyCode(): string {
    return this.currency.code;
  }

  getSymbol(): string {
    return this.currency.symbol;
  }

  getDecimals(): number {
    return this.currency.decimals;
  }

  // ========================================================================
  // ARITHMETIC OPERATIONS
  // ========================================================================

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  percentage(percent: number): Money {
    return this.multiply(percent / 100);
  }

  // ========================================================================
  // COMPARISON OPERATIONS
  // ========================================================================

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency.code === other.currency.code;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount >= other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount <= other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  abs(): Money {
    return new Money(Math.abs(this.amount), this.currency);
  }

  negate(): Money {
    return new Money(-this.amount, this.currency);
  }

  round(): Money {
    return new Money(Math.round(this.amount), this.currency);
  }

  floor(): Money {
    return new Money(Math.floor(this.amount), this.currency);
  }

  ceil(): Money {
    return new Money(Math.ceil(this.amount), this.currency);
  }

  // ========================================================================
  // FORMATTING
  // ========================================================================

  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency.code,
      minimumFractionDigits: this.currency.decimals,
      maximumFractionDigits: this.currency.decimals
    }).format(this.amount);
  }

  formatWithSymbol(): string {
    return `${this.currency.symbol}${this.amount.toFixed(this.currency.decimals)}`;
  }

  formatWithoutSymbol(): string {
    return this.amount.toFixed(this.currency.decimals);
  }

  // ========================================================================
  // CONVERSION
  // ========================================================================

  toCents(): number {
    return Math.round(this.amount * Math.pow(10, this.currency.decimals));
  }

  convertTo(newCurrencyCode: string, exchangeRate: number): Money {
    const newCurrency = Money.getCurrency(newCurrencyCode);
    const convertedAmount = this.amount * exchangeRate;
    return new Money(convertedAmount, newCurrency);
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  private ensureSameCurrency(other: Money): void {
    if (this.currency.code !== other.currency.code) {
      throw new Error(`Cannot perform operation on different currencies: ${this.currency.code} and ${other.currency.code}`);
    }
  }

  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
  }

  static isValidCurrency(currencyCode: string): boolean {
    return currencyCode in Money.CURRENCIES;
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency.code
    };
  }

  toString(): string {
    return this.format();
  }

  // ========================================================================
  // EQUALITY
  // ========================================================================

  hashCode(): string {
    return `${this.currency.code}:${this.amount}`;
  }
}

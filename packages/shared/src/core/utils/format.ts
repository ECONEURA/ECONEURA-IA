/**
 * Convert bytes to human readable string
 */
export function bytesToHuman(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Parse human readable bytes string to number
 */
export function parseBytes(str: string): number {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
    pb: 1024 ** 5
  };

  const match = str.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmgtp]?b)$/);
  if (!match) {
    throw new Error('Invalid bytes string');
  }

  const [, value, unit] = match;
  return parseFloat(value) * units[unit as keyof typeof units];
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  if (seconds > 0) {
    return `${seconds}s`;
  }
  return `${ms}ms`;
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(str: string): number {
  const units = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const regex = /(\d+(?:\.\d+)?)\s*([a-z]+)/gi;
  let total = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const [, value, unit] = match;
    const multiplier = units[unit.toLowerCase() as keyof typeof units];
    
    if (!multiplier) {
      throw new Error(`Invalid duration unit: ${unit}`);
    }

    total += parseFloat(value) * multiplier;
  }

  return total;
}

/**
 * Format a date to ISO string with timezone
 */
export function formatDate(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  
  return date.toISOString().replace(
    /Z$/,
    `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
  );
}

/**
 * Parse a date string with timezone
 */
export function parseDate(str: string): Date {
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

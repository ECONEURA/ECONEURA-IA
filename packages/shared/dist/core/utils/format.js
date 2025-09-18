export function bytesToHuman(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}
export function parseBytes(str) {
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
    return parseFloat(value) * units[unit];
}
export function formatDuration(ms) {
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
export function parseDuration(str) {
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
    let found = false;
    while ((match = regex.exec(str)) !== null) {
        found = true;
        const [, value, unit] = match;
        const multiplier = units[unit.toLowerCase()];
        if (!multiplier) {
            throw new Error(`Invalid duration unit: ${unit}`);
        }
        total += parseFloat(value) * multiplier;
    }
    if (!found)
        throw new Error('Invalid duration string');
    return total;
}
export function formatDate(date) {
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';
    const isoNoMs = date.toISOString().split('.')[0] + 'Z';
    return isoNoMs.replace(/Z$/, `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`);
}
export function parseDate(str) {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
    }
    return date;
}
export function formatNumber(num) {
    const parts = Math.trunc(Math.abs(num)).toString().split('');
    let result = '';
    let count = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
        result = parts[i] + result;
        count++;
        if (count % 3 === 0 && i !== 0)
            result = '.' + result;
    }
    return (num < 0 ? '-' : '') + result;
}
export function formatCurrency(amount, currency = 'EUR', locale = 'es-ES') {
    if (locale === 'es-ES' && currency === 'EUR') {
        const abs = Math.abs(amount);
        const euros = Math.trunc(abs);
        const cents = Math.round((abs - euros) * 100).toString().padStart(2, '0');
        const formatted = formatNumber(euros);
        const sign = amount < 0 ? '-' : '';
        return `${sign}${formatted},${cents} €`;
    }
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(amount);
}
//# sourceMappingURL=format.js.map
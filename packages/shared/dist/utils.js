import { randomUUID } from 'crypto';
export function generateId(prefix) {
    return prefix ? `${prefix}_${randomUUID()}` : randomUUID();
}
export function isNonNullable(value) {
    return value !== null && value !== undefined;
}
export function isString(value) {
    return typeof value === 'string';
}
export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}
export function pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}
export function chunk(array, size) {
    return array.reduce((chunks, item, index) => {
        const chunkIndex = Math.floor(index / size);
        if (!chunks[chunkIndex]) {
            chunks[chunkIndex] = [];
        }
        chunks[chunkIndex].push(item);
        return chunks;
    }, []);
}
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export function formatDate(date, locale = 'es-ES') {
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'medium'
    }).format(date);
}
export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
export function validatePhone(phone) {
    const regex = /^\+?[\d\s-]{8,}$/;
    return regex.test(phone);
}
export async function retry(fn, options) {
    const { attempts, delay, backoff = 2, onError } = options;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === attempts) {
                throw error;
            }
            if (onError && error instanceof Error) {
                onError(error, attempt);
            }
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
        }
    }
    throw new Error('Retry failed');
}
export function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
export async function asyncFilter(array, predicate) {
    const results = await Promise.all(array.map(async (item) => ({
        item,
        pass: await predicate(item)
    })));
    return results
        .filter(({ pass }) => pass)
        .map(({ item }) => item);
}
//# sourceMappingURL=utils.js.map
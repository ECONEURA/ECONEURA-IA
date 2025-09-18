export function assertDefined(value, message = 'Value is undefined') {
    if (value === undefined || value === null) {
        throw new Error(message);
    }
}
export function assertTrue(value, message = 'Assertion failed') {
    if (!value) {
        throw new Error(message);
    }
}
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, backoffFactor = 2, shouldRetry = () => true } = options;
    let attempt = 1;
    let currentDelay = initialDelay;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt >= maxAttempts || !shouldRetry(error)) {
                throw error;
            }
            await delay(currentDelay);
            currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
            attempt++;
        }
    }
}
export function withTimeout(promise, timeoutMs, message = 'Operation timed out') {
    const timeoutPromise = delay(timeoutMs).then(() => {
        throw new Error(message);
    });
    return Promise.race([promise, timeoutPromise]);
}
export function memoize(fn, options = {}) {
    const { maxSize = 100, ttl } = options;
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        const now = Date.now();
        if (cache.has(key)) {
            const entry = cache.get(key);
            if (!ttl || now - entry.timestamp < ttl) {
                return entry.value;
            }
            cache.delete(key);
        }
        const value = fn(...args);
        cache.set(key, { value, timestamp: now });
        if (cache.size > maxSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
                cache.delete(firstKey);
            }
        }
        return value;
    });
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
export function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        const later = () => {
            clearTimeout(timeout);
            fn(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
export function throttle(fn, wait) {
    let isThrottled = false;
    let lastArgs;
    return (...args) => {
        if (isThrottled) {
            lastArgs = args;
            return;
        }
        fn(...args);
        isThrottled = true;
        setTimeout(() => {
            isThrottled = false;
            if (lastArgs) {
                fn(...lastArgs);
                lastArgs = undefined;
            }
        }, wait);
    };
}
//# sourceMappingURL=common.js.map
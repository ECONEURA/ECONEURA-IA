let state = 'CLOSED';
let nextTry = 0;
let failures = 0;
export function canCall() {
    const now = Date.now();
    return state !== 'OPEN' || now >= nextTry;
}
export function onSuccess() {
    state = 'CLOSED';
    failures = 0;
    nextTry = 0;
}
export function onFailure() {
    failures += 1;
    const backoff = state === 'OPEN' ? Math.min(5 * 60 * 1000, 30000 * failures) : 10000;
    state = 'OPEN';
    nextTry = Date.now() + backoff;
}
export function status() {
    return { state, nextTry, failures };
}
//# sourceMappingURL=breaker.js.map
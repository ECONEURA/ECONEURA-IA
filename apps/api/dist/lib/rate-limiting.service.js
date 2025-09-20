import { prometheus } from '@econeura/shared/src/metrics/index.js';
export class RateLimitingService {
    limits = new Map();
    checkLimit(key, config) {
        const now = Date.now();
        const limit = this.limits.get(key);
        if (!limit || now > limit.resetTime) {
            this.limits.set(key, {
                count: 1,
                resetTime: now + config.windowMs
            });
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs
            };
        }
        if (limit.count >= config.maxRequests) {
            prometheus.register.getSingleMetric('rate_limit_exceeded_total')?.inc({
                key: key.substring(0, 50)
            });
            return {
                allowed: false,
                remaining: 0,
                resetTime: limit.resetTime
            };
        }
        limit.count++;
        this.limits.set(key, limit);
        return {
            allowed: true,
            remaining: config.maxRequests - limit.count,
            resetTime: limit.resetTime
        };
    }
    cleanup() {
        const now = Date.now();
        for (const [key, limit] of this.limits) {
            if (now > limit.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}
export const rateLimitingService = new RateLimitingService();
//# sourceMappingURL=rate-limiting.service.js.map
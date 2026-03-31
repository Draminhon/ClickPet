export class RateLimiter {
    private cache: Map<string, { count: number; expiresAt: number }>;
    private maxRequests: number;
    private windowMs: number;

    constructor(options: { maxRequests: number; windowMs: number }) {
        this.cache = new Map();
        this.maxRequests = options.maxRequests;
        this.windowMs = options.windowMs;
    }

    public check(identifier: string): { success: boolean; remaining: number } {
        const now = Date.now();
        const record = this.cache.get(identifier);

        // Filter out expired items occasionally to prevent memory leaks
        if (this.cache.size > 1000) {
            this.cleanUp(now);
        }

        if (!record || record.expiresAt < now) {
            // New request or expired window
            this.cache.set(identifier, {
                count: 1,
                expiresAt: now + this.windowMs,
            });
            return { success: true, remaining: this.maxRequests - 1 };
        }

        // Within window
        record.count += 1;
        if (record.count > this.maxRequests) {
            return { success: false, remaining: 0 };
        }

        return { success: true, remaining: this.maxRequests - record.count };
    }

    private cleanUp(now: number) {
        for (const [key, value] of this.cache.entries()) {
            if (value.expiresAt < now) {
                this.cache.delete(key);
            }
        }
    }
}

// Global instance for authentication actions (login attempts, register)
// Limits: 10 requests per 5 minutes per IP
export const authRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, 
});

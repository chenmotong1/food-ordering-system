interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiter {
  maxRequests: number;
  windowMs: number;
  entries: Map<string, RateLimitEntry>;
}

function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  return { maxRequests, windowMs, entries: new Map() };
}

export function checkRateLimit(
  limiter: RateLimiter,
  key: string
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = limiter.entries.get(key);

  if (!entry || now >= entry.resetTime) {
    limiter.entries.set(key, {
      count: 1,
      resetTime: now + limiter.windowMs,
    });
    return { allowed: true, remaining: limiter.maxRequests - 1 };
  }

  if (entry.count >= limiter.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limiter.maxRequests - entry.count };
}

// Predefined rate limiters
export const loginLimiter = createRateLimiter(20, 60 * 60 * 1000); // 20 req/hour per IP
export const registerLimiter = createRateLimiter(5, 60 * 60 * 1000); // 5 req/hour per IP
export const orderLimiter = createRateLimiter(3, 60 * 1000); // 3 req/min per user
export const couponLimiter = createRateLimiter(10, 60 * 1000); // 10 req/min per user

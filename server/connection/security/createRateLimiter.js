import {ipKeyGenerator, rateLimit} from 'express-rate-limit';

export function createRateLimiter({limit, windowMs, now = Date.now, maxKeys = 5000}) {
  const buckets = new Map();
  let checksSincePrune = 0;

  function consume(key = 'anonymous') {
    const timestamp = now();
    const normalizedKey = String(key || 'anonymous');
    let bucket = buckets.get(normalizedKey);

    if (!bucket || bucket.resetAt <= timestamp) {
      bucket = {count: 0, resetAt: timestamp + windowMs};
      buckets.set(normalizedKey, bucket);
    }

    bucket.count += 1;
    checksSincePrune += 1;
    if (checksSincePrune >= 128 || buckets.size > maxKeys) {
      checksSincePrune = 0;
      for (const [entryKey, entry] of buckets) {
        if (entry.resetAt <= timestamp || buckets.size > maxKeys) {
          buckets.delete(entryKey);
        }
      }
    }

    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterMs: Math.max(0, bucket.resetAt - timestamp),
    };
  }

  return {consume};
}

export function createRateLimitMiddleware({limit, windowMs, keyGenerator, methods}) {
  const limitedMethods = new Set((methods || ['POST', 'PUT', 'PATCH', 'DELETE']).map((method) => method.toUpperCase()));
  const limiter = rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const generatedKey = keyGenerator?.(req);
      if (generatedKey) {
        return `session:${generatedKey}`;
      }
      return ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');
    },
    handler: (req, res) => {
      const resetAt = req.rateLimit?.resetTime?.getTime?.();
      if (resetAt) {
        res.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
      }
      res.status(429).json({ok: false, message: 'Trop de requêtes. Réessayez plus tard.'});
    },
  });
  return function rateLimitMiddleware(req, res, next) {
    if (!limitedMethods.has(String(req.method || '').toUpperCase())) {
      next();
      return;
    }
    limiter(req, res, next);
  };
}

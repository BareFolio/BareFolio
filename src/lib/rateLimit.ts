/**
 * Best-effort in-memory rate limiter.
 *
 * Note: serverless instances are ephemeral and not shared, so this caps abuse
 * per warm instance rather than globally. It meaningfully slows scripted floods
 * but is not a substitute for an edge/KV-backed limiter (e.g. Upstash) if we
 * later need hard global guarantees.
 */

type Hit = { count: number; resetAt: number };

const store = new Map<string, Hit>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets
}

/**
 * @param key       Unique bucket (e.g. `contact:<ip>`)
 * @param limit     Max requests allowed within the window
 * @param windowMs  Window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hit = store.get(key);

  if (!hit || now > hit.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (hit.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }

  hit.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Extract the best-guess client IP from a request's headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

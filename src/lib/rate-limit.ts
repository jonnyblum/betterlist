import { NextResponse } from "next/server";

export interface RateLimitConfig {
  // Max requests allowed in the window
  limit: number;
  // Window size in seconds
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until window resets
}

/**
 * Fixed-window rate limiter backed by Upstash Redis REST API.
 * Fails open (allows the request) if Redis is unavailable — never block
 * legitimate traffic due to a Redis outage.
 *
 * identifier should be scoped to the action + subject, e.g.:
 *   "otp:send:<ip>" — per-IP OTP send limit
 *   "rec:post:<userId>" — per-user recommendation limit
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = config;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Graceful degradation: if Upstash not configured, allow all requests
  if (!url || !token || url === "rediss://..." || token === "...") {
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }

  const key = `rl:${identifier}`;

  try {
    // Atomic pipeline: INCR the counter, then set expiry only if the key is new (NX flag).
    // NX ensures we don't reset the window on every request.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
      ]),
    });

    if (!res.ok) {
      console.error("Rate limit Redis error:", res.status);
      return { allowed: true, remaining: limit, resetIn: windowSeconds };
    }

    const results = (await res.json()) as Array<{ result: number }>;
    const count = results[0]?.result ?? 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetIn: windowSeconds,
    };
  } catch (err) {
    // Fail open on any network/parse error
    console.error("Rate limit check failed, allowing request:", err);
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/**
 * Returns a standard 429 response with Retry-After header.
 */
export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetIn),
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + resetIn),
      },
    }
  );
}

/**
 * Extracts the real client IP from Next.js request headers.
 * Falls back to a fixed string so rate limiting still works without a real IP.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

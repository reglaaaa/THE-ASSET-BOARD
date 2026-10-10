import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Constant-time password comparison (no timing side channel).
export function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  if (typeof expected !== "string" || expected.length === 0) return false;
  if (typeof password !== "string") return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// On Vercel, x-real-ip / x-forwarded-for are set by the platform and can't
// be forged by the visitor.
export function getClientIp(req: NextRequest) {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

// Generic Postgres-backed rate limit. FAILS CLOSED: if the check itself
// errors, the request is denied rather than allowed.
export async function rateLimit(key: string, maxHits: number, windowSeconds: number) {
  try {
    const { data, error } = await supabaseAdmin().rpc("check_rate_limit", {
      p_key: key,
      p_max_hits: maxHits,
      p_window_seconds: windowSeconds
    });
    if (error) {
      console.error("Rate limit check failed:", error.message);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error("Rate limit check threw:", err);
    return false;
  }
}

// Brute-force protection for admin password attempts: 5 per minute per IP.
export function withinRateLimit(ip: string) {
  return rateLimit(`admin-auth:${ip}`, 5, 60);
}

// Admin password is read from a header, never from the URL (URLs end up in logs).
export function passwordFromHeader(req: NextRequest) {
  return req.headers.get("x-admin-password");
}

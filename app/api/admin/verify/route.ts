import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  return typeof expected === "string" && expected.length > 0 && password === expected;
}

function getClientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Shares the same admin-auth rate limit bucket as the other admin routes
// (articles, budget), so brute-forcing this endpoint also locks out
// attempts against those. Fails open on infra errors so a hiccup here
// can't lock admins out entirely.
async function withinRateLimit(ip: string) {
  try {
    const { data, error } = await supabaseAdmin().rpc("check_rate_limit", {
      p_key: `admin-auth:${ip}`,
      p_max_hits: 5,
      p_window_seconds: 60
    });
    if (error) {
      console.error("Rate limit check failed:", error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("Rate limit check threw:", err);
    return true;
  }
}

// Verifies the council admin password without writing anything. Used by
// the feed's "Become admin" flow to unlock SSC (official) replies before
// any reply is actually posted.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many attempts — please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

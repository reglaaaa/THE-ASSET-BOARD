import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkPassword, getClientIp, withinRateLimit } from "@/lib/adminAuth";

// Verifies the admin password without writing anything.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
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

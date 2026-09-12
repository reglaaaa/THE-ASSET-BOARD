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

// Same shared admin-auth bucket as the other admin routes.
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

// Posts an official council (SSC) reply on a post's comment thread. Goes
// through the service-role client (bypassing RLS, same as /api/articles),
// so it isn't subject to the anonymous per-device comment rate limit, and
// is flagged is_official so the feed can badge it with the council logo.
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
  const { password, post_id, content } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (typeof post_id !== "string" || post_id.length === 0) {
    return NextResponse.json({ error: "Missing post id." }, { status: 400 });
  }
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (trimmed.length === 0 || trimmed.length > 300) {
    return NextResponse.json({ error: "Reply must be 1-300 characters." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("comments")
    .insert({ post_id, content: trimmed, is_official: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ comment: data }, { status: 201 });
}

// Council admin removal of any comment (anonymous or official).
export async function DELETE(req: NextRequest) {
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
  const { password, id } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Missing comment id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

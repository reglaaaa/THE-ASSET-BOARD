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

async function withinRateLimit(ip: string) {
  try {
    const { data, error } = await supabaseAdmin().rpc("check_rate_limit", {
      p_key: `admin-auth:${ip}`,
      p_max_hits: 5,
      p_window_seconds: 60
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}

const STATUS_VALUES = ["investigating", "executing", "resolved", "denied"];

// Admin fetch of ALL posts, including SSC-only ones the public anon-key
// client can no longer see (see migration_post_visibility.sql).
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data });
}

// Admin edit of a post: content, category, urgent flag, visibility, and/or status flag.
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { password, id, content, category, is_urgent, status, visibility } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Missing post id." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (content !== undefined) {
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (trimmed.length === 0 || trimmed.length > 500) {
      return NextResponse.json({ error: "Post must be 1-500 characters." }, { status: 400 });
    }
    update.content = trimmed;
  }
  if (category !== undefined) {
    if (category !== "concern" && category !== "suggestion") {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    update.category = category;
  }
  if (is_urgent !== undefined) {
    update.is_urgent = Boolean(is_urgent);
  }
  if (status !== undefined) {
    if (status !== null && !STATUS_VALUES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = status;
  }
  if (visibility !== undefined) {
    if (visibility !== "public" && visibility !== "ssc_only") {
      return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
    }
    update.visibility = visibility;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("posts")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ post: data });
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
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
    return NextResponse.json({ error: "Missing post id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("posts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

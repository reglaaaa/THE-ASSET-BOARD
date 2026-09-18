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

// Admin fetch of ALL comments for a post, including SSC-only ones that
// the public anon-key client can no longer see (see migration_comment_visibility.sql).
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");
  const postId = searchParams.get("post_id");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (!postId) {
    return NextResponse.json({ error: "Missing post id." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ comments: data });
}

// Posts an official council (SSC) reply, flagged is_official. Admin can
// mark it "ssc_only" so it never reaches the public feed — a private note
// attached to the post for the council's own use.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json({ error: "Too many attempts, please wait a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { password, post_id, content, visibility } = body;

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
  const resolvedVisibility = visibility === "ssc_only" ? "ssc_only" : "public";

  const { data, error } = await supabaseAdmin()
    .from("comments")
    .insert({ post_id, content: trimmed, is_official: true, visibility: resolvedVisibility })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ comment: data }, { status: 201 });
}

// Admin removal of any comment.
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
    return NextResponse.json({ error: "Missing comment id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isValidImageUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  return typeof expected === "string" && expected.length > 0 && password === expected;
}

function getClientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Basic brute-force protection: at most 5 admin-password attempts per
// minute per IP, enforced in Postgres (shared with the rest of the app's
// rate limiting) so it can't be bypassed by hitting this route directly.
// Fails open (allows the request) if the check itself errors, so an
// infra hiccup on the rate limiter can't lock admins out entirely.
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
  const { password, title, body: articleBody, image_url } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
    return NextResponse.json({ error: "Title must be 1–200 characters." }, { status: 400 });
  }
  if (typeof articleBody !== "string" || articleBody.trim().length === 0 || articleBody.length > 8000) {
    return NextResponse.json({ error: "Body must be 1–8000 characters." }, { status: 400 });
  }
  if (image_url !== undefined && image_url !== null && image_url !== "") {
    if (typeof image_url !== "string" || !isValidImageUrl(image_url)) {
      return NextResponse.json(
        { error: "Thumbnail must be a valid http(s) image URL." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin()
    .from("articles")
    .insert({
      title: title.trim(),
      body: articleBody.trim(),
      image_url: image_url ? image_url.trim() : null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ article: data }, { status: 201 });
}

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
    return NextResponse.json({ error: "Missing article id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("articles").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

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

export async function POST(req: NextRequest) {
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

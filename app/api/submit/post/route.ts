import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { guard, isId } from "@/lib/serverRpc";

export async function POST(req: NextRequest) {
  const limited = await guard(req, "submit-post", [[3, 60], [10, 3600], [30, 86400]]);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { content, category, is_urgent, anon_id, visibility } = body;

  const text = typeof content === "string" ? content.trim() : "";
  if (text.length === 0 || text.length > 500) {
    return NextResponse.json({ error: "Post must be 1-500 characters." }, { status: 400 });
  }
  if (category !== "concern" && category !== "suggestion") {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (visibility !== "public" && visibility !== "ssc_only") {
    return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
  }
  if (!isId(anon_id)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { error } = await supabaseAdmin().rpc("create_post", {
    p_content: text,
    p_category: category,
    p_is_urgent: Boolean(is_urgent),
    p_anon_id: anon_id,
    p_visibility: visibility
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

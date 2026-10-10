import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { guard, isId } from "@/lib/serverRpc";

export async function POST(req: NextRequest) {
  const limited = await guard(req, "submit-like", [[30, 60], [300, 86400]]);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { post_id, anon_id, like } = body;
  if (!isId(post_id) || !isId(anon_id) || typeof like !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().rpc("toggle_like", {
    p_post_id: post_id,
    p_anon_id: anon_id,
    p_like: like
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

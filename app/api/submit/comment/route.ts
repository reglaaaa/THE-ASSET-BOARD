import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { guard, isId } from "@/lib/serverRpc";

export async function POST(req: NextRequest) {
  const limited = await guard(req, "submit-comment", [[5, 60], [30, 3600], [100, 86400]]);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { post_id, content, anon_id } = body;

  const text = typeof content === "string" ? content.trim() : "";
  if (text.length === 0 || text.length > 300) {
    return NextResponse.json({ error: "Comment must be 1-300 characters." }, { status: 400 });
  }
  if (!isId(post_id) || !isId(anon_id)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Don't allow commenting on SSC-only posts through the public endpoint.
  const { data: post } = await supabaseAdmin()
    .from("posts")
    .select("visibility")
    .eq("id", post_id)
    .maybeSingle();
  if (!post || post.visibility !== "public") {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin().rpc("create_comment", {
    p_post_id: post_id,
    p_content: text,
    p_anon_id: anon_id
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comment: data }, { status: 201 });
}

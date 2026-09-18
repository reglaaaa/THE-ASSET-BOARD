import { NextRequest, NextResponse } from "next/server";

// Called by a Supabase Database Webhook whenever a row is inserted into
// `posts`. Sends an email notification to the council inbox via Resend's
// HTTPS API (Vercel's serverless functions block outbound SMTP, which is
// why this doesn't use Gmail/Nodemailer directly).
//
// Setup (see README "Email notifications" section):
// 1. Vercel env vars: RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_WEBHOOK_SECRET
// 2. Supabase Dashboard -> Database -> Webhooks -> Create a new webhook
//      Table: posts   Events: Insert
//      URL: https://<your-vercel-domain>/api/notify
//      HTTP Headers: x-webhook-secret: <same value as NOTIFY_WEBHOOK_SECRET>

type PostRow = {
  id: string;
  content: string;
  category: string;
  is_urgent: boolean;
  created_at: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NOTIFY_WEBHOOK_SECRET not configured on the server." },
      { status: 500 }
    );
  }
  if (req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const record: PostRow | undefined = body?.record;
  if (!record) {
    return NextResponse.json({ error: "Missing record in payload." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;

  if (!resendApiKey || !to) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY or NOTIFY_EMAIL_TO." },
      { status: 500 }
    );
  }

  const urgentTag = record.is_urgent ? "URGENT — " : "";
  const subject = `${urgentTag}New ${record.category} on The Asset`;
  const text = [
    `A new ${record.category} was just posted.`,
    "",
    record.content,
    "",
    `Posted: ${new Date(record.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`,
    `Post ID: ${record.id}`
  ].join("\n");
  const html = `
    <div style="font-family: sans-serif; font-size: 14px; color: #111;">
      <p><strong>${urgentTag}New ${escapeHtml(record.category)} on The Asset</strong></p>
      <p style="white-space: pre-wrap; border-left: 3px solid #ccc; padding-left: 10px;">${escapeHtml(record.content)}</p>
      <p style="color: #666; font-size: 12px;">
        Posted: ${new Date(record.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}<br/>
        Post ID: ${record.id}
      </p>
    </div>
  `;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Resend's shared test sender — works immediately with no domain
        // setup. Swap this for an address on your own verified domain
        // later if you want (Resend dashboard -> Domains).
        from: "The Asset <onboarding@resend.dev>",
        to: to.split(",").map((addr) => addr.trim()),
        subject,
        text,
        html
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return NextResponse.json(
        { error: `Resend API error (${resendRes.status}): ${errBody}` },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error sending email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

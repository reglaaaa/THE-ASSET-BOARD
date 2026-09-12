import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TableName = "budget_sources" | "expenses" | "projects";
const TABLES: TableName[] = ["budget_sources", "expenses", "projects"];

const PROJECT_STATUSES = ["planning", "executing", "cancelled", "executed"];

function checkPassword(password: unknown) {
  const expected = process.env.ADMIN_PASSWORD;
  return typeof expected === "string" && expected.length > 0 && password === expected;
}

function getClientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Same Postgres-backed rate limit used by /api/articles: at most 5
// admin-password attempts per minute per IP. Fails open on infra errors
// so a hiccup here can't lock admins out.
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

function isValidDate(d: unknown) {
  return typeof d === "string" && !isNaN(new Date(d).getTime());
}

function isValidAmount(n: unknown) {
  return typeof n === "number" && isFinite(n) && n >= 0;
}

// Validates + trims a payload for a given table, returning either
// { ok: true, value } or { ok: false, error }.
function sanitizePayload(table: TableName, payload: any) {
  if (table === "budget_sources") {
    const source = payload?.source;
    const amount = payload?.amount;
    const date_received = payload?.date_received;
    if (typeof source !== "string" || source.trim().length === 0 || source.length > 200) {
      return { ok: false as const, error: "Source must be 1–200 characters." };
    }
    if (!isValidAmount(amount)) {
      return { ok: false as const, error: "Amount must be a non-negative number." };
    }
    if (!isValidDate(date_received)) {
      return { ok: false as const, error: "date_received must be a valid date." };
    }
    return {
      ok: true as const,
      value: { source: source.trim(), amount, date_received }
    };
  }

  if (table === "expenses") {
    const item = payload?.item;
    const amount = payload?.amount;
    const date_spent = payload?.date_spent;
    if (typeof item !== "string" || item.trim().length === 0 || item.length > 200) {
      return { ok: false as const, error: "Item must be 1–200 characters." };
    }
    if (!isValidAmount(amount)) {
      return { ok: false as const, error: "Amount must be a non-negative number." };
    }
    if (!isValidDate(date_spent)) {
      return { ok: false as const, error: "date_spent must be a valid date." };
    }
    return {
      ok: true as const,
      value: { item: item.trim(), amount, date_spent }
    };
  }

  // projects
  const name = payload?.name;
  const description = payload?.description;
  const status = payload?.status;
  const budget_used = payload?.budget_used;
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return { ok: false as const, error: "Name must be 1–200 characters." };
  }
  if (
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.length > 500
  ) {
    return { ok: false as const, error: "Description must be 1–500 characters." };
  }
  if (typeof status !== "string" || !PROJECT_STATUSES.includes(status)) {
    return { ok: false as const, error: "Status must be one of: " + PROJECT_STATUSES.join(", ") };
  }
  if (!isValidAmount(budget_used)) {
    return { ok: false as const, error: "budget_used must be a non-negative number." };
  }
  return {
    ok: true as const,
    value: { name: name.trim(), description: description.trim(), status, budget_used }
  };
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
  const { password, table, payload } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (!TABLES.includes(table)) {
    return NextResponse.json({ error: "Unknown table." }, { status: 400 });
  }

  const sanitized = sanitizePayload(table, payload);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from(table)
    .insert(sanitized.value)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ row: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
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
  const { password, table, id, payload } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (!TABLES.includes(table)) {
    return NextResponse.json({ error: "Unknown table." }, { status: 400 });
  }
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Missing row id." }, { status: 400 });
  }

  const sanitized = sanitizePayload(table, payload);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from(table)
    .update(sanitized.value)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ row: data });
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
  const { password, table, id } = body;

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  if (!TABLES.includes(table)) {
    return NextResponse.json({ error: "Unknown table." }, { status: 400 });
  }
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Missing row id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from(table).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

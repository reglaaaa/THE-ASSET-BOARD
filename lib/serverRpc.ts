import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/adminAuth";

// Shared guard for the public write endpoints: per-IP rate limits that
// can't be dodged by generating a new anon id in the browser.
export async function guard(
  req: NextRequest,
  name: string,
  limits: Array<[max: number, windowSeconds: number]>
) {
  const ip = getClientIp(req);
  for (const [max, win] of limits) {
    if (!(await rateLimit(`${name}:${win}:${ip}`, max, win))) {
      return NextResponse.json(
        { error: "You're doing that too often. Please wait a bit and try again." },
        { status: 429 }
      );
    }
  }
  return null;
}

export function isId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 64;
}

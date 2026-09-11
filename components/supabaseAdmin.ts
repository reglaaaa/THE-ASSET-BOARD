import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which bypasses Row Level
// Security entirely — that's what lets it write to `articles` even though
// there's no public insert policy on that table.
//
// NEVER import this from a "use client" component or anything that ships
// to the browser. It must only be used inside Route Handlers (app/api/**)
// or other server-only code. SUPABASE_SERVICE_ROLE_KEY is deliberately NOT
// prefixed with NEXT_PUBLIC_ so Next.js will never bundle it client-side.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}

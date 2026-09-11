import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Surface a clear error in dev instead of a cryptic supabase-js failure
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local"
  );
}

export const supabase = createClient(url, anonKey);

export type Category = "concern" | "suggestion";

export type Post = {
  id: string;
  content: string;
  category: Category;
  is_urgent: boolean;
  likes_count: number;
  created_at: string;
};

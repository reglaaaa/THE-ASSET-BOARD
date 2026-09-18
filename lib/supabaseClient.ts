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

export type PostStatus = "investigating" | "executing" | "resolved" | "denied";

export type Post = {
  id: string;
  content: string;
  category: Category;
  is_urgent: boolean;
  status: PostStatus | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  is_official: boolean;
  visibility: "public" | "ssc_only";
};

export type Article = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export type BudgetSource = {
  id: string;
  source: string;
  amount: number;
  date_received: string;
  created_at: string;
};

export type Expense = {
  id: string;
  item: string;
  amount: number;
  date_spent: string;
  created_at: string;
};

export type ProjectStatus = "planning" | "executing" | "cancelled" | "executed";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget_used: number;
  created_at: string;
};

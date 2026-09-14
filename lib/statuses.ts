import { Search, Hammer, CheckCircle2, XCircle } from "lucide-react";
import type { PostStatus } from "./supabaseClient";

export const STATUSES: {
  value: PostStatus;
  label: string;
  icon: typeof Search;
  textClass: string;
  bgClass: string;
}[] = [
  {
    value: "investigating",
    label: "Investigating",
    icon: Search,
    textClass: "text-amber-300",
    bgClass: "bg-amber-400/15 border-amber-400/40"
  },
  {
    value: "executing",
    label: "Executing",
    icon: Hammer,
    textClass: "text-sky-300",
    bgClass: "bg-sky-400/15 border-sky-400/40"
  },
  {
    value: "resolved",
    label: "Resolved",
    icon: CheckCircle2,
    textClass: "text-emerald-300",
    bgClass: "bg-emerald-400/15 border-emerald-400/40"
  },
  {
    value: "denied",
    label: "Denied",
    icon: XCircle,
    textClass: "text-rose-300",
    bgClass: "bg-rose-400/15 border-rose-400/40"
  }
];

export function statusMeta(value: PostStatus | null | undefined) {
  if (!value) return null;
  return STATUSES.find((s) => s.value === value) ?? null;
}

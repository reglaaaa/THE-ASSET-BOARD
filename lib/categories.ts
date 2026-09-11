import { BookOpen, Building2, ShieldAlert, Landmark, CircleEllipsis } from "lucide-react";
import type { Category } from "./supabaseClient";

export const CATEGORIES: { value: Category; label: string; icon: typeof BookOpen }[] = [
  { value: "academics", label: "Academics", icon: BookOpen },
  { value: "facilities", label: "Facilities", icon: Building2 },
  { value: "safety", label: "Safety", icon: ShieldAlert },
  { value: "administration", label: "Administration", icon: Landmark },
  { value: "other", label: "Other", icon: CircleEllipsis }
];

export function categoryMeta(value: Category) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[4];
}

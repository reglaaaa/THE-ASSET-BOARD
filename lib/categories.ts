import { MessageSquareWarning, Lightbulb } from "lucide-react";
import type { Category } from "./supabaseClient";

export const CATEGORIES: { value: Category; label: string; icon: typeof MessageSquareWarning }[] = [
  { value: "concern", label: "Concern", icon: MessageSquareWarning },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb }
];

export function categoryMeta(value: Category) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

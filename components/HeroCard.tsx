"use client";

import Link from "next/link";
import type { Article } from "@/lib/supabaseClient";

export type BudgetSummary = { totalBudget: number; totalSpending: number };

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
});

// The hero slot: renders whichever of the two (article or budget snapshot)
// the caller has chosen to feature. Selection/randomization lives in the
// caller (app/page.tsx) — this component just renders whichever prop is
// non-null, with article taking precedence if somehow both are passed.
export function HeroCard({
  article,
  budgetSummary
}: {
  article: Article | null;
  budgetSummary: BudgetSummary | null;
}) {
  if (article) {
    const snippet = article.body.split(/\n\s*\n/)[0];
    return (
      <Link
        href="/transparency"
        className="group relative mt-4 block overflow-hidden rounded-2xl bg-ink-900 shadow-gold transition-transform active:scale-[0.99]"
      >
        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="relative bg-gradient-to-t from-ink-950 via-ink-950/75 to-transparent p-5 pt-16">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-300">
            From the Archives
          </p>
          <h2 className="mt-1.5 font-display text-xl font-bold leading-snug text-[#f2ecdb]">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-400">{snippet}</p>
        </div>
      </Link>
    );
  }

  if (budgetSummary) {
    const remaining = budgetSummary.totalBudget - budgetSummary.totalSpending;
    const isSurplus = remaining >= 0;
    return (
      <Link
        href="/budget"
        className="group mt-4 block rounded-2xl bg-ink-900 p-5 shadow-gold transition-transform active:scale-[0.99]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-300">
          Budget Status
        </p>
        <p
          className={`mt-1.5 font-display text-3xl font-bold leading-tight ${
            isSurplus ? "text-gold-200" : "text-blood-400"
          }`}
        >
          {PESO.format(Math.abs(remaining))}
        </p>
        <p className="mt-1 text-[13px] text-ink-400">
          {isSurplus
            ? "Surplus remaining across all funds"
            : "Over budget — spending exceeds funds received"}
        </p>
      </Link>
    );
  }

  return null;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, PiggyBank, ShieldCheck, Users } from "lucide-react";

const TABS = [
  { href: "/", label: "Feed", icon: Rss },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/transparency", label: "Transparency", icon: ShieldCheck },
  { href: "/members", label: "Members", icon: Users }
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 2}
                className={active ? "text-gold-300" : "text-ink-400"}
              />
              <span
                className={`font-medium leading-none ${
                  active ? "text-gold-300" : "text-ink-400"
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-gold-liquid-soft" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

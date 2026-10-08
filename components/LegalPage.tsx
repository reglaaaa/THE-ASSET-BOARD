import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export function LegalPage({
  title,
  updated,
  children
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Logo size={32} />
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-gold-300">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-[#f2ecdb]">{title}</h1>
      <p className="mt-1 text-xs text-ink-400">Last updated: {updated}</p>
      <div className="mt-5 space-y-6 text-sm leading-relaxed text-ink-400">{children}</div>
      <div className="mt-8 flex gap-4 border-t border-ink-700 pt-4 text-xs">
        <Link href="/terms" className="text-gold-300 hover:underline">Terms and Conditions</Link>
        <Link href="/privacy" className="text-gold-300 hover:underline">Privacy Policy</Link>
      </div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-base font-bold text-[#f2ecdb]">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

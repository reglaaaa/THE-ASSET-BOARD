import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-700 bg-ink-950/60">
      <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
        <Logo size={28} />

        <p className="text-xs leading-relaxed text-ink-400">
          Official platform of the Batangas State University — LIMA Campus
          Supreme Student Council.
          <br />
          Engineered to Serve. United to Lead.
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-400">
          <Link href="/" className="hover:text-gold-300">
            Home
          </Link>
          <Link
            href="/transparency"
            className="inline-flex items-center gap-1.5 hover:text-gold-300"
          >
            <ShieldCheck size={13} strokeWidth={2.2} />
            Transparency
          </Link>
          <a
            href="mailto:26-32070@g.batstate-u.edu.ph"
            className="inline-flex items-center gap-1.5 hover:text-gold-300"
          >
            <Mail size={13} strokeWidth={2.2} />
            26-32070@g.batstate-u.edu.ph
          </a>
        </div>

        <p className="text-[11px] text-ink-400/70">
          © {year} BatStateU LIMA Campus — Supreme Student Council. For
          technical issues or site maintenance, contact the address above.
        </p>
      </div>
    </footer>
  );
}

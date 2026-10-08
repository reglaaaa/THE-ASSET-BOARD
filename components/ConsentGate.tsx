"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { hasAccepted, recordAcceptance } from "@/lib/consent";

// Blocks the whole site until the visitor agrees to the Terms and Privacy
// Policy. Acceptance is remembered in this browser only (see lib/consent.ts).
export function ConsentGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "needed" | "accepted">("checking");
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    setStatus(hasAccepted() ? "accepted" : "needed");
  }, []);

  // The legal pages must stay readable so people can read before agreeing.
  const onLegalPage = pathname === "/terms" || pathname === "/privacy";
  const locked = status !== "accepted" && !onLegalPage;

  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);

  if (!locked) return null;
  if (status === "checking") {
    return <div className="fixed inset-0 z-[100] bg-ink-950" aria-hidden />;
  }

  function accept() {
    if (!checked) return;
    recordAcceptance();
    setStatus("accepted");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-950/95 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-ink-700 bg-ink-900 p-5 sm:rounded-2xl">
        <Logo size={32} />

        <h2
          id="consent-title"
          className="mt-5 flex items-center gap-2 font-display text-lg font-bold text-[#f2ecdb]"
        >
          <ShieldCheck size={18} className="text-gold-300" />
          Before you continue
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-ink-400">
          THE ASSET is the anonymous feedback and transparency platform of the BatStateU
          Lima Campus Supreme Student Council. In short:
        </p>

        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-400">
          <li>• You can post without an account, and we do not ask for your name.</li>
          <li>
            • Posts are public unless you choose “SSC-only”. Do not include personal
            details about yourself or others.
          </li>
          <li>• Threats, harassment, hate, and false accusations are not allowed.</li>
          <li>
            • A random device ID is saved in your browser to limit spam and repeated likes.
          </li>
        </ul>

        <p className="mt-3 text-sm text-ink-400">
          Please read the full{" "}
          <Link href="/terms" target="_blank" className="font-medium text-gold-300 underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-gold-300 underline">
            Privacy Policy
          </Link>
          .
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-ink-600 bg-ink-950/60 p-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#e3b13c]"
          />
          <span className="text-sm leading-snug text-[#f2ecdb]">
            I have read and agree to the Terms and Conditions and the Privacy Policy, and I
            consent to the collection and use of my data as described.
          </span>
        </label>

        {declined && (
          <p className="mt-3 text-xs text-rose-300">
            You need to accept the Terms and Privacy Policy to use THE ASSET. You can close
            this page if you do not agree.
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDeclined(true)}
            className="flex-1 rounded-lg border border-ink-600 px-4 py-2.5 text-sm font-medium text-ink-400 hover:text-[#f2ecdb]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={!checked}
            className="flex-1 rounded-lg bg-gold-liquid px-4 py-2.5 text-sm font-bold text-ink-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}

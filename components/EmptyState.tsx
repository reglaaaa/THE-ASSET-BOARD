export function EmptyState({
  icon,
  message,
  className = ""
}: {
  icon: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 py-10 text-center ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-600 bg-ink-800/60 text-gold-300">
        {icon}
      </div>
      <p className="max-w-[220px] text-[13px] leading-snug text-ink-400">{message}</p>
    </div>
  );
}

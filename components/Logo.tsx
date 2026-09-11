export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="goldMark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6e2a8" />
            <stop offset="45%" stopColor="#e3b13c" />
            <stop offset="100%" stopColor="#a8721a" />
          </linearGradient>
        </defs>
        <path
          d="M50 8 L88 88 H66 L50 54 L34 88 H12 L50 8 Z M50 40 L58 58 H42 L50 40 Z"
          fill="url(#goldMark)"
          fillRule="evenodd"
        />
      </svg>
      <span className="font-display text-lg tracking-tight text-gold-200">
        THE ASSET
      </span>
    </div>
  );
}

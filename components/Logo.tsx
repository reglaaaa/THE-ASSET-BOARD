import Image from "next/image";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo-mark.png"
        alt="THE ASSET logo"
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
      <span className="font-display text-2xl font-bold tracking-tight text-gold-liquid">
        THE ASSET
      </span>
    </div>
  );
}

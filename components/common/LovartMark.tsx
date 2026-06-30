import Image from "next/image";

export function LovartMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-inset ring-1 ring-black/5 ${className}`}
      role="img"
      aria-label="Lovart"
    >
      <Image
        src="/lovart-logo.png"
        alt="Lovart"
        width={64}
        height={64}
        priority
        className="size-[78%] object-contain"
      />
    </span>
  );
}

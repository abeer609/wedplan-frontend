import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-full bg-blush-600 font-display text-lg font-bold text-white">
        W
      </span>
      <span className="font-display text-2xl font-bold tracking-tight text-charcoal">
        Wed<span className="text-blush-600">Plan</span>
      </span>
    </span>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.2 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.5 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.2-3.5-2.7-.1.1C.6 8.5 0 10.2 0 12s.6 3.5 1.6 5l3.6-2.6z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.6 6.6l3.6 2.8c1-2.8 3.7-4.7 6.8-4.7z"
      />
    </svg>
  );
}

export function ServiceImage({
  src,
  alt,
  className,
  sizes,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-blush-100 via-ivory-dark to-gold-100 font-display text-3xl text-blush-300",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        W
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-blush-50", className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"} />
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Inbox, SearchX } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-blush-100/70", className)} />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-blush-100 bg-white">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-blush-100 bg-white p-5">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="mt-4 h-7 w-16" />
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: "inbox" | "search";
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const Icon = icon === "search" ? SearchX : Inbox;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-blush-200 bg-white/60 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-blush-50 text-blush-400">
        <Icon className="size-7" />
      </span>
      <h3 className="font-display text-xl font-semibold text-charcoal">{title}</h3>
      <p className="max-w-sm text-sm text-charcoal-soft">{message}</p>
      {action}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24" role="status" aria-label={label}>
      <div className="flex flex-col items-center gap-3">
        <span className="size-10 animate-spin rounded-full border-[3px] border-blush-200 border-t-blush-600" />
        <p className="text-sm text-charcoal-soft">{label}</p>
      </div>
    </div>
  );
}

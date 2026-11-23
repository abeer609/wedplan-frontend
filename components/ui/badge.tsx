import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-blush-100 text-blush-800",
        gold: "bg-gold-100 text-gold-700",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        danger: "bg-red-100 text-red-700",
        muted: "bg-stone-200 text-stone-700",
        outline: "border border-blush-200 text-charcoal-soft",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const STATUS_VARIANT: Record<string, "warning" | "success" | "danger" | "muted"> = {
  pending: "warning",
  accepted: "success",
  approved: "success",
  rejected: "danger",
  cancelled: "muted",
};

function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "muted"} className={cn("capitalize", className)}>
      {status}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };

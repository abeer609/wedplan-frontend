import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  value,
  label,
  accent = "rose",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent?: "rose" | "gold" | "slate";
}) {
  const accents = {
    rose: "bg-blush-100 text-blush-700",
    gold: "bg-gold-100 text-gold-700",
    slate: "bg-stone-200 text-stone-700",
  } as const;
  return (
    <Card className="p-5">
      <span className={cn("flex size-10 items-center justify-center rounded-full", accents[accent])}>
        {icon}
      </span>
      <p className="mt-3 font-display text-3xl font-bold text-charcoal">{value}</p>
      <p className="mt-1 text-sm text-charcoal-soft">{label}</p>
    </Card>
  );
}

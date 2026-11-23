import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.2em] text-blush-600 uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-charcoal-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  centered,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-8 ${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-bold tracking-[0.25em] text-blush-600 uppercase">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl font-bold text-charcoal sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-charcoal-soft">{description}</p>}
    </div>
  );
}

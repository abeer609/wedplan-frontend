"use client";

import Link from "next/link";
import { Crown, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceImage } from "@/components/ui/brand";
import { CATEGORY_LABELS, formatPrice, type Service } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-gold-500 to-gold-300 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow",
        className,
      )}
    >
      <Crown className="size-3" /> Premium
    </span>
  );
}

export function ServiceCard({ service, premium }: { service: Service; premium?: boolean }) {
  const isPremium = premium ?? Boolean((service.vendor as { premium?: boolean } | undefined)?.premium);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-blush-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/services/${service._id}`} className="block">
        <ServiceImage
          src={service.images[0]}
          alt={service.serviceName}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="default">{CATEGORY_LABELS[service.category] ?? service.category}</Badge>
          {isPremium && <PremiumBadge />}
        </div>
        <Link href={`/services/${service._id}`}>
          <h3 className="line-clamp-1 font-display text-lg font-semibold text-charcoal transition-colors group-hover:text-blush-700">
            {service.serviceName}
          </h3>
        </Link>
        <p className="flex items-center gap-1 text-xs text-charcoal-soft">
          <MapPin className="size-3.5 text-blush-400" /> {service.location}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="font-display text-xl font-bold text-gold-700">{formatPrice(service.price)}</p>
          <Link href={`/services/${service._id}`}>
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ServiceGrid({ services, premiumIds }: { services: Service[]; premiumIds?: Set<string> }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((s) => (
        <ServiceCard key={s._id} service={s} premium={premiumIds?.has(s.vendorId)} />
      ))}
    </div>
  );
}

export function CategoryCard({
  value,
  label,
  blurb,
  image,
}: {
  value: string;
  label: string;
  blurb: string;
  image: string;
}) {
  return (
    <Link
      href={`/services?category=${value}`}
      className="group relative block overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
      </div>
      <div className="absolute right-4 bottom-4 left-4">
        <p className="flex items-center gap-1.5 font-display text-xl font-semibold text-white">
          <Star className="size-4 fill-gold-300 text-gold-300" /> {label}
        </p>
        <p className="mt-0.5 text-xs text-white/85">{blurb}</p>
      </div>
    </Link>
  );
}

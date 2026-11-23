"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2 } from "lucide-react";
import { authed } from "@/lib/api";
import { formatPrice, type Booking, type Pagination } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLoader, EmptyState } from "@/components/ui/loaders";
import { PremiumBadge } from "@/components/services";

interface VendorStats {
  services: { total: number; active: number; pending: number };
  bookings: { total: number; pending: number; accepted: number };
  plan: "free" | "premium";
}

export default function VendorOverviewPage() {
  const stats = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: () => authed<{ data: VendorStats }>("/vendor/stats").then((r) => r.data),
  });
  const pending = useQuery({
    queryKey: ["vendor-pending"],
    queryFn: () =>
      authed<{ data: Booking[]; pagination: Pagination }>(
        "/vendor/bookings?status=pending&page=1&limit=5",
      ).then((r) => r.data),
  });

  if (stats.isPending) return <PageLoader label="Loading your business…" />;
  if (stats.isError || !stats.data) {
    return (
      <EmptyState
        title="Couldn't load your dashboard"
        message="Please refresh to try again."
        action={<Button onClick={() => stats.refetch()}>Retry</Button>}
      />
    );
  }

  const s = stats.data;
  const freeUsed = s.services.active;
  const cards = [
    { label: "Total services", value: s.services.total },
    { label: "Active listings", value: s.services.active },
    { label: "Pending review", value: s.services.pending },
    { label: "Accepted bookings", value: s.bookings.accepted },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Your business at a glance"
        action={
          <Link href="/dashboard/vendor/services/new">
            <Button>Add service</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="font-display text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-charcoal-soft">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-gold-300/50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Crown className="size-5 text-gold-500" />
              {s.plan === "premium" ? "Premium plan" : "Free plan"}
            </h3>
            {s.plan === "premium" ? <PremiumBadge /> : null}
          </div>
          {s.plan === "free" ? (
            <>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-blush-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blush-500 to-gold-500 transition-all"
                  style={{ width: `${Math.min(100, (freeUsed / 3) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-charcoal-soft">
                {freeUsed} of 3 free active listings used. Upgrade for unlimited listings.
              </p>
              <Link href="/dashboard/vendor/subscription" className="mt-4 block">
                <Button variant="gold" className="w-full">Upgrade to Premium</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-charcoal-soft">
                Unlimited listings, priority placement and the Premium badge on all your services.
              </p>
              <Link href="/dashboard/vendor/subscription" className="mt-4 block">
                <Button variant="outline" className="w-full">Manage subscription</Button>
              </Link>
            </>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pending requests</h3>
            <Link href="/dashboard/vendor/bookings">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          {pending.isPending ? (
            <Loader2 className="mt-4 size-6 animate-spin text-blush-400" />
          ) : !pending.data?.length ? (
            <p className="mt-3 text-sm text-charcoal-soft">
              No pending requests right now. New booking requests will appear here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-blush-100">
              {pending.data.map((b) => (
                <li key={b._id} className="py-2 text-sm">
                  <span className="font-semibold">
                    {typeof b.serviceId === "object" ? b.serviceId.serviceName : "A service"}
                  </span>{" "}
                  <span className="text-charcoal-soft">
                    · {b.customer?.name ?? "Customer"} · {b.eventLocation}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function VendorServiceThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className="flex h-full items-center justify-center font-display text-2xl text-blush-300">W</div>;
  return <Image src={src} alt={alt} fill className="object-cover" />;
}

export function price(v: number) {
  return formatPrice(v);
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { authed } from "@/lib/api";
import { formatDate, formatPrice, type Booking, type Pagination } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { StatusBadge } from "@/components/ui/badge";

function serviceName(b: Booking) {
  return typeof b.serviceId === "object" ? b.serviceId.serviceName : "Service";
}

type StatValue = number | { total?: number } | null | undefined;

function statNumber(v: StatValue): string {
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object" && typeof v.total === "number") return String(v.total);
  return "—";
}

export default function AdminOverviewPage() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      authed<{
        data: {
          users: StatValue;
          services: StatValue;
          bookings: StatValue;
          revenue: number | { total?: number } | null | undefined;
        };
      }>("/admin/stats").then((r) => r.data),
  });
  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () =>
      authed<{ data: { premium: StatValue; free: StatValue } }>("/admin/subscriptions/overview").then(
        (r) => r.data,
      ),
  });
  const recent = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => {
      try {
        const r = await authed<{ data: Booking[] | { bookings?: Booking[] }; pagination?: Pagination }>(
          "/admin/bookings?page=1&limit=5",
        );
        const d = r.data as Booking[] | { bookings?: Booking[] };
        return Array.isArray(d) ? d : (d.bookings ?? []);
      } catch {
        const r = await authed<{ data: Booking[]; pagination: Pagination }>(
          "/vendor/bookings?page=1&limit=5",
        );
        return r.data;
      }
    },
  });

  if (stats.isPending) return <PageLoader label="Loading platform stats…" />;

  const data = stats.data;
  const revenueValue =
    typeof data?.revenue === "number"
      ? data.revenue
      : typeof data?.revenue?.total === "number"
        ? data.revenue.total
        : null;
  const cards = [
    { label: "Users", value: statNumber(data?.users) },
    { label: "Services", value: statNumber(data?.services) },
    { label: "Bookings", value: statNumber(data?.bookings) },
    { label: "Revenue (paid)", value: revenueValue !== null ? formatPrice(revenueValue) : "—" },
    { label: "Premium vendors", value: statNumber(plans.data?.premium) },
    { label: "Free vendors", value: statNumber(plans.data?.free) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Admin dashboard"
        title="Platform overview"
        description="Users, listings, bookings and revenue at a glance."
      />
      {stats.isError ? (
        <EmptyState title="Couldn't load stats" message="Please try again." action={<Button onClick={() => stats.refetch()}>Retry</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-blush-100 bg-white p-5">
              <p className="font-display text-3xl font-bold">{c.value}</p>
              <p className="mt-1 text-sm text-charcoal-soft">{c.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-blush-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Latest bookings</h3>
          <Link href="/dashboard/admin/transactions"><Button variant="ghost" size="sm">Transactions</Button></Link>
        </div>
        {!recent.data?.length ? (
          <p className="mt-3 text-sm text-charcoal-soft">No bookings yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-blush-100">
            {recent.data.map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{serviceName(b)}</span>
                  <span className="text-charcoal-soft"> · {formatDate(b.eventDate)}</span>
                </span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

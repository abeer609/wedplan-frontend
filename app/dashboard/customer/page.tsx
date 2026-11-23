"use client";

import Link from "next/link";
import { BookOpenCheck, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authed } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageLoader, StatSkeleton } from "@/components/ui/loaders";
import type { Booking } from "@/lib/constants";
import { formatDate } from "@/lib/constants";

function serviceName(b: Booking) {
  return typeof b.serviceId === "object" ? b.serviceId.serviceName : "Service";
}

export default function CustomerOverviewPage() {
  const stats = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () =>
      authed<{ data: { bookings?: { total: number; pending: number; accepted: number; cancelled: number } } }>(
        "/customer/stats",
      ).then((r) => r.data.bookings ?? { total: 0, pending: 0, accepted: 0, cancelled: 0 }),
  });
  const recent = useQuery({
    queryKey: ["customer-recent"],
    queryFn: () =>
      authed<{ data: Booking[] }>("/bookings/mine?page=1&limit=3").then((r) => r.data),
  });

  if (stats.isPending) return <PageLoader label="Loading your overview…" />;

  const s = stats.data ?? { total: 0, pending: 0, accepted: 0, cancelled: 0 };

  return (
    <div>
      <PageHeader
        eyebrow="Customer dashboard"
        title="Your wedding at a glance"
        description="Track your booking requests and upcoming celebrations."
        action={
          <Link href="/services">
            <Button>Browse services</Button>
          </Link>
        }
      />
      {stats.isError ? (
        <EmptyState
          title="Couldn't load stats"
          message={stats.error instanceof Error ? stats.error.message : "Please refresh the page to try again."}
          action={<Button onClick={() => stats.refetch()}>Retry</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<BookOpenCheck className="size-5" />} value={s.total} label="Total bookings" accent="rose" />
          <StatCard icon={<CalendarClock className="size-5" />} value={s.pending} label="Pending requests" accent="gold" />
          <StatCard icon={<CheckCircle2 className="size-5" />} value={s.accepted} label="Accepted" accent="slate" />
          <StatCard icon={<XCircle className="size-5" />} value={s.cancelled} label="Cancelled" accent="slate" />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent bookings</CardTitle>
          <Link href="/dashboard/customer/bookings">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent.isPending ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatSkeleton /><StatSkeleton /><StatSkeleton />
            </div>
          ) : !recent.data?.length ? (
            <EmptyState
              title="No bookings yet"
              message="Browse services and send your first booking request."
              action={<Link href="/services"><Button>Explore services</Button></Link>}
            />
          ) : (
            <ul className="divide-y divide-blush-100">
              {recent.data.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{serviceName(b)}</p>
                    <p className="text-xs text-charcoal-soft">
                      {formatDate(b.eventDate)} · {b.eventLocation}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blush-50 px-2.5 py-1 text-xs font-semibold capitalize text-blush-700">
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { formatDate, formatPrice, type Booking, type BookingStatus, type Pagination } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TABS: (BookingStatus | "")[] = ["", "pending", "accepted", "rejected", "cancelled"];

function bookingService(b: Booking) {
  return typeof b.serviceId === "object" ? b.serviceId : null;
}

export default function CustomerBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);
  const qc = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["my-bookings", status],
    queryFn: () =>
      authed<{ data: Booking[]; pagination: Pagination }>(
        `/bookings/mine?${status ? `status=${status}&` : ""}page=1&limit=50`,
      ).then((r) => r.data),
  });

  async function cancelBooking() {
    if (!cancelId) return;
    try {
      await authed(`/bookings/${cancelId}/cancel`, { method: "PATCH" });
      toast.success("Booking cancelled.");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["customer-stats"] });
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_PROCESSED") {
        toast.error("Too late to cancel — refreshing the latest status.");
        refetch();
      } else {
        toast.error(e instanceof Error ? e.message : "Could not cancel the booking.");
      }
    } finally {
      setCancelId(null);
    }
  }

  if (isPending) return <PageLoader label="Loading your bookings…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Customer dashboard"
        title="My bookings"
        description="Every request you've sent, with live status from the vendor."
        action={<Link href="/services"><Button>Book a service</Button></Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => (
          <button
            key={t || "all"}
            role="tab"
            aria-selected={status === t}
            onClick={() => setStatus(t)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold capitalize transition-colors",
              status === t ? "bg-charcoal text-white" : "bg-white text-charcoal-soft ring-1 ring-blush-200 hover:bg-blush-50",
            )}
          >
            {t || "All"}
          </button>
        ))}
      </div>

      {isError ? (
        <EmptyState
          title="Couldn't load bookings"
          message="Please try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : !data?.length ? (
        <EmptyState
          title={status ? `No ${status} bookings` : "No bookings yet"}
          message="When you request a service, it will show up here."
          action={<Link href="/services"><Button>Explore services</Button></Link>}
        />
      ) : (
        <div className="grid gap-4">
          {data.map((b) => {
            const svc = bookingService(b);
            return (
              <Card key={b._id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-blush-50 sm:w-40">
                    {svc?.images?.[0] ? (
                      <Image src={svc.images[0]} alt={svc.serviceName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-3xl text-blush-300">W</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold">
                        {svc?.serviceName ?? "Service"}
                      </h3>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-charcoal-soft">
                      {formatDate(b.eventDate)} · {b.eventLocation}
                    </p>
                    {svc && <p className="text-sm font-semibold text-gold-700">{formatPrice(svc.price)}</p>}
                    {b.message && <p className="mt-1 line-clamp-1 text-xs text-charcoal-soft">“{b.message}”</p>}
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Button variant="outline" size="sm" onClick={() => setViewing(b)}>Details</Button>
                    {b.status === "pending" && (
                      <Button variant="destructive" size="sm" onClick={() => setCancelId(b._id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(o) => !o && setCancelId(null)}
        title="Cancel this booking?"
        description="The vendor will be notified. This can't be undone."
        confirmLabel="Yes, cancel"
        destructive
        onConfirm={cancelBooking}
      />

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>Requested on {viewing && formatDate(viewing.createdAt)}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Service</dt><dd className="text-right font-medium">{bookingService(viewing)?.serviceName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Event date</dt><dd className="font-medium">{formatDate(viewing.eventDate)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Event location</dt><dd className="text-right font-medium">{viewing.eventLocation}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Status</dt><dd><StatusBadge status={viewing.status} /></dd></div>
              {viewing.message && (
                <div><dt className="text-charcoal-soft">Your message</dt><dd className="mt-1 rounded-xl bg-ivory p-3">{viewing.message}</dd></div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

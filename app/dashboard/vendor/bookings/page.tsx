"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { bookingCustomer, formatDate, type Booking, type BookingStatus, type Pagination } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

const TABS: (BookingStatus | "")[] = ["pending", "accepted", "rejected", "cancelled", ""];

export default function VendorBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "">("pending");
  const qc = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["vendor-bookings", status],
    queryFn: () =>
      authed<{ data: Booking[]; pagination: Pagination }>(
        `/vendor/bookings?${status ? `status=${status}&` : ""}page=1&limit=50`,
      ).then((r) => r.data),
  });

  async function act(id: string, action: "accept" | "reject") {
    try {
      await authed(`/vendor/bookings/${id}/${action}`, { method: "PATCH" });
      toast.success(action === "accept" ? "Booking accepted!" : "Booking rejected.");
      qc.invalidateQueries({ queryKey: ["vendor-bookings"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_PROCESSED") {
        toast.error("Already handled — refreshing the latest status.");
        refetch();
      } else {
        toast.error(e instanceof Error ? e.message : "Action failed. Please try again.");
      }
    }
  }

  if (isPending) return <PageLoader label="Loading booking requests…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Booking requests"
        description="Requests from couples for your services. Only pending ones can be accepted or rejected."
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
        <EmptyState title="Couldn't load bookings" message="Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !data?.length ? (
        <EmptyState
          title={status === "pending" ? "No pending requests" : `No ${status || ""} bookings`}
          message="New booking requests from customers will appear here."
        />
      ) : (
        <div className="grid gap-4">
          {data.map((b) => {
            const svc = typeof b.serviceId === "object" ? b.serviceId : null;
            const customer = bookingCustomer(b);
            const initials = (customer?.name ?? "C").charAt(0).toUpperCase();
            const phone = b.phone ?? customer?.phone;
            return (
              <Card key={b._id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{svc?.serviceName ?? "Service"}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-ivory p-3">
                    {customer?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={customer.image} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blush-600 text-base font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{customer?.name ?? "Customer"}</p>
                      {customer?.email && (
                        <a href={`mailto:${customer.email}`} className="block truncate text-xs text-blush-700 hover:underline">
                          {customer.email}
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone.replace(/[\s-]/g, "")}`} className="block truncate text-xs font-medium text-charcoal hover:underline">
                          {phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Event date</dt><dd className="font-medium">{formatDate(b.eventDate)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Event location</dt><dd className="text-right font-medium">{b.eventLocation}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-charcoal-soft">Requested</dt><dd className="font-medium">{formatDate(b.createdAt)}</dd></div>
                  </dl>
                  {b.message && (
                    <p className="rounded-xl bg-ivory p-3 text-sm text-charcoal-soft">“{b.message}”</p>
                  )}
                  {b.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act(b._id, "accept")}>
                        <Check className="size-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => act(b._id, "reject")}>
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

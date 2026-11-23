"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authed } from "@/lib/api";
import { CATEGORY_LABELS, CATEGORY_LABELS as CL, formatPrice, type Pagination, type Service } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";
import { VendorServiceThumb } from "../../vendor/page";

const STATUS_TABS = ["", "pending", "approved", "rejected"] as const;

export default function AdminServicesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("pending");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const qs = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-services", qs],
    queryFn: () => authed<{ data: Service[]; pagination: Pagination }>(`/admin/services?${qs}`).then((r) => r),
  });

  async function moderate(id: string, action: "approve" | "reject") {
    try {
      await authed(`/admin/services/${id}/${action}`, { method: "PATCH" });
      toast.success(action === "approve" ? "Service approved — it's now public." : "Service rejected.");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function deleteService() {
    if (!deleteId) return;
    try {
      await authed(`/admin/services/${deleteId}`, { method: "DELETE" });
      toast.success("Service deleted.");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleteId(null);
    }
  }

  if (isPending && !data) return <PageLoader label="Loading services…" />;

  return (
    <div>
      <PageHeader eyebrow="Admin dashboard" title="Service moderation" description="Approve, reject or remove listings. Approved + active listings appear publicly." />
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-charcoal-soft" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search services…"
              className="pl-10"
              aria-label="Search services"
            />
          </label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="min-h-11 rounded-xl border border-blush-200 bg-white px-3 text-sm outline-none focus:border-blush-400"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((t) => (
            <button
              key={t || "all"}
              role="tab"
              aria-selected={status === t}
              onClick={() => { setStatus(t); setPage(1); }}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold capitalize transition-colors",
                status === t ? "bg-charcoal text-white" : "bg-white text-charcoal-soft ring-1 ring-blush-200 hover:bg-blush-50",
              )}
            >
              {t || "All"}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <EmptyState title="Couldn't load services" message="Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !data?.data.length ? (
        <EmptyState title={`No ${status || ""} services`} message="The moderation queue is clear." />
      ) : (
        <>
          <div className="grid gap-4">
            {data.data.map((s) => (
              <div key={s._id} className="flex flex-col gap-3 rounded-2xl border border-blush-100 bg-white p-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-blush-50 sm:w-36">
                  <VendorServiceThumb src={s.images[0]} alt={s.serviceName} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/services/${s._id}`} className="truncate font-display text-lg font-semibold hover:text-blush-700">
                      {s.serviceName}
                    </Link>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-charcoal-soft">
                    {CL[s.category]} · {s.location} · <span className="font-semibold text-gold-700">{formatPrice(s.price)}</span>
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-charcoal-soft">{s.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {s.status !== "approved" && (
                    <Button size="sm" onClick={() => moderate(s._id, "approve")}>Approve</Button>
                  )}
                  {s.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => moderate(s._id, "reject")}>Reject</Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(s._id)} aria-label="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {data.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-charcoal-soft">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {data.pagination.page} of {data.pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this service?"
        description="The listing will be permanently removed."
        confirmLabel="Yes, delete"
        destructive
        onConfirm={deleteService}
      />
    </div>
  );
}

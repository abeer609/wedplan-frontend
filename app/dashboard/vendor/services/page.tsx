"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { CATEGORY_LABELS, formatPrice, type Pagination, type Service } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { VendorServiceThumb } from "../page";

export default function VendorServicesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["vendor-services", page],
    queryFn: () =>
      authed<{ data: Service[]; pagination: Pagination }>(
        `/vendor/services?page=${page}&limit=20`,
      ).then((r) => r),
  });

  async function toggleAvailability(s: Service) {
    try {
      await authed(`/vendor/services/${s._id}/availability`, { method: "PATCH" });
      toast.success(s.isActive ? "Listing paused." : "Listing is live again.");
      qc.invalidateQueries({ queryKey: ["vendor-services"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    } catch (e) {
      if (e instanceof ApiError && e.code === "UPGRADE_REQUIRED") {
        toast.error("Free plan allows 3 active listings.", {
              action: { label: "Upgrade", onClick: () => router.push("/dashboard/vendor/subscription") },
            });
      } else {
        toast.error(e instanceof Error ? e.message : "Could not update availability.");
      }
    }
  }

  async function deleteService() {
    if (!deleteId) return;
    try {
      await authed(`/vendor/services/${deleteId}`, { method: "DELETE" });
      toast.success("Service deleted.");
      qc.invalidateQueries({ queryKey: ["vendor-services"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the service.");
    } finally {
      setDeleteId(null);
    }
  }

  if (isPending) return <PageLoader label="Loading your services…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="My services"
        description="Manage listings, availability and edits. Edits send a listing back for review."
        action={
          <Link href="/dashboard/vendor/services/new">
            <Button><Plus className="size-4" /> Add service</Button>
          </Link>
        }
      />
      {isError ? (
        <EmptyState
          title="Couldn't load services"
          message="Please try again."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : !data?.data.length ? (
        <EmptyState
          title="No services yet"
          message="Create your first listing to start receiving bookings."
          action={<Link href="/dashboard/vendor/services/new"><Button><Plus className="size-4" /> Add your first service</Button></Link>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-charcoal-soft" aria-live="polite">
            {data.pagination.total} listing{data.pagination.total === 1 ? "" : "s"}
          </p>
          <div className="hidden overflow-hidden rounded-2xl border border-blush-100 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-blush-100 bg-ivory text-xs tracking-wide text-charcoal-soft uppercase">
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Live</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {data.data.map((s) => (
                  <tr key={s._id} className="hover:bg-blush-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-blush-50">
                          <VendorServiceThumb src={s.images[0]} alt={s.serviceName} />
                        </div>
                        <span className="font-semibold">{s.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-soft">{CATEGORY_LABELS[s.category]}</td>
                    <td className="px-4 py-3 font-semibold text-gold-700">{formatPrice(s.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(s)}
                        aria-label={s.isActive ? "Pause listing" : "Activate listing"}
                        className={`relative h-6 w-11 rounded-full transition-colors ${s.isActive ? "bg-emerald-500" : "bg-stone-300"}`}
                      >
                        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${s.isActive ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/dashboard/vendor/services/${s._id}/edit`}>
                          <Button variant="ghost" size="sm" aria-label="Edit"><Pencil className="size-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" aria-label={s.isActive ? "Pause" : "Activate"} onClick={() => toggleAvailability(s)}>
                          <Power className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Delete" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteId(s._id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {data.data.map((s) => (
              <Card key={s._id} className="p-4">
                <div className="flex gap-3">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-blush-50">
                    <VendorServiceThumb src={s.images[0]} alt={s.serviceName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.serviceName}</p>
                    <p className="text-sm font-semibold text-gold-700">{formatPrice(s.price)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={s.status} />
                      {!s.isActive && <Badge variant="muted">Paused</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-blush-100 pt-3">
                  <Link href={`/dashboard/vendor/services/${s._id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full"><Pencil className="size-3.5" /> Edit</Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleAvailability(s)}>
                    <Power className="size-3.5" /> {s.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(s._id)} aria-label="Delete">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {data.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-charcoal-soft">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span>Page {data.pagination.page} of {data.pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this service?"
        description="The listing and its details will be permanently removed. Bookings already made are kept."
        confirmLabel="Yes, delete"
        destructive
        onConfirm={deleteService}
      />
    </div>
  );
}

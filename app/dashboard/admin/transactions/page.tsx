"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authed } from "@/lib/api";
import { formatDate, formatPrice, type Pagination, type Transaction } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["", "paid", "failed", "refunded", "expired"] as const;

const DOT: Record<string, string> = {
  paid: "bg-emerald-500",
  failed: "bg-red-500",
  refunded: "bg-amber-500",
  expired: "bg-stone-400",
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("");
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({
    ...(status ? { status } : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-transactions", qs],
    queryFn: () =>
      authed<{ data: Transaction[]; pagination: Pagination }>(`/admin/transactions?${qs}`).then((r) => r),
  });

  if (isPending && !data) return <PageLoader label="Loading transactions…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Admin dashboard"
        title="Transactions"
        description="Stripe payment ledger. Read-only — entries are created by checkouts and webhooks."
      />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
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

      {isError ? (
        <EmptyState title="Couldn't load transactions" message="Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !data?.data.length ? (
        <EmptyState title="No transactions yet" message="Completed Stripe checkouts will appear here." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-blush-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-blush-100 bg-ivory text-xs tracking-wide text-charcoal-soft uppercase">
                  <th className="px-4 py-3 font-semibold">Vendor</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {data.data.map((t) => (
                  <tr key={t._id} className="hover:bg-blush-50/40">
                    <td className="px-4 py-3 font-medium">
                      {t.vendor?.name ?? t.vendor?.email ?? "—"}
                      {t.vendor?.email && t.vendor?.name && (
                        <span className="block text-xs font-normal text-charcoal-soft">{t.vendor.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{t.plan}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(t.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        <span className={cn("size-1.5 rounded-full", DOT[t.status] ?? "bg-stone-400")} />
                        {t.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-charcoal-soft md:table-cell">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}

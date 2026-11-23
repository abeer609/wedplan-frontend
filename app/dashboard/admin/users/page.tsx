"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { formatDate, type BackendUser, type Pagination } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<BackendUser | null>(null);
  const qc = useQueryClient();

  const qs = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(role ? { role } : {}),
    page: String(page),
    limit: "20",
  }).toString();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin-users", qs],
    queryFn: () => authed<{ data: BackendUser[]; pagination: Pagination }>(`/admin/users?${qs}`).then((r) => r),
  });

  const detail = useQuery({
    queryKey: ["admin-user", detailId],
    queryFn: () => authed<{ data: BackendUser }>(`/admin/users/${detailId}`).then((r) => r.data),
    enabled: detailId !== null,
  });

  async function toggleBlock() {
    if (!blockTarget) return;
    const action = blockTarget.isBlocked ? "unblock" : "block";
    try {
      await authed(`/admin/users/${blockTarget._id}/${action}`, { method: "PATCH" });
      toast.success(blockTarget.isBlocked ? "User unblocked." : "User blocked.");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      detail.refetch();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error("You can't block yourself or another admin.");
      } else {
        toast.error(e instanceof Error ? e.message : "Action failed.");
      }
    } finally {
      setBlockTarget(null);
    }
  }

  if (isPending && page === 1 && !data) return <PageLoader label="Loading users…" />;

  return (
    <div>
      <PageHeader eyebrow="Admin dashboard" title="Users" description="Search, inspect, block or unblock accounts." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-charcoal-soft" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="pl-10"
            aria-label="Search users"
          />
        </label>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="min-h-11 rounded-xl border border-blush-200 bg-white px-3 text-sm outline-none focus:border-blush-400"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {isError ? (
        <EmptyState title="Couldn't load users" message="Please try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !data?.data.length ? (
        <EmptyState title="No users found" message="Try a different search or filter." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-blush-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-blush-100 bg-ivory text-xs tracking-wide text-charcoal-soft uppercase">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Role</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush-50">
                {data.data.map((u) => (
                  <tr key={u._id} className="hover:bg-blush-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blush-600 text-sm font-bold text-white">
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{u.name}</p>
                          <p className="truncate text-xs text-charcoal-soft">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                    <td className="hidden px-4 py-3 text-charcoal-soft md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.isBlocked ? <Badge variant="danger">Blocked</Badge> : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(u._id)}>View</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.isBlocked ? "text-emerald-600" : "text-red-600"}
                          onClick={() => setBlockTarget(u)}
                        >
                          {u.isBlocked ? "Unblock" : "Block"}
                        </Button>
                      </div>
                    </td>
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

      <Dialog open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>Full account information.</DialogDescription>
          </DialogHeader>
          {!detail.data ? (
            <p className="py-6 text-center text-sm text-charcoal-soft">Loading…</p>
          ) : (
            <dl className="space-y-2.5 text-sm">
              {[
                ["Name", detail.data.name],
                ["Email", detail.data.email],
                ["Role", detail.data.role],
                ["Phone", detail.data.phone || "—"],
                ["Business", detail.data.businessName || "—"],
                ["Plan", `${detail.data.effectivePlan}${detail.data.subscriptionExpiresAt ? ` (expires ${formatDate(detail.data.subscriptionExpiresAt)})` : ""}`],
                ["Joined", formatDate(detail.data.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-charcoal-soft">{k}</dt>
                  <dd className="text-right font-medium break-all">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt className="text-charcoal-soft">Status</dt>
                <dd>{detail.data.isBlocked ? <Badge variant="danger">Blocked</Badge> : <Badge variant="success">Active</Badge>}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(o) => !o && setBlockTarget(null)}
        title={blockTarget?.isBlocked ? "Unblock this user?" : "Block this user?"}
        description={
          blockTarget?.isBlocked
            ? `${blockTarget.name} will be able to sign in again.`
            : `${blockTarget?.name} will be signed out everywhere and blocked from signing in.`
        }
        confirmLabel={blockTarget?.isBlocked ? "Unblock" : "Block"}
        destructive={!blockTarget?.isBlocked}
        onConfirm={toggleBlock}
      />
    </div>
  );
}

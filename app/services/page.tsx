"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABELS, type Pagination, type Service } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { ServiceGrid } from "@/components/services";
import { EmptyState, ServiceGridSkeleton } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

function useDebounced(value: string, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Browse() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");
  const [page, setPage] = useState(Number(params.get("page") ?? 1) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const current = params.toString();
    if (current === lastWritten.current) return;
    setSearch(params.get("search") ?? "");
    setCategory(params.get("category") ?? "");
    setLocation(params.get("location") ?? "");
    setSort(params.get("sort") ?? "newest");
    setPage(Number(params.get("page") ?? 1) || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const debouncedSearch = useDebounced(search);
  const debouncedLocation = useDebounced(location);

  function updateFilters(apply: () => void) {
    apply();
    setPage(1);
  }

  useEffect(() => {
    const q = new URLSearchParams();
    if (debouncedSearch) q.set("search", debouncedSearch);
    if (category) q.set("category", category);
    if (debouncedLocation) q.set("location", debouncedLocation);
    if (sort && sort !== "newest") q.set("sort", sort);
    if (page > 1) q.set("page", String(page));
    const next = q.toString();
    if (next === lastWritten.current) return;
    lastWritten.current = next;
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [debouncedSearch, category, debouncedLocation, sort, page, pathname, router]);

  const queryString = new URLSearchParams({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
    ...(debouncedLocation ? { location: debouncedLocation } : {}),
    sort,
    page: String(page),
    limit: "12",
  }).toString();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["services", queryString],
    queryFn: () =>
      api<{ data: Service[]; pagination: Pagination }>(`/services?${queryString}`).then((r) => ({
        services: r.data,
        pagination: r.pagination,
      })),
  });

  const hasFilters = Boolean(debouncedSearch || category || debouncedLocation || sort !== "newest");

  function clearFilters() {
    setSearch("");
    setCategory("");
    setLocation("");
    setSort("newest");
    setPage(1);
  }

  const filters = (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-charcoal-soft" />
        <Input
          value={search}
          onChange={(e) => updateFilters(() => setSearch(e.target.value.slice(0, 100)))}
          placeholder="Search venues, photographers…"
          className="pl-10"
          aria-label="Search services"
        />
        {search && (
          <button
            onClick={() => updateFilters(() => setSearch(""))}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-charcoal-soft hover:text-charcoal"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      <Input
        value={location}
        onChange={(e) => updateFilters(() => setLocation(e.target.value.slice(0, 100)))}
        placeholder="Location (e.g. Dhaka)"
        aria-label="Filter by location"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateFilters(() => setCategory(""))}
          className={cn(
            "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
            category === "" ? "bg-charcoal text-white" : "bg-blush-50 text-charcoal-soft hover:bg-blush-100",
          )}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => updateFilters(() => setCategory(category === c.value ? "" : c.value))}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
              category === c.value
                ? "bg-blush-600 text-white"
                : "bg-blush-50 text-charcoal-soft hover:bg-blush-100",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium text-charcoal-soft">Sort</span>
        <select
          value={sort}
          onChange={(e) => updateFilters(() => setSort(e.target.value))}
          className="min-h-11 flex-1 rounded-xl border border-blush-200 bg-white px-3 text-sm outline-none focus:border-blush-400"
          aria-label="Sort services"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start">
          <X className="size-3.5" /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Browse"
        title="Find your perfect vendors"
        description="Search across venues, catering, photography, decoration, music and makeup."
      />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-blush-100 bg-white p-5">
            {filters}
          </div>
        </aside>
        <div>
          <div className="mb-4 lg:hidden">
            <Button variant="outline" className="w-full" onClick={() => setFiltersOpen((v) => !v)}>
              <SlidersHorizontal className="size-4" /> Filters
              {hasFilters && <span className="ml-1 rounded-full bg-blush-600 px-2 py-0.5 text-[11px] text-white">•</span>}
            </Button>
            {filtersOpen && (
              <div className="mt-3 rounded-2xl border border-blush-100 bg-white p-5">{filters}</div>
            )}
          </div>
          {isPending ? (
            <ServiceGridSkeleton count={8} />
          ) : isError ? (
            <EmptyState
              icon="search"
              title="Couldn't load services"
              message="Something went wrong while fetching services. Please try again."
              action={<Button onClick={() => refetch()}>Retry</Button>}
            />
          ) : !data?.services.length ? (
            <EmptyState
              icon="search"
              title="No services found"
              message={
                hasFilters
                  ? "Nothing matches those filters. Try a different search or clear the filters."
                  : "No services are listed yet. Check back soon!"
              }
              action={hasFilters ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-charcoal-soft" aria-live="polite">
                {data.pagination.total} service{data.pagination.total === 1 ? "" : "s"} found
                {category ? ` in ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}` : ""}
              </p>
              <ServiceGrid services={data.services} />
              {data.pagination.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </Button>
                  <span className="text-sm text-charcoal-soft">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense>
      <Browse />
    </Suspense>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, MapPin } from "lucide-react";
import { ApiError, authed } from "@/lib/api";
import { CATEGORY_LABELS, formatDate, formatPrice, type Service } from "@/lib/constants";
import { useProfile } from "@/hooks/use-auth";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "@/components/booking-dialog";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { PremiumBadge } from "@/components/services";

export default function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, isPending: profilePending } = useProfile();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["service", id],
    queryFn: () => authed<{ data: Service }>(`/services/${id}`).then((r) => r.data),
    retry: false,
  });

  if (isPending || profilePending) return <PageLoader label="Loading service…" />;
  if (isError || !data) {
    const status = error instanceof ApiError ? error.status : 0;
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center sm:px-6">
        <EmptyState
          icon="search"
          title={
            status === 404
              ? "Service not available"
              : status === 403
                ? "Not allowed"
                : "Couldn't load this service"
          }
          message={
            status === 404
              ? "This listing doesn't exist, isn't public, or was removed."
              : status === 403
                ? "Your account doesn't have access to this listing."
                : status === 401
                  ? "Please sign in to view service details."
                  : "Something went wrong. Please try again."
          }
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="size-4" /> Go back
              </Button>
              {status === 401 ? (
                <Link href={`/signin?redirect=/services/${id}`}>
                  <Button>Sign in</Button>
                </Link>
              ) : (
                <Button onClick={() => refetch()}>Retry</Button>
              )}
            </div>
          }
        />
      </main>
    );
  }

  const service = data;
  const role = profile?.role;
  const isOwner = profile && service.vendorId === (profile._id ?? (profile as { id?: string }).id);
  const canBook = role === "customer" && !isOwner;
  const images = service.images.length ? service.images : [];
  const activeImage = images[galleryIndex] ?? images[0];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <button
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-soft hover:text-charcoal"
      >
        <ArrowLeft className="size-4" /> Back to browse
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-blush-100 bg-white">
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt={service.serviceName} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-blush-100 to-gold-100 font-display text-6xl text-blush-300">
                W
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={img}
                  onClick={() => setGalleryIndex(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-colors ${i === galleryIndex ? "border-blush-500" : "border-transparent"}`}
                  aria-label={`View photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-blush-100 bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{CATEGORY_LABELS[service.category] ?? service.category}</Badge>
              {service.status !== "approved" && <StatusBadge status={service.status} />}
              {!service.isActive && <Badge variant="muted">Paused</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{service.serviceName}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-charcoal-soft">
              <MapPin className="size-4 text-blush-500" /> {service.location}
            </p>
            <div className="mt-5 border-t border-blush-100 pt-5">
              <h2 className="text-sm font-bold tracking-wide uppercase">About this service</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-charcoal-soft">
                {service.description}
              </p>
            </div>
            {service.vendor && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-ivory p-4">
                {service.vendor.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.vendor.image} alt="" className="size-11 rounded-full object-cover" />
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-full bg-blush-600 font-bold text-white">
                    {(service.vendor.businessName || service.vendor.name || "V").charAt(0)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {service.vendor.businessName || service.vendor.name || "Vendor"}
                    {service.status === "approved" && <PremiumBadge className="ml-2 hidden" />}
                  </p>
                  <p className="text-xs text-charcoal-soft">Verified vendor</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-blush-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-charcoal-soft uppercase">Total price</p>
            <p className="mt-1 font-display text-4xl font-bold text-gold-700">{formatPrice(service.price)}</p>
            <div className="mt-5 border-t border-blush-100 pt-5">
              {!profile ? (
                <div className="flex flex-col gap-2">
                  <Link href={`/signin?redirect=/services/${service._id}`}>
                    <Button className="w-full" size="lg">
                      <CalendarCheck className="size-4" /> Sign in to book
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-charcoal-soft">Sign in as a customer to request this service.</p>
                </div>
              ) : canBook ? (
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full" onClick={() => setBookingOpen(true)}>
                    <CalendarCheck className="size-4" /> Request booking
                  </Button>
                  <p className="text-center text-xs text-charcoal-soft">Free to request · vendor confirms availability</p>
                </div>
              ) : isOwner ? (
                <div className="rounded-xl bg-gold-100 px-4 py-3 text-sm font-medium text-gold-700">
                  This is your own listing — booking your own service isn&apos;t allowed.
                </div>
              ) : role === "vendor" ? (
                <div className="rounded-xl bg-blush-50 px-4 py-3 text-sm text-charcoal-soft">
                  Vendor accounts can&apos;t book services. Browse for inspiration!
                </div>
              ) : (
                <div className="rounded-xl bg-blush-50 px-4 py-3 text-sm text-charcoal-soft">
                  Admin accounts can&apos;t book services.
                </div>
              )}
            </div>
            <dl className="mt-5 space-y-2 border-t border-blush-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal-soft">Category</dt>
                <dd className="font-medium">{CATEGORY_LABELS[service.category] ?? service.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal-soft">Location</dt>
                <dd className="font-medium">{service.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal-soft">Listed</dt>
                <dd className="font-medium">{formatDate(service.createdAt)}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-4 hidden rounded-2xl border border-blush-100 bg-blush-50/50 p-5 text-sm text-charcoal-soft lg:block">
            Tip: pick a date at least a few days out — popular vendors book up fast during wedding season.
          </div>
        </aside>
      </div>

      {profile && canBook && (
        <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} service={service} />
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { serviceSchema, type ServiceValues } from "@/lib/schemas";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUploader } from "@/components/ui/image-uploader";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ServiceForm({
  initial,
  serviceId,
}: {
  initial?: Partial<ServiceValues>;
  serviceId?: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ServiceValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      serviceName: initial?.serviceName ?? "",
      category: initial?.category ?? "venue",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      location: initial?.location ?? "",
      images: initial?.images ?? [],
    },
  });
  const images = form.watch("images") ?? [];

  async function onSubmit(values: ServiceValues) {
    setSubmitting(true);
    try {
      if (serviceId) {
        const changedKeys = (Object.keys(values) as (keyof ServiceValues)[]).filter((k) => {
          const next = values[k];
          const prev = initial?.[k];
          return JSON.stringify(next ?? null) !== JSON.stringify(prev ?? (k === "images" ? [] : null));
        });
        const imagesOnly = changedKeys.length > 0 && changedKeys.every((k) => k === "images");
        const body = imagesOnly ? { images: values.images } : values;
        await authed(`/vendor/services/${serviceId}`, { method: "PATCH", body });
        toast.success(
          imagesOnly
            ? "Photos updated — no review needed."
            : "Service updated. Key edits sent it back for review.",
        );
      } else {
        await authed("/vendor/services", { method: "POST", body: values });
        toast.success("Service created! It's now pending review.");
      }
      qc.invalidateQueries({ queryKey: ["vendor-services"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
      router.push("/dashboard/vendor/services");
    } catch (e) {
      if (e instanceof ApiError && e.code === "UPGRADE_REQUIRED") {
        toast.error("Free plan allows 3 active listings.", {
          action: { label: "Upgrade", onClick: () => router.push("/dashboard/vendor/subscription") },
        });
      } else if (e instanceof ApiError && e.details?.length) {
        for (const d of e.details) form.setError(d.path as never, { message: d.message });
        toast.error("Please fix the highlighted fields.");
      } else {
        toast.error(e instanceof Error ? e.message : "Could not save the service.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Field label="Service name" error={form.formState.errors.serviceName?.message} htmlFor="sf-name">
            <Input id="sf-name" placeholder="Grand Palace Hall" {...form.register("serviceName")} />
          </Field>
          <Field label="Category" error={form.formState.errors.category?.message}>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => form.setValue("category", c.value, { shouldValidate: true })}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                    form.watch("category") === c.value
                      ? "border-blush-500 bg-blush-50 text-blush-800"
                      : "border-blush-200 text-charcoal-soft hover:border-blush-300",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Description" error={form.formState.errors.description?.message} htmlFor="sf-desc">
            <Textarea id="sf-desc" rows={5} placeholder="Capacity, amenities, what's included…" {...form.register("description")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (৳)" error={form.formState.errors.price?.message} htmlFor="sf-price">
              <Input id="sf-price" type="number" min={0} step="1" {...form.register("price", { valueAsNumber: true })} />
            </Field>
            <Field label="Location" error={form.formState.errors.location?.message} htmlFor="sf-loc">
              <Input id="sf-loc" placeholder="Dhaka" {...form.register("location")} />
            </Field>
          </div>
          {serviceId && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              Heads up: changing the name, category, description, price or location will reset this
              listing to <strong>pending</strong> for re-moderation. Editing only images keeps the status.
            </p>
          )}
          <div className="flex gap-2">
            <Link href="/dashboard/vendor/services"><Button type="button" variant="outline">Cancel</Button></Link>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {serviceId ? "Save changes" : "Create service"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold">Photos</h3>
          <p className="mt-1 mb-3 text-xs text-charcoal-soft">JPG, PNG or WebP · max 2MB each · up to 10</p>
          <ImageUploader value={images} onChange={(urls) => form.setValue("images", urls, { shouldValidate: true })} />
          {form.formState.errors.images && (
            <p className="mt-2 text-xs font-medium text-red-600">{form.formState.errors.images.message}</p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

export default function NewServicePage() {
  const router = useRouter();
  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-soft hover:text-charcoal">
        <ArrowLeft className="size-4" /> Back
      </button>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Add a new service"
        description="New listings start as pending and go public once approved."
      />
      <ServiceForm />
    </div>
  );
}

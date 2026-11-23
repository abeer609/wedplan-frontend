"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authed } from "@/lib/api";
import { useProfile } from "@/hooks/use-auth";
import { profileSchema, type ProfileValues } from "@/lib/schemas";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ui/image-uploader";
import { EmptyState, PageLoader } from "@/components/ui/loaders";

function ProfileForm() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", image: "", businessName: "", phone: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        image: profile.image ?? "",
        businessName: profile.businessName ?? "",
        phone: profile.phone ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id]);

  const avatar = form.watch("image") ?? "";

  async function onSubmit(values: ProfileValues) {
    setSubmitting(true);
    try {
      await authed("/users/me", {
        method: "PATCH",
        body: {
          name: values.name,
          image: values.image,
          ...(profile?.role === "vendor" ? { businessName: values.businessName || "" } : {}),
          phone: values.phone || "",
        },
      });
      toast.success("Profile updated.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Field label="Full name" error={form.formState.errors.name?.message} htmlFor="pf-name">
            <Input id="pf-name" {...form.register("name")} />
          </Field>
          {profile?.role === "vendor" && (
            <Field label="Business name" error={form.formState.errors.businessName?.message} htmlFor="pf-biz">
              <Input id="pf-biz" placeholder="Your studio or brand" {...form.register("businessName")} />
            </Field>
          )}
          <Field label="Phone (optional)" error={form.formState.errors.phone?.message} htmlFor="pf-phone">
            <Input id="pf-phone" placeholder="+880 1XXX-XXXXXX" {...form.register("phone")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium">Role</p>
              <Badge variant="outline" className="capitalize">{profile?.role}</Badge>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Plan</p>
              <Badge variant={profile?.effectivePlan === "premium" ? "gold" : "muted"} className="capitalize">
                {profile?.effectivePlan}
              </Badge>
            </div>
          </div>
          <p className="-mt-1 text-xs text-charcoal-soft">Role and plan are managed by the platform and can&apos;t be changed here.</p>
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold">Profile photo</h3>
          <p className="mt-1 mb-3 text-xs text-charcoal-soft">Upload a new photo, then save.</p>
          <ImageUploader
            value={avatar ? [avatar] : []}
            onChange={(urls) => form.setValue("image", urls[0] ?? "", { shouldDirty: true })}
            max={1}
            multiple={false}
          />
          {form.formState.errors.image && (
            <p className="mt-2 text-xs font-medium text-red-600">{form.formState.errors.image.message}</p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

export function ProfileSettingsPage() {
  const { profile, isPending, error, refetch } = useProfile();

  if (isPending) return <PageLoader label="Loading profile…" />;
  if (error || !profile) {
    return (
      <EmptyState
        title="Couldn't load profile"
        message="Please try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={profile.role === "vendor" ? "Vendor dashboard" : "Customer dashboard"}
        title="Profile settings"
        description="Keep your name, photo and contact details up to date."
      />
      <ProfileForm />
    </div>
  );
}

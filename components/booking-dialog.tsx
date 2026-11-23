"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authed } from "@/lib/api";
import { bookingSchema, bookingToISO, type BookingValues } from "@/lib/schemas";
import { useProfile } from "@/hooks/use-auth";
import type { Service } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}) {
  const router = useRouter();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventDate: "",
      eventTime: "12:00",
      eventLocation: service.location,
      phone: "",
      message: "",
    },
  });

  useEffect(() => {
    if (profile?.phone && !form.getValues("phone")) {
      form.setValue("phone", profile.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  async function onSubmit(values: BookingValues) {
    const iso = bookingToISO(values.eventDate, values.eventTime);
    if (!iso) {
      toast.error("Please pick a future date and time.");
      return;
    }
    setSubmitting(true);
    try {
      await authed("/bookings", {
        method: "POST",
        body: {
          serviceId: service._id,
          eventDate: iso,
          eventLocation: values.eventLocation,
          phone: values.phone,
          message: values.message || undefined,
        },
      });
      toast.success("Booking request sent!");
      onOpenChange(false);
      router.push("/dashboard/customer/bookings");
    } catch (e) {
      if (e instanceof ApiError && e.code === "DUPLICATE") {
        toast.error("You already requested this service for that date.", {
          action: { label: "My bookings", onClick: () => router.push("/dashboard/customer/bookings") },
        });
      } else if (e instanceof ApiError && e.status === 404) {
        toast.error("This service is no longer available.");
      } else {
        toast.error(e instanceof Error ? e.message : "Booking failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request booking</DialogTitle>
          <DialogDescription>
            {service.serviceName} · pick your event date and the vendor will confirm.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event date" error={form.formState.errors.eventDate?.message} htmlFor="bd-date">
              <Input
                id="bd-date"
                type="date"
                min={todayPlus(1)}
                {...form.register("eventDate")}
              />
            </Field>
            <Field label="Time" error={form.formState.errors.eventTime?.message} htmlFor="bd-time">
              <Input id="bd-time" type="time" {...form.register("eventTime")} />
            </Field>
          </div>
          <Field label="Event location" error={form.formState.errors.eventLocation?.message} htmlFor="bd-loc">
            <Input id="bd-loc" placeholder="Venue / hall name" {...form.register("eventLocation")} />
          </Field>
          <Field
            label="Phone number"
            hint="The vendor will use this to contact you."
            error={form.formState.errors.phone?.message}
            htmlFor="bd-phone"
          >
            <Input
              id="bd-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+880 1XXX-XXXXXX"
              {...form.register("phone")}
            />
          </Field>
          <Field label="Message (optional)" error={form.formState.errors.message?.message} htmlFor="bd-msg">
            <Textarea
              id="bd-msg"
              placeholder="Tell the vendor about your event…"
              {...form.register("message")}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

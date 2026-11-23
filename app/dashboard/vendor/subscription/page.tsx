"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authed } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

interface SubState {
  plan: "free" | "premium";
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
}

const PREMIUM_PERKS = [
  "Unlimited active listings (free plan: 3)",
  "Premium badge on all your services",
  "Priority placement in browse results",
  "Manage or cancel anytime via Stripe portal",
];

export default function SubscriptionPage() {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => authed<{ data: SubState }>("/subscriptions/me").then((r) => r.data),
  });

  async function checkout() {
    setCheckoutBusy(true);
    try {
      const json = await authed<{ data: { url: string; sessionId: string } }>("/subscriptions/checkout", {
        method: "POST",
      });
      window.location.href = json.data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout.");
      setCheckoutBusy(false);
    }
  }

  async function portal() {
    setPortalBusy(true);
    try {
      const json = await authed<{ data: { url: string } }>("/subscriptions/portal", { method: "POST" });
      window.location.href = json.data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the billing portal.");
      setPortalBusy(false);
    }
  }

  if (isPending) return <PageLoader label="Loading subscription…" />;
  if (isError || !data) {
    return (
      <EmptyState
        title="Couldn't load subscription"
        message="Please try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const premium = data.plan === "premium";
  const expiry = data.subscriptionExpiresAt
    ? new Date(data.subscriptionExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="Vendor dashboard"
        title="Subscription"
        description="Free gives you 3 active listings. Premium unlocks unlimited listings and priority placement."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Card className={cn("p-6", !premium && "ring-2 ring-blush-400")}>
          <h3 className="font-display text-xl font-semibold">Free</h3>
          <p className="mt-1 font-display text-3xl font-bold">৳0 <span className="text-sm font-normal text-charcoal-soft">forever</span></p>
          <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
            <li className="flex gap-2"><Check className="size-4 text-emerald-600" /> 3 active listings</li>
            <li className="flex gap-2"><Check className="size-4 text-emerald-600" /> Receive booking requests</li>
            <li className="flex gap-2"><Check className="size-4 text-emerald-600" /> Basic profile</li>
          </ul>
          {!premium && (
            <p className="mt-5 rounded-xl bg-blush-50 px-4 py-3 text-sm font-semibold text-blush-800">Current plan</p>
          )}
        </Card>
        <Card className={cn("p-6", premium ? "border-gold-300 ring-2 ring-gold-500" : "border-gold-300/60")}>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Crown className="size-5 text-gold-500" /> Premium
          </h3>
          <p className="mt-1 font-display text-3xl font-bold text-gold-700">Premium <span className="text-sm font-normal text-charcoal-soft">via Stripe</span></p>
          <ul className="mt-4 space-y-2 text-sm text-charcoal-soft">
            {PREMIUM_PERKS.map((p) => (
              <li key={p} className="flex gap-2"><Check className="size-4 text-gold-500" /> {p}</li>
            ))}
          </ul>
          {premium ? (
            <div className="mt-5 flex flex-col gap-2">
              <p className="rounded-xl bg-gold-100 px-4 py-3 text-sm font-semibold text-gold-700">
                Premium active{expiry ? ` · renews ${expiry}` : ""}
              </p>
              {data.stripeCustomerId && (
                <Button variant="outline" onClick={portal} disabled={portalBusy}>
                  {portalBusy && <Loader2 className="size-4 animate-spin" />}
                  Manage billing <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <Button variant="gold" className="mt-5 w-full" size="lg" onClick={checkout} disabled={checkoutBusy}>
              {checkoutBusy && <Loader2 className="size-4 animate-spin" />}
              Upgrade to Premium
            </Button>
          )}
        </Card>
      </div>
      {!premium && (
        <p className="mt-4 text-center text-xs text-charcoal-soft">
          Secure checkout by Stripe. Premium is activated automatically after payment via webhook — it can take a minute.
        </p>
      )}
      {premium && (
        <p className="mt-4 text-center text-xs text-charcoal-soft">
          If premium lapses, your listings stay — but creating or reactivating beyond the 3 free slots will be blocked until you renew.
        </p>
      )}
    </div>
  );
}

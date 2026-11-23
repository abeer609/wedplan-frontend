"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Hourglass } from "lucide-react";
import { authed } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<"checking" | "confirmed" | "pending">("checking");

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    const timer = setInterval(() => {
      void (async () => {
        attempts += 1;
        try {
          const json = await authed<{ data: { plan: string } }>("/subscriptions/me");
          if (!cancelled && json.data.plan === "premium") {
            setState("confirmed");
            clearInterval(timer);
            return;
          }
        } catch {
          /* keep polling until timeout */
        }
        if (attempts >= 15 && !cancelled) {
          setState("pending");
          clearInterval(timer);
        }
      })();
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8">
          {state === "confirmed" ? (
            <>
              <CheckCircle2 className="size-14 text-emerald-600" />
              <h1 className="font-display text-2xl font-bold">Premium activated!</h1>
              <p className="text-sm text-charcoal-soft">
                Your payment went through and Premium is live on your account. Enjoy unlimited listings!
              </p>
              <Link href="/dashboard/vendor/subscription" className="mt-2"><Button>Go to subscription</Button></Link>
            </>
          ) : state === "pending" ? (
            <>
              <Hourglass className="size-14 text-gold-500" />
              <h1 className="font-display text-2xl font-bold">Payment received — activation pending</h1>
              <p className="text-sm text-charcoal-soft">
                Webhooks can lag a little. Your Premium will activate automatically; check back on the
                subscription page in a minute.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>Check again</Button>
                <Link href="/dashboard/vendor/subscription"><Button>Subscription page</Button></Link>
              </div>
            </>
          ) : (
            <>
              <Hourglass className="size-14 animate-pulse text-blush-400" />
              <h1 className="font-display text-2xl font-bold">Confirming your payment…</h1>
              <p className="text-sm text-charcoal-soft">
                {sessionId ? `Session ${sessionId.slice(0, 12)}… · ` : ""}Waiting for Stripe to confirm. This usually
                takes a few seconds — don&apos;t close this page.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ApiError, authed } from "@/lib/api";
import { useProfile, roleHome } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isPending } = useProfile();
  const [busy, setBusy] = useState<"customer" | "vendor" | null>(null);

  useEffect(() => {
    if (!isPending && profile?.roleSelected && profile?.role) {
      const redirect = searchParams.get("redirect");
      router.replace(redirect && redirect.startsWith("/") ? redirect : roleHome(profile.role));
    }
  }, [isPending, profile, router, searchParams]);

  async function pick(role: "customer" | "vendor") {
    setBusy(role);
    try {
      await authed("/users/me/onboarding-role", { method: "PATCH", body: { role } });
      toast.success(role === "vendor" ? "Welcome aboard, vendor!" : "Let's plan your wedding!");
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : roleHome(role));
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_SELECTED") {
        router.push(roleHome(profile?.role ?? role));
        return;
      }
      toast.error(e instanceof Error ? e.message : "Could not save your choice.");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await authClient.signOut();
    router.push("/");
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-8 animate-spin text-blush-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>How will you use WedPlan?</CardTitle>
        <CardDescription>Pick one — this helps us show you the right dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(
          [
            { role: "customer" as const, title: "I'm planning a wedding", text: "Browse vendors and book services for your big day." },
            { role: "vendor" as const, title: "I'm a wedding vendor", text: "List services, receive bookings and grow your business." },
          ]
        ).map((o) => (
          <button
            key={o.role}
            onClick={() => pick(o.role)}
            disabled={busy !== null}
            className={cn(
              "rounded-2xl border-2 p-5 text-left transition-all",
              "border-blush-200 bg-white hover:border-blush-400 hover:bg-blush-50/50",
            )}
          >
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              {busy === o.role && <Loader2 className="size-4 animate-spin" />}
              {o.title}
            </p>
            <p className="mt-1 text-sm text-charcoal-soft">{o.text}</p>
          </button>
        ))}
        <div className="mt-2 flex items-center justify-between text-sm">
          <Link href="/" className="text-charcoal-soft hover:text-charcoal">Back to home</Link>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Suspense>
        <OnboardingForm />
      </Suspense>
    </main>
  );
}

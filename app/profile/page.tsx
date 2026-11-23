"use client";

import Link from "next/link";
import { useProfile, useSessionUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loaders";
import { ProfileSettingsPage } from "@/components/profile-settings";

export default function StandaloneProfilePage() {
  const { user, isPending } = useSessionUser();
  const { profile, isPending: profilePending } = useProfile();

  if (isPending || profilePending) return <PageLoader label="Loading profile…" />;
  if (!user || !profile) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in required</h1>
        <p className="text-sm text-charcoal-soft">Please sign in to manage your profile.</p>
        <Link href="/signin?redirect=/profile"><Button>Sign in</Button></Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <ProfileSettingsPage />
    </main>
  );
}

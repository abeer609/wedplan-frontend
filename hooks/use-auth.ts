"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ApiError, authed } from "@/lib/api";
import type { BackendUser, Role } from "@/lib/constants";

export function useSession() {
  return authClient.useSession();
}

export function useSessionUser() {
  const { data, isPending } = authClient.useSession();
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isPending,
  };
}

export function useProfile() {
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: () => authed<{ data: BackendUser }>("/users/me").then((r) => r.data),
    enabled: !!sessionData?.user,
    retry: false,
  });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const err = query.error;
    if (err instanceof ApiError && err.status === 403 && err.code === "ACCOUNT_BLOCKED") {
      toast.error("Your account has been blocked.");
      authClient.signOut().finally(() => router.push("/signin?blocked=1"));
    } else if (err instanceof ApiError && err.status === 401) {
      authClient.signOut({ fetchOptions: { onSuccess: () => router.push(`/signin?redirect=${pathname}`) } });
    } else if (
      err instanceof ApiError &&
      err.status === 403 &&
      (pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/vendor") ||
        pathname.startsWith("/dashboard/customer"))
    ) {
      const role = query.data?.role;
      toast.error("You don't have access to that section.");
      router.replace(role ? roleHome(role) : "/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.error]);

  return {
    profile: query.data ?? null,
    role: (query.data?.role ?? null) as Role | null,
    isPending: sessionPending || query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function roleHome(role: Role) {
  return role === "admin" ? "/dashboard/admin" : role === "vendor" ? "/dashboard/vendor" : "/dashboard/customer";
}

export function postLoginTarget(role: Role, redirect: string | null) {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    if (redirect.startsWith("/dashboard/admin") && role !== "admin") return roleHome(role);
    return redirect;
  }
  return roleHome(role);
}

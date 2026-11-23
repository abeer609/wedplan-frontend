import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type GuardRole = "customer" | "vendor" | "admin";

async function getSessionFromHeaders() {
  const h = await headers();
  try {
    const session = await auth.api.getSession({ headers: h });
    return session;
  } catch {
    return null;
  }
}

export async function requireRole(allowed: GuardRole[]) {
  const session = await getSessionFromHeaders();
  if (!session?.user) redirect("/signin");
  const role = (session.user as { role?: string }).role ?? "customer";
  if (!allowed.includes(role as GuardRole)) {
    if (role === "admin") redirect("/dashboard/admin");
    if (role === "vendor") redirect("/dashboard/vendor");
    redirect("/dashboard/customer");
  }
  return { session, role: role as GuardRole };
}

export async function requireAnySession(redirectTo?: string) {
  const session = await getSessionFromHeaders();
  if (!session?.user) redirect(redirectTo ?? "/signin");
  return session;
}

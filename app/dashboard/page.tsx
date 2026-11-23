import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardIndex() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h }).catch(() => null);
  if (!session?.user) redirect("/signin?redirect=/dashboard");
  const role = (session.user as { role?: string }).role ?? "customer";
  redirect(
    role === "admin" ? "/dashboard/admin" : role === "vendor" ? "/dashboard/vendor" : "/dashboard/customer",
  );
}

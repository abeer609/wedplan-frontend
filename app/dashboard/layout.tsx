import { requireAnySession } from "@/lib/guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAnySession("/signin?redirect=/dashboard");
  return <>{children}</>;
}

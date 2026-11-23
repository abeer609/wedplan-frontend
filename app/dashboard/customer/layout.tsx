import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/guard";

export default async function CustomerSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["customer"]);
  return <DashboardShell role="customer">{children}</DashboardShell>;
}

import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/guard";

export default async function VendorSectionLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["vendor"]);
  return <DashboardShell role="vendor">{children}</DashboardShell>;
}

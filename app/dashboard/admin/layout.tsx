import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/guard";

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  return <DashboardShell role="admin">{children}</DashboardShell>;
}

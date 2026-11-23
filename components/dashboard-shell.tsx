"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenCheck,
  CalendarClock,
  CreditCard,
  Crown,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Store,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useProfile, useSessionUser } from "@/hooks/use-auth";
import { roleHome } from "@/hooks/use-auth";
import type { Role } from "@/lib/constants";
import { Logo } from "@/components/ui/brand";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  customer: [
    { href: "/dashboard/customer", label: "Overview", icon: LayoutGrid, exact: true },
    { href: "/dashboard/customer/bookings", label: "My Bookings", icon: BookOpenCheck },
    { href: "/dashboard/customer/profile", label: "Profile", icon: Settings },
  ],
  vendor: [
    { href: "/dashboard/vendor", label: "Overview", icon: LayoutGrid, exact: true },
    { href: "/dashboard/vendor/services", label: "My Services", icon: Store },
    { href: "/dashboard/vendor/bookings", label: "Bookings", icon: CalendarClock },
    { href: "/dashboard/vendor/subscription", label: "Subscription", icon: Crown },
    { href: "/dashboard/vendor/profile", label: "Profile", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutGrid, exact: true },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/services", label: "Services", icon: Store },
    { href: "/dashboard/admin/transactions", label: "Transactions", icon: Wallet },
  ],
};

const ROLE_ACCENT: Record<Role, string> = {
  customer: "bg-blush-600",
  vendor: "bg-gold-500",
  admin: "bg-stone-700",
};

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSessionUser();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const items = NAV[role];

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="px-5 pt-5 pb-2" onClick={() => setOpen(false)}>
        <Logo />
      </Link>
      <p className="px-5 pt-3 pb-1">
        <Badge variant={role === "admin" ? "muted" : role === "vendor" ? "gold" : "default"} className="capitalize">
          {role} dashboard
        </Badge>
      </p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Dashboard">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blush-100 text-blush-800"
                  : "text-charcoal-soft hover:bg-blush-50 hover:text-charcoal",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-blush-100 p-4">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-blush-50">
          <Home className="size-4.5" /> Back to site
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="size-4.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-blush-100 bg-white lg:block">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-blush-50"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-3 border-b border-blush-100 bg-white px-4 py-3 sm:px-8`}>
          <button
            className="rounded-full p-2 hover:bg-blush-50 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
          <span className={cn("size-2.5 rounded-full", ROLE_ACCENT[role])} aria-hidden="true" />
          <p className="truncate text-sm font-medium">
            {profile?.name || user?.name || "Dashboard"}
            {role === "vendor" && profile?.effectivePlan === "premium" && (
              <Badge variant="gold" className="ml-2"><Crown className="size-3" /> Premium</Badge>
            )}
          </p>
          <span className="ml-auto hidden items-center gap-1 text-xs text-charcoal-soft sm:flex">
            <CreditCard className="size-3.5" />
            {role === "customer" ? "Customer" : role === "vendor" ? "Vendor" : "Admin"}
          </span>
        </div>
        <div className="px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </div>
  );
}

export { roleHome };

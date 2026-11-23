"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Menu, Settings, User, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useProfile, roleHome, useSessionUser } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export function Navbar() {
  const { user, isPending } = useSessionUser();
  const { role } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await authClient.signOut();
    setMenuOpen(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-blush-100 bg-ivory/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="WedPlan home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-blush-100 text-blush-800"
                  : "text-charcoal-soft hover:bg-blush-50 hover:text-charcoal",
              )}
            >
              {l.label}
            </Link>
          ))}
          {user && role && (
            <Link
              href={roleHome(role)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard")
                  ? "bg-blush-100 text-blush-800"
                  : "text-charcoal-soft hover:bg-blush-50 hover:text-charcoal",
              )}
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-blush-100" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-blush-200 bg-white py-1 pr-3 pl-1 transition-colors hover:border-blush-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name} className="size-8 rounded-full object-cover" />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-blush-600 text-sm font-bold text-white">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-28 truncate text-sm font-medium">{user.name}</span>
              </button>
              {menuOpen && (
                <>
                  <button
                    aria-label="Close menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-blush-100 bg-white py-1.5 shadow-xl" role="menu">
                    <div className="border-b border-blush-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-charcoal-soft">{user.email}</p>
                    </div>
                    {role && (
                      <Link
                        href={roleHome(role)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-blush-50"
                      >
                        <LayoutDashboard className="size-4 text-charcoal-soft" /> Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-blush-50"
                    >
                      <Settings className="size-4 text-charcoal-soft" /> Profile Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-full p-2.5 text-charcoal hover:bg-blush-50 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-blush-100 bg-ivory px-4 pt-2 pb-5 md:hidden">
          {[...PUBLIC_LINKS, ...(user && role ? [{ href: roleHome(role), label: "Dashboard" }] : [])].map(
            (l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-blush-50"
              >
                {l.label === "Dashboard" ? <LayoutDashboard className="size-4" /> : <Heart className="size-4" />}
                {l.label}
              </Link>
            ),
          )}
          <div className="mt-3 flex flex-col gap-2 border-t border-blush-100 pt-3">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <User className="size-4" /> Profile Settings
                  </Button>
                </Link>
                <Button variant="destructive" className="w-full" onClick={logout}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

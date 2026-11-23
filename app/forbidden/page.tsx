import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleHome } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForbiddenPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h }).catch(() => null);
  if (!session?.user) redirect("/signin?redirect=/dashboard");
  const role = ((session.user as { role?: string }).role ?? "customer") as
    | "customer"
    | "vendor"
    | "admin";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8">
          <ShieldAlert className="size-14 text-amber-500" />
          <h1 className="font-display text-2xl font-bold">Not allowed</h1>
          <p className="text-sm text-charcoal-soft">
            You&apos;re signed in as a {role}, and that section belongs to a different role.
          </p>
          <Link href={roleHome(role)} className="mt-2">
            <Button>Go to my dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

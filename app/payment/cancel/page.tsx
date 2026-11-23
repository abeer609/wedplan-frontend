import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8">
          <XCircle className="size-14 text-charcoal-soft" />
          <h1 className="font-display text-2xl font-bold">Checkout cancelled</h1>
          <p className="text-sm text-charcoal-soft">
            No worries — nothing was charged. You&apos;re still on the Free plan with 3 active listings.
          </p>
          <div className="mt-2 flex gap-2">
            <Link href="/dashboard/vendor/subscription"><Button>Back to subscription</Button></Link>
            <Link href="/dashboard/vendor"><Button variant="outline">Dashboard</Button></Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

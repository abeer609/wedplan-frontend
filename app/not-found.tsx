import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-blush-300">404</p>
      <h1 className="font-display text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-charcoal-soft">
        The page you&apos;re looking for moved, or the listing isn&apos;t public.
      </p>
      <div className="mt-2 flex gap-2">
        <Link href="/"><Button>Go home</Button></Link>
        <Link href="/services"><Button variant="outline">Browse services</Button></Link>
      </div>
    </main>
  );
}

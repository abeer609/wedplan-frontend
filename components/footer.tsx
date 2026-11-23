import Link from "next/link";
import { Camera, AtSign, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { Logo } from "@/components/ui/brand";

const BUILD_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-blush-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal-soft">
            WedPlan brings Bangladesh&apos;s finest wedding vendors together — venues,
            catering, photography, decoration, music and makeup — so you can plan your
            big day beautifully, all in one place.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { icon: Camera, label: "Instagram" },
              { icon: AtSign, label: "Threads" },
              { icon: Share2, label: "Share" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex size-10 items-center justify-center rounded-full bg-blush-50 text-blush-600 transition-colors hover:bg-blush-100"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-charcoal uppercase">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-charcoal-soft">
            <li><Link href="/" className="hover:text-blush-600">Home</Link></li>
            <li><Link href="/services" className="hover:text-blush-600">Browse services</Link></li>
            <li><Link href="/signup" className="hover:text-blush-600">Become a vendor</Link></li>
            <li><Link href="/signin" className="hover:text-blush-600">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-charcoal uppercase">Contact</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-charcoal-soft">
            <li className="flex items-center gap-2"><Mail className="size-4 text-blush-500" /> hello@wedplan.com</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-blush-500" /> +880 1XXX-XXXXXX</li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-blush-500" /> Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-blush-100 py-5 text-center text-xs text-charcoal-soft">
        © {BUILD_YEAR} WedPlan. Crafted with love for beautiful weddings.
      </div>
    </footer>
  );
}

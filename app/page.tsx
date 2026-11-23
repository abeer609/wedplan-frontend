"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BadgeCheck, CalendarCheck, HeartHandshake, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Service } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/page-header";
import { CategoryCard, ServiceCard } from "@/components/services";
import { ServiceGridSkeleton } from "@/components/ui/loaders";
import { CATEGORIES } from "@/lib/constants";
import { useSessionUser } from "@/hooks/use-auth";

const CATEGORY_IMAGES: Record<string, string> = {
  venue: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80",
  catering: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
  photography: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80",
  decoration: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80",
  music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
  makeup: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
};

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { user, isPending: sessionPending } = useSessionUser();
  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: () => api<{ data: Service[] }>("/services/featured?limit=8").then((r) => r.data),
  });

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
            alt="Newlywed couple celebrating at their wedding"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/75 via-charcoal/45 to-charcoal/15" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-28 sm:px-6 sm:py-36"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur">
            <Sparkles className="size-3.5 text-gold-300" /> Bangladesh&apos;s wedding marketplace
          </span>
          <h1 className="max-w-2xl font-display text-4xl leading-tight font-bold text-white sm:text-6xl">
            Every vendor for your big day, in one beautiful place
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            From dreamy venues to the perfect playlist — discover and book trusted
            wedding professionals across the country.
          </p>
          <Link href="/services">
            <Button size="lg" variant="gold" className="shadow-xl">
              Explore Wedding Services <ArrowRight className="size-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <SectionHeader
            eyebrow="Featured"
            title="Handpicked services for you"
            description="A curated selection of top-rated venues, photographers, caterers and more."
          />
        </Reveal>
        {featured.isPending ? (
          <ServiceGridSkeleton count={8} />
        ) : featured.isError || !featured.data?.length ? (
          <div className="rounded-2xl border border-dashed border-blush-200 bg-white/60 px-6 py-12 text-center">
            <p className="text-sm text-charcoal-soft">
              {featured.isError
                ? `Featured services couldn't load (${featured.error instanceof Error ? featured.error.message : "network error"}).`
                : "No featured services yet — check back soon."}{" "}
              <Link href="/services" className="font-semibold text-blush-700 underline">
                Browse all services
              </Link>
              .
            </p>
            {featured.isError && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => featured.refetch()}>
                Try again
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.data.map((s, i) => (
              <Reveal key={s._id} delay={Math.min(i * 0.08, 0.4)}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        )}
        <Reveal className="mt-8 text-center">
          <Link href="/services">
            <Button variant="outline" size="lg">
              View all services <ArrowRight className="size-4" />
            </Button>
          </Link>
        </Reveal>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              centered
              eyebrow="Categories"
              title="Plan every detail"
              description="Six essentials, hundreds of trusted vendors. Start with what matters most."
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.value} delay={Math.min(i * 0.08, 0.4)}>
                <CategoryCard
                  value={c.value}
                  label={c.label}
                  blurb={c.blurb}
                  image={CATEGORY_IMAGES[c.value]}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <SectionHeader
            centered
            eyebrow="Why WedPlan"
            title="Why couples choose WedPlan"
            description="Planning a wedding is hard enough. Finding vendors shouldn't be."
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Everything in one place",
              text: "Search venues, catering, photo, décor, music and makeup with smart filters — no more endless Facebook scrolling.",
            },
            {
              icon: BadgeCheck,
              title: "Reviewed & approved vendors",
              text: "Every listing is reviewed by our team before it goes public, so you book with confidence.",
            },
            {
              icon: CalendarCheck,
              title: "Effortless booking",
              text: "Request dates in seconds, track every booking status, and get notified as vendors respond.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-blush-100 bg-white p-7 shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-full bg-blush-100 text-blush-700">
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-charcoal py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              centered
              eyebrow="How it works"
              title="From search to celebration in three steps"
              description=""
            />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { step: "01", title: "Discover", text: "Browse curated vendors by category, location and budget." },
              { step: "02", title: "Book", text: "Send a booking request with your event date and details." },
              { step: "03", title: "Celebrate", text: "Track confirmations and enjoy a stress-free wedding day." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.1}>
                <div className="rounded-2xl bg-white/5 p-7 ring-1 ring-white/10">
                  <p className="font-display text-4xl font-bold text-gold-300">{s.step}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            {sessionPending ? null : user ? (
              <Link href="/services">
                <Button size="lg" className="gap-2">
                  <Search className="size-4" /> Browse services
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  <HeartHandshake className="size-4" /> Start planning today
                </Button>
              </Link>
            )}
          </Reveal>
        </div>
      </section>
    </main>
  );
}


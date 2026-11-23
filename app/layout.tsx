import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "WedPlan — Wedding Services, Beautifully Planned", template: "%s · WedPlan" },
  description:
    "Discover venues, catering, photography, decoration, music and makeup for your big day. Book trusted wedding vendors in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ivory text-charcoal">
        <Providers>
          <Suspense>
            <Navbar />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

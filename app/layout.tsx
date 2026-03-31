import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans, Geist } from "next/font/google";

import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ohlone Language Atlas",
    template: "%s | Ohlone Language Atlas",
  },
  description:
    "A respectful, mobile-first web app for exploring Ohlone dictionary data, audio, pronunciation, and language support across Mutsun, Chochenyo, and OCEN Rumsen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        displayFont.variable,
        bodyFont.variable,
        geist.variable,
        "font-sans",
      )}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <div className="app-grain fixed inset-0 -z-10 opacity-40" aria-hidden="true" />
        <SiteHeader />
        <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[90rem] flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}

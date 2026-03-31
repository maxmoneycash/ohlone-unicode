"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Overview" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/tts", label: "Text to Speech" },
  { href: "/builder", label: "Sentence Builder" },
  { href: "/practice", label: "Practice" },
  { href: "/assistant", label: "Claude Guide" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 pb-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="small-label text-[var(--color-ochre)]">
              Ohlone Language Preservation
            </div>
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-3xl leading-none text-[var(--color-parchment)] sm:text-4xl"
            >
              Ohlone Language Atlas
            </Link>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-mist)] text-pretty">
              A dictionary-first learning and listening tool for Mutsun,
              Chochenyo, and OCEN Rumsen.
            </p>
          </div>

          <Badge
            variant="outline"
            className="w-fit border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] px-3 py-1 text-[11px] text-[var(--color-mist)]"
          >
            Verified corpus · 214 entries · 201 archived WAV files
          </Badge>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Primary">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]"
                    : "border-border bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-parchment)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

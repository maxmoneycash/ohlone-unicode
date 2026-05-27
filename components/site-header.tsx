"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation: Array<{ href: string; label: string }> = [
  { href: "/", label: "Learn" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/practice", label: "Practice" },
  { href: "/assistant", label: "Guide" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 pb-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="small-label text-[var(--color-ochre)]">
              Ohlone Language Learning
            </div>
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-3xl leading-none text-[var(--color-parchment)] sm:text-4xl"
            >
              Ohlone Language Atlas
            </Link>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-mist)] text-pretty">
              A Chochenyo-first learning tool with source-backed words,
              pronunciation, and practice.
            </p>
          </div>
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

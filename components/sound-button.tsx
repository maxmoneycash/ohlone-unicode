"use client";

import { cn } from "@/lib/utils";

type SoundButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function SoundButton({
  label,
  onClick,
  active = false,
  disabled = false,
  className,
}: SoundButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]"
          : "border-[var(--color-border)] bg-[var(--color-night-2)] text-[var(--color-mist)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-parchment)]",
        className,
      )}
    >
      {label}
    </button>
  );
}

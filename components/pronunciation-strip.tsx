"use client";

import { motion } from "motion/react";

import type { OrthographySegment } from "@/lib/orthography";
import { cn } from "@/lib/utils";

type PronunciationStripProps = {
  segments: OrthographySegment[];
  activeIndex?: number | null;
  compact?: boolean;
};

export function PronunciationStrip({
  segments,
  activeIndex = null,
  compact = false,
}: PronunciationStripProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment, index) => {
        const active = index === activeIndex;

        return (
          <motion.span
            key={`${segment.source}-${index}`}
            animate={{
              opacity: active ? 1 : 0.78,
              y: active ? -2 : 0,
              scale: active ? 1.02 : 1,
            }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
              compact ? "text-xs" : "text-sm",
              active
                ? "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]"
                : "border-[var(--color-border)] bg-[var(--color-night-2)] text-[var(--color-mist)]",
            )}
          >
            <span className="ohlone-body font-medium text-[var(--color-parchment)]">
              {segment.source}
            </span>
            <span className="font-mono text-[0.78rem] text-[var(--color-green)]">
              /{segment.ipa}/
            </span>
          </motion.span>
        );
      })}
    </div>
  );
}

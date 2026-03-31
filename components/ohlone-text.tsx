"use client";

import { CASE_PHONEMES, type Variety } from "@/lib/orthography";
import { cn } from "@/lib/utils";

type OhloneTextProps = {
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  text: string;
  variety: Variety;
  className?: string;
};

export function OhloneText({
  as = "span",
  text,
  variety,
  className,
}: OhloneTextProps) {
  const Component = as;
  const phonemes = new Set(CASE_PHONEMES[variety]);

  return (
    <Component className={cn("ohlone-body text-balance", className)}>
      {Array.from(text).map((character, index) => {
        if (character === "\n") {
          return <br key={`${character}-${index}`} />;
        }

        if (character === " ") {
          return " ";
        }

        if (!phonemes.has(character)) {
          return <span key={`${character}-${index}`}>{character}</span>;
        }

        return (
          <span
            key={`${character}-${index}`}
            className="relative inline-block rounded px-[0.06em] font-semibold text-[var(--color-ochre)] before:absolute before:bottom-[0.05em] before:left-[0.08em] before:right-[0.08em] before:h-px before:bg-[var(--color-ochre)]"
          >
            {character}
          </span>
        );
      })}
    </Component>
  );
}

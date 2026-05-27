"use client";

import { useState } from "react";
import Link from "next/link";

import type { AudioReference } from "@/lib/ohlone-data";
import {
  CASE_PHONEMES,
  segmentWord,
  type Variety,
} from "@/lib/orthography";
import { OhloneText } from "@/components/ohlone-text";
import { PronunciationStrip } from "@/components/pronunciation-strip";
import { useAudioPlayer } from "@/components/use-audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export const ALL_VARIETIES = "All varieties";

export type LearnerDictionaryEntry = {
  id: number;
  word: string;
  english: string;
  ipaResolved: string;
  pos: string | null;
  variety: Variety;
  source: string | null;
  page_ref: string | null;
  notes: string | null;
  example_mutsun: string | null;
  example_english: string | null;
  meanings: string[];
  audio: AudioReference | null;
};

type DictionaryBrowserProps = {
  entries: LearnerDictionaryEntry[];
  varieties: Variety[];
  query: string;
  selectedVariety: Variety | typeof ALL_VARIETIES;
  totalMatches: number;
  resultLimit: number;
};

function resultLabel(count: number) {
  return `${count} ${count === 1 ? "entry" : "entries"}`;
}

function varietyClasses(variety: Variety) {
  if (variety === "Chochenyo") {
    return "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]";
  }

  return "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]";
}

export function DictionaryBrowser({
  entries,
  varieties,
  query,
  selectedVariety,
  totalMatches,
  resultLimit,
}: DictionaryBrowserProps) {
  const [selectedEntry, setSelectedEntry] = useState<LearnerDictionaryEntry | null>(null);
  const { activeId, error, playSource } = useAudioPlayer();
  const isChochenyo = selectedVariety === "Chochenyo";

  return (
    <div className="grid gap-6">
      <section className="section-shell space-y-4 border-[var(--color-border-strong)]">
        <div className="small-label">{isChochenyo ? "Chochenyo Dictionary" : "Dictionary"}</div>
        <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
          {isChochenyo ? "Learn Chochenyo words with audio first." : "Find a word and hear how it sounds."}
        </h1>
        <p className="body-copy max-w-3xl">
          Chochenyo is the default focus. Search by English meaning or Ohlone
          spelling, then open a word for pronunciation, source notes, and examples.
        </p>
      </section>

      <section className="section-shell space-y-4">
        <form
          action="/dictionary"
          className="grid gap-4 lg:grid-cols-[1fr_16rem_auto_auto] lg:items-end"
        >
          <label className="grid gap-2">
            <span className="small-label">Search</span>
            <Input
              name="query"
              defaultValue={query}
              placeholder="Try language, good, family, makkin"
              className="h-11 border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-[var(--color-parchment)] placeholder:text-[var(--color-copy-dim)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="small-label">Variety</span>
            <select
              name="variety"
              defaultValue={selectedVariety}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-parchment)]"
            >
              <option>{ALL_VARIETIES}</option>
              {varieties.map((variety) => (
                <option key={variety}>{variety}</option>
              ))}
            </select>
          </label>

          <Button type="submit" className="h-11">
            Search
          </Button>
          <Link
            href="/dictionary"
            className="flex h-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
          >
            Reset
          </Link>
        </form>

        <p className="text-sm leading-6 text-[var(--color-copy-dim)]">
          {resultLabel(totalMatches)}
          {totalMatches > resultLimit
            ? ` found. Showing ${entries.length}; narrow the search to see fewer.`
            : " found."}
        </p>

        {error ? (
          <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
            {error}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4">
        {entries.length === 0 ? (
          <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
            <CardHeader>
              <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
                No entries match that search.
              </CardTitle>
              <CardDescription className="body-copy">
                Try a simpler English meaning or reset to the Chochenyo starter list.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {entries.map((entry) => {
          const entryId = `entry-${entry.id}`;
          const leadMeaning = entry.meanings[0] ?? entry.english;
          const extraMeanings = entry.meanings.slice(1);
          const casePhonemes = CASE_PHONEMES[entry.variety];

          return (
            <Card key={entry.id} className="border-[var(--color-border)] bg-card py-0">
              <CardHeader className="gap-3 border-b border-border/80 pb-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={varietyClasses(entry.variety)}>
                    {entry.variety}
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                    {entry.audio ? "Archived audio" : "No audio yet"}
                  </Badge>
                  {entry.pos ? (
                    <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                      {entry.pos}
                    </Badge>
                  ) : null}
                </div>
                <CardAction className="flex gap-2">
                  <Button
                    aria-label={`Play ${entry.word}`}
                    disabled={!entry.audio}
                    onClick={() =>
                      void playSource({
                        id: entryId,
                        url: entry.audio?.url,
                        speechText: entry.word,
                      })
                    }
                  >
                    {entry.audio ? (activeId === entryId ? "Playing" : "Play") : "No audio"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    Details
                  </Button>
                </CardAction>
                <CardTitle className="space-y-3">
                  <OhloneText
                    as="h2"
                    text={entry.word}
                    variety={entry.variety}
                    className="text-3xl text-[var(--color-parchment)] sm:text-4xl"
                  />
                  <p className="text-xl leading-8 text-[var(--color-parchment)]">
                    {leadMeaning}
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <p className="body-copy">{entry.english}</p>
                  {extraMeanings.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extraMeanings.map((meaning) => (
                        <Badge
                          key={`${entry.id}-${meaning}`}
                          variant="outline"
                          className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"
                        >
                          {meaning}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-sm leading-6 text-[var(--color-copy-dim)]">
                    {entry.source ?? "Source not listed"}
                  </p>
                </div>

                <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
                  <div>
                    <div className="small-label">IPA</div>
                    <p className="mt-2 font-mono text-lg text-[var(--color-green)]">
                      /{entry.ipaResolved}/
                    </p>
                  </div>
                  <Separator className="bg-border/80" />
                  <div className="flex flex-wrap gap-2">
                    {casePhonemes.length > 0 ? (
                      <Badge variant="outline" className="border-[var(--color-border)] bg-transparent text-[var(--color-mist)]">
                        Case-phonemic letters highlighted
                      </Badge>
                    ) : null}
                    {entry.page_ref ? (
                      <Badge variant="outline" className="border-[var(--color-border)] bg-transparent text-[var(--color-mist)]">
                        {entry.page_ref}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-3xl border border-[var(--color-border)] bg-card text-[var(--color-parchment)]">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={varietyClasses(selectedEntry.variety)}>
                    {selectedEntry.variety}
                  </Badge>
                  {selectedEntry.pos ? (
                    <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                      {selectedEntry.pos}
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle className="space-y-3 pt-2">
                  <OhloneText
                    as="div"
                    text={selectedEntry.word}
                    variety={selectedEntry.variety}
                    className="text-4xl text-[var(--color-parchment)]"
                  />
                  <p className="text-xl leading-8 text-[var(--color-parchment)]">
                    {selectedEntry.meanings[0] ?? selectedEntry.english}
                  </p>
                </DialogTitle>
                <DialogDescription className="body-copy text-[var(--color-mist)]">
                  {selectedEntry.english}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-5">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
                  <div className="small-label">IPA</div>
                  <p className="mt-2 font-mono text-lg text-[var(--color-green)]">
                    /{selectedEntry.ipaResolved}/
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
                  <div className="small-label">Sounds</div>
                  <div className="mt-4">
                    <PronunciationStrip
                      segments={segmentWord(selectedEntry.word, selectedEntry.variety)}
                    />
                  </div>
                </div>

                {selectedEntry.notes || selectedEntry.example_mutsun || selectedEntry.example_english ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4 text-sm leading-6 text-[var(--color-mist)]">
                    {selectedEntry.notes ? <p>{selectedEntry.notes}</p> : null}
                    {selectedEntry.example_mutsun ? (
                      <p className={selectedEntry.notes ? "mt-4" : ""}>
                        Example: {selectedEntry.example_mutsun}
                      </p>
                    ) : null}
                    {selectedEntry.example_english ? (
                      <p>Translation: {selectedEntry.example_english}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <DialogFooter showCloseButton>
                <Button
                  disabled={!selectedEntry.audio}
                  onClick={() =>
                    void playSource({
                      id: `detail-${selectedEntry.id}`,
                      url: selectedEntry.audio?.url,
                      speechText: selectedEntry.word,
                    })
                  }
                >
                  {selectedEntry.audio
                    ? activeId === `detail-${selectedEntry.id}`
                      ? "Playing"
                      : "Play audio"
                    : "No audio yet"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

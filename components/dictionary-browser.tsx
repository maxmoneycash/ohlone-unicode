"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { DictionaryEntry } from "@/lib/ohlone-data";
import type { Variety } from "@/lib/orthography";
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

type DictionaryBrowserProps = {
  entries: DictionaryEntry[];
  varieties: Variety[];
  partsOfSpeech: string[];
  sharedConcepts: string[];
};

const ALL_VARIETIES = "All varieties";
const ALL_POS = "All parts of speech";

function playbackUrl(entry: DictionaryEntry) {
  return (
    entry.audio?.url ??
    `/api/speech?text=${encodeURIComponent(entry.word)}&variety=${encodeURIComponent(entry.variety)}`
  );
}

function resultLabel(count: number) {
  return `${count} ${count === 1 ? "entry" : "entries"}`
}

function varietyClasses(variety: Variety) {
  switch (variety) {
    case "Mutsun":
      return "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]";
    case "Chochenyo":
      return "border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-parchment)]";
    default:
      return "border-[var(--color-green)] bg-[var(--color-green-soft)] text-[var(--color-parchment)]";
  }
}

export function DictionaryBrowser({
  entries,
  varieties,
  partsOfSpeech,
  sharedConcepts,
}: DictionaryBrowserProps) {
  const [query, setQuery] = useState("");
  const [varietyFilter, setVarietyFilter] = useState<string>(ALL_VARIETIES);
  const [posFilter, setPosFilter] = useState<string>(ALL_POS);
  const [view, setView] = useState<"browse" | "compare">("browse");
  const [selectedConcept, setSelectedConcept] = useState(sharedConcepts[0] ?? "");
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const { activeId, error, playSource } = useAudioPlayer();

  const filteredEntries = useMemo(() => {
    const lower = deferredQuery.toLocaleLowerCase();

    return entries.filter((entry) => {
      const matchesVariety =
        varietyFilter === ALL_VARIETIES || entry.variety === varietyFilter;
      const matchesPos = posFilter === ALL_POS || (entry.pos ?? "Unknown") === posFilter;
      const matchesSearch =
        !lower ||
        entry.word.includes(deferredQuery) ||
        entry.english.toLocaleLowerCase().includes(lower) ||
        entry.ipaResolved.toLocaleLowerCase().includes(lower) ||
        entry.searchIndex.includes(lower);

      return matchesVariety && matchesPos && matchesSearch;
    });
  }, [deferredQuery, entries, posFilter, varietyFilter]);

  const comparisonQuery = deferredQuery || selectedConcept;

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-shell space-y-4">
          <div className="small-label">Dictionary Browser</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            See the Ohlone word, hear it, and understand the meaning immediately.
          </h1>
          <p className="body-copy max-w-3xl">
            English glosses are surfaced first, with IPA, part of speech, and
            audio available without leaving the page. The comparison view keeps
            shared concepts aligned across varieties.
          </p>
        </div>

        <Card className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Character Rendering</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Special characters remain legible and distinct.
            </CardTitle>
            <CardDescription className="body-copy">
              The app preserves glottal stops and visually marks the Mutsun
              phonemic capitals so they are not mistaken for ordinary casing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <OhloneText
              as="p"
              text="Luohu Notko Saanay Taakampi č ş ŝ ţ ʼ"
              variety="Mutsun"
              className="text-3xl text-[var(--color-parchment)] sm:text-4xl"
            />
          </CardContent>
        </Card>
      </section>

      <section className="section-shell space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.85fr_0.85fr_auto]">
          <label className="grid gap-2">
            <span className="small-label">Search</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by Ohlone, English, or IPA"
              className="h-11 border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-[var(--color-parchment)] placeholder:text-[var(--color-copy-dim)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="small-label">Variety</span>
            <select
              value={varietyFilter}
              onChange={(event) => setVarietyFilter(event.target.value)}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-parchment)]"
            >
              <option>{ALL_VARIETIES}</option>
              {varieties.map((variety) => (
                <option key={variety}>{variety}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="small-label">Part of Speech</span>
            <select
              value={posFilter}
              onChange={(event) => setPosFilter(event.target.value)}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-parchment)]"
            >
              <option>{ALL_POS}</option>
              {partsOfSpeech.map((partOfSpeech) => (
                <option key={partOfSpeech}>{partOfSpeech}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <span className="small-label">View</span>
            <div className="flex gap-2">
              <Button
                variant={view === "browse" ? "default" : "outline"}
                className={view === "browse" ? "" : "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"}
                onClick={() => setView("browse")}
              >
                Browse
              </Button>
              <Button
                variant={view === "compare" ? "default" : "outline"}
                className={view === "compare" ? "" : "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"}
                onClick={() => setView("compare")}
              >
                Compare
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
              {resultLabel(filteredEntries.length)}
            </Badge>
            {view === "compare" && comparisonQuery ? (
              <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                Concept: {comparisonQuery}
              </Badge>
            ) : null}
          </div>

          <Button
            variant="ghost"
            className="text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            onClick={() => {
              setQuery("");
              setVarietyFilter(ALL_VARIETIES);
              setPosFilter(ALL_POS);
            }}
          >
            Clear filters
          </Button>
        </div>

        {error ? (
          <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
            {error}
          </p>
        ) : null}
      </section>

      {view === "browse" ? (
        <section className="grid gap-4">
          {filteredEntries.length === 0 ? (
            <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
              <CardHeader>
                <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
                  No entries match the current filters.
                </CardTitle>
                <CardDescription className="body-copy">
                  Clear the search or broaden the variety filter to reopen the corpus.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {filteredEntries.map((entry) => {
            const entryId = `entry-${entry.id}`;
            const leadMeaning = entry.meanings[0] ?? entry.english;
            const extraMeanings = entry.meanings.slice(1);

            return (
              <Card key={entry.id} className="border-[var(--color-border)] bg-card py-0">
                <CardHeader className="gap-3 border-b border-border/80 pb-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={varietyClasses(entry.variety)}>
                      {entry.variety}
                    </Badge>
                    <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                      {entry.pos ?? "Unknown"}
                    </Badge>
                    <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                      {entry.audio ? "Archived audio" : "Generated speech"}
                    </Badge>
                  </div>
                  <CardAction className="flex gap-2">
                    <Button
                      aria-label={`Play ${entry.word}`}
                      onClick={() =>
                        void playSource({
                          id: entryId,
                          url: playbackUrl(entry),
                          speechText: entry.word,
                        })
                      }
                    >
                      {activeId === entryId ? "Playing" : "Play"}
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
                      {entry.casePhonemes.length > 0 ? (
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
      ) : (
        <section className="section-shell space-y-5">
          <div className="space-y-2">
            <div className="small-label">Cross-Variety Comparison</div>
            <h2 className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Compare one concept across Mutsun, Chochenyo, and OCEN Rumsen.
            </h2>
            <p className="body-copy">
              Use a shared English concept to line up attested forms side by side.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sharedConcepts.map((concept) => (
              <Button
                key={concept}
                variant={concept === comparisonQuery ? "default" : "outline"}
                className={
                  concept === comparisonQuery
                    ? ""
                    : "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                }
                onClick={() => {
                  setSelectedConcept(concept);
                  setQuery(concept);
                }}
              >
                {concept}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {varieties.map((variety) => {
              const matches = entries.filter((entry) => {
                if (entry.variety !== variety) {
                  return false;
                }

                if (posFilter !== ALL_POS && (entry.pos ?? "Unknown") !== posFilter) {
                  return false;
                }

                if (!comparisonQuery) {
                  return false;
                }

                const lower = comparisonQuery.toLocaleLowerCase();
                return (
                  entry.english.toLocaleLowerCase().includes(lower) ||
                  entry.conceptKey.includes(lower)
                );
              });

              return (
                <Card key={variety} className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
                  <CardHeader>
                    <Badge variant="outline" className={varietyClasses(variety)}>
                      {variety}
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid gap-3 pb-6">
                    {matches.length === 0 ? (
                      <p className="body-copy">
                        No direct match for this concept in the current corpus.
                      </p>
                    ) : null}

                    {matches.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="rounded-xl border border-[var(--color-border)] bg-card p-4 text-left transition-colors hover:border-[var(--color-border-strong)]"
                      >
                        <OhloneText
                          text={entry.word}
                          variety={entry.variety}
                          className="text-2xl text-[var(--color-parchment)]"
                        />
                        <p className="mt-2 text-lg leading-7 text-[var(--color-parchment)]">
                          {entry.meanings[0] ?? entry.english}
                        </p>
                        <p className="mt-2 body-copy">{entry.english}</p>
                        <p className="mt-3 font-mono text-sm text-[var(--color-green)]">
                          /{entry.ipaResolved}/
                        </p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-3xl border border-[var(--color-border)] bg-card text-[var(--color-parchment)]">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={varietyClasses(selectedEntry.variety)}>
                    {selectedEntry.variety}
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
                    {selectedEntry.pos ?? "Unknown"}
                  </Badge>
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
                  <div className="small-label">Phoneme Breakdown</div>
                  <div className="mt-4">
                    <PronunciationStrip segments={selectedEntry.phonemeBreakdown} />
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
                  onClick={() =>
                    void playSource({
                      id: `detail-${selectedEntry.id}`,
                      url: playbackUrl(selectedEntry),
                      speechText: selectedEntry.word,
                    })
                  }
                >
                  {activeId === `detail-${selectedEntry.id}` ? "Playing" : "Play audio"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

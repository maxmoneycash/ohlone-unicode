"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { OhloneText } from "@/components/ohlone-text";
import { useAudioPlayer } from "@/components/use-audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DictionaryEntry, PhraseEntry } from "@/lib/ohlone-data";
import { canonicalWord, tokenizeOhloneText, wordToIpa, type Variety } from "@/lib/orthography";

type SentenceBuilderProps = {
  entries: DictionaryEntry[];
  phrases: PhraseEntry[];
  varieties: Variety[];
};

type BuilderToken = {
  id: string;
  word: string;
  english: string;
  ipa: string;
  variety: Variety;
  audioUrl: string | null;
};

function tokenFromEntry(entry: DictionaryEntry): BuilderToken {
  return {
    id: `entry-${entry.id}`,
    word: entry.word,
    english: entry.meanings[0] ?? entry.english,
    ipa: entry.ipaResolved,
    variety: entry.variety,
    audioUrl:
      entry.audio?.url ??
      `/api/speech?text=${encodeURIComponent(entry.word)}&variety=${encodeURIComponent(entry.variety)}`,
  };
}

function tokenFromWord(
  word: string,
  variety: Variety,
  entryLookup: Map<string, DictionaryEntry>,
  index: number,
): BuilderToken {
  const match = entryLookup.get(canonicalWord(word, variety));

  if (match) {
    return {
      ...tokenFromEntry(match),
      id: `phrase-${match.id}-${index}`,
    };
  }

  return {
    id: `custom-${variety}-${index}-${word}`,
    word,
    english: "Attested in phrase corpus",
    ipa: wordToIpa(word, variety),
    variety,
    audioUrl: null,
  };
}

export function SentenceBuilder({
  entries,
  phrases,
  varieties,
}: SentenceBuilderProps) {
  const [variety, setVariety] = useState<Variety>("Chochenyo");
  const [query, setQuery] = useState("");
  const [sentence, setSentence] = useState<BuilderToken[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activePhraseId, setActivePhraseId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const { activeId, error, playSource, stop } = useAudioPlayer();

  const entryLookup = useMemo(
    () =>
      new Map(
        entries
          .filter((entry) => entry.variety === variety)
          .map((entry) => [canonicalWord(entry.word, entry.variety), entry]),
      ),
    [entries, variety],
  );

  const availableEntries = entries.filter((entry) => {
    if (entry.variety !== variety) {
      return false;
    }

    if (!deferredQuery) {
      return true;
    }

    return (
      entry.word.toLocaleLowerCase().includes(deferredQuery) ||
      entry.english.toLocaleLowerCase().includes(deferredQuery) ||
      entry.ipaResolved.toLocaleLowerCase().includes(deferredQuery)
    );
  });

  const phrasePool = useMemo(
    () => phrases.filter((phrase) => phrase.variety === variety),
    [phrases, variety],
  );

  const activePhrase =
    phrasePool.find((phrase) => phrase.id === activePhraseId) ?? null;

  useEffect(() => {
    setSentence((current) => current.filter((token) => token.variety === variety));
    setActivePhraseId(null);
    setStatus(null);
  }, [variety]);

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= sentence.length || to >= sentence.length) {
      return;
    }

    const next = [...sentence];
    const [item] = next.splice(from, 1);
    if (!item) {
      return;
    }
    next.splice(to, 0, item);
    setSentence(next);
  }

  function sentenceText() {
    return sentence.map((token) => token.word).join(" ");
  }

  async function playSentence() {
    const text = sentenceText().trim();
    if (!text) {
      setStatus("Build a sentence or load an attested phrase first.");
      return;
    }

    setStatus(null);

    await playSource({
      id: `sentence-full-${variety}`,
      url:
        activePhrase?.audio?.url ??
        `/api/speech?text=${encodeURIComponent(text)}&variety=${encodeURIComponent(variety)}`,
      speechText: text,
      onError: (message) => setStatus(message),
    });
  }

  async function loadRandomPhraseAndPlay() {
    if (phrasePool.length === 0) {
      setStatus("No attested phrase corpus is loaded for this variety yet.");
      return;
    }

    const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)]!;
    const tokens = tokenizeOhloneText(phrase.phrase).map((word, index) =>
      tokenFromWord(word, phrase.variety, entryLookup, index),
    );

    setSentence(tokens);
    setActivePhraseId(phrase.id);
    setStatus(phrase.english ?? "Attested phrase loaded.");

    await playSource({
      id: `phrase-${phrase.id}`,
      url:
        phrase.audio?.url ??
        `/api/speech?text=${encodeURIComponent(phrase.phrase)}&variety=${encodeURIComponent(phrase.variety)}`,
      speechText: phrase.phrase,
      onError: (message) => setStatus(message),
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="section-shell space-y-4">
          <div className="small-label">Sentence Builder</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            Load an attested phrase or build your own, then hear it as one continuous sentence.
          </h1>
          <p className="body-copy max-w-3xl">
            Full-sentence playback uses one audio request so the phrase flows
            naturally instead of sounding like a stack of disconnected words.
          </p>
        </div>

        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardContent className="py-6">
            <label className="grid gap-2">
              <span className="small-label">Variety</span>
              <select
                value={variety}
                onChange={(event) => setVariety(event.target.value as Variety)}
                className="h-11 rounded-lg border border-[var(--color-border)] bg-card px-4 text-sm text-[var(--color-parchment)]"
              >
                {varieties.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>
      </section>

      <Card className="border-[var(--color-border)] bg-card py-0">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="small-label">Sentence Lane</div>
              <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
                One button for a phrase that already makes sense.
              </CardTitle>
              <CardDescription className="body-copy">
                Use the attested phrase button for corpus-backed lines, or build
                a sentence manually and play the full line at once.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void loadRandomPhraseAndPlay()}>
                Generate and play
              </Button>
              <Button
                variant="outline"
                className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                onClick={() => void playSentence()}
              >
                Play full sentence
              </Button>
              <Button
                variant="outline"
                className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                onClick={stop}
              >
                Stop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {activePhrase ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
              <div className="small-label">Loaded Phrase</div>
              <OhloneText
                text={activePhrase.phrase}
                variety={activePhrase.variety}
                className="mt-3 text-3xl text-[var(--color-parchment)]"
              />
              <p className="mt-3 text-lg leading-7 text-[var(--color-parchment)]">
                {activePhrase.english ?? "No English gloss listed"}
              </p>
            </div>
          ) : null}

          {sentence.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel-muted)] p-5">
              <p className="body-copy">
                Press `Generate and play` for an attested phrase, or add words from the library below.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {sentence.map((token, index) => (
                <div
                  key={`${token.id}-${index}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null) {
                      moveItem(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                    setActivePhraseId(null);
                  }}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
                >
                  <OhloneText
                    text={token.word}
                    variety={token.variety}
                    className="text-2xl text-[var(--color-parchment)]"
                  />
                  <p className="mt-2 text-lg leading-7 text-[var(--color-parchment)]">
                    {token.english}
                  </p>
                  <p className="mt-2 font-mono text-sm text-[var(--color-green)]">
                    /{token.ipa}/
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        void playSource({
                          id: `sentence-token-${index}-${token.id}`,
                          url:
                            token.audioUrl ??
                            `/api/speech?text=${encodeURIComponent(token.word)}&variety=${encodeURIComponent(token.variety)}`,
                          speechText: token.word,
                        })
                      }
                    >
                      {activeId === `sentence-token-${index}-${token.id}` ? "Playing" : "Play"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--color-border)] bg-card text-[var(--color-mist)]"
                      onClick={() => {
                        moveItem(index, index - 1);
                        setActivePhraseId(null);
                      }}
                      disabled={index === 0}
                    >
                      Left
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--color-border)] bg-card text-[var(--color-mist)]"
                      onClick={() => {
                        moveItem(index, index + 1);
                        setActivePhraseId(null);
                      }}
                      disabled={index === sentence.length - 1}
                    >
                      Right
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--color-border)] bg-card text-[var(--color-mist)]"
                      onClick={() => {
                        setSentence((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index),
                        );
                        setActivePhraseId(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status || error ? (
            <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
              {status ?? error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border)] bg-card py-0">
        <CardHeader>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <label className="grid gap-2">
              <span className="small-label">Search Available Words</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by Ohlone, English, or IPA"
                className="h-11 border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-[var(--color-parchment)] placeholder:text-[var(--color-copy-dim)]"
              />
            </label>
            <p className="body-copy">
              Showing {Math.min(availableEntries.length, 36)} of {availableEntries.length} matching entries in {variety}.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pb-6 md:grid-cols-2 xl:grid-cols-3">
          {availableEntries.slice(0, 36).map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
            >
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                  {entry.pos ?? "Unknown"}
                </Badge>
                <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                  {entry.variety}
                </Badge>
              </div>
              <OhloneText
                text={entry.word}
                variety={entry.variety}
                className="mt-3 text-2xl text-[var(--color-parchment)]"
              />
              <p className="mt-3 text-lg leading-7 text-[var(--color-parchment)]">
                {entry.meanings[0] ?? entry.english}
              </p>
              <p className="mt-2 font-mono text-sm text-[var(--color-green)]">
                /{entry.ipaResolved}/
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    void playSource({
                      id: `library-${entry.id}`,
                      url:
                        entry.audio?.url ??
                        `/api/speech?text=${encodeURIComponent(entry.word)}&variety=${encodeURIComponent(entry.variety)}`,
                      speechText: entry.word,
                    })
                  }
                >
                  {activeId === `library-${entry.id}` ? "Playing" : "Hear"}
                </Button>
                <Button
                  variant="outline"
                  className="border-[var(--color-border)] bg-card text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                  onClick={() => {
                    setSentence((current) => [...current, tokenFromEntry(entry)]);
                    setActivePhraseId(null);
                    setStatus(null);
                  }}
                >
                  Add
                </Button>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { Waveform } from "@/components/ui/waveform";
import type { DictionaryEntry, PhraseEntry } from "@/lib/ohlone-data";
import {
  canonicalWord,
  tokenizeOhloneText,
  wordToIpa,
  type Variety,
} from "@/lib/orthography";

type TtsWorkbenchProps = {
  entries: DictionaryEntry[];
  phrases: PhraseEntry[];
  varieties: Variety[];
};

type PlaybackPlanItem = {
  id: string;
  word: string;
  english: string | null;
  ipa: string;
  url: string;
  source: "archive" | "synth";
};

export function TtsWorkbench({
  entries,
  phrases,
  varieties,
}: TtsWorkbenchProps) {
  const [variety, setVariety] = useState<Variety>("Mutsun");
  const [text, setText] = useState("Saleki Asatsa");
  const [speed, setSpeed] = useState(1);
  const [plan, setPlan] = useState<PlaybackPlanItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { activeId, error, isPlaying, playQueue, stop } = useAudioPlayer();

  const entryLookup = useMemo(
    () =>
      new Map(
        entries
          .filter((entry) => entry.variety === variety)
          .map((entry) => [canonicalWord(entry.word, entry.variety), entry]),
      ),
    [entries, variety],
  );

  const phraseSuggestions = phrases.filter((phrase) => phrase.variety === variety);

  const previewTokens = (plan.length > 0 ? plan : tokenizeOhloneText(text).map((word, index) => {
    const match = entryLookup.get(canonicalWord(word, variety));
    return {
      id: `preview-${index}`,
      word,
      english: match?.meanings[0] ?? null,
      ipa: match?.ipaResolved ?? wordToIpa(word, variety),
      url:
        match?.audio?.url ??
        `/api/speech?text=${encodeURIComponent(word)}&variety=${encodeURIComponent(variety)}`,
      source: match?.audio ? "archive" as const : "synth" as const,
    };
  }));

  const waveformData = previewTokens.map((item) =>
    Math.min(0.9, Math.max(0.18, item.ipa.length / 10)),
  );

  async function handlePlay() {
    const tokens = tokenizeOhloneText(text);

    if (tokens.length === 0) {
      setStatus("Enter a word or phrase to hear it.");
      return;
    }

    const nextPlan = tokens.map<PlaybackPlanItem>((token, index) => {
      const match = entryLookup.get(canonicalWord(token, variety));

      return {
        id: `tts-${index}-${token}`,
        word: token,
        english: match?.meanings[0] ?? null,
        ipa: match?.ipaResolved ?? wordToIpa(token, variety),
        url:
          match?.audio?.url ??
          `/api/speech?text=${encodeURIComponent(token)}&variety=${encodeURIComponent(variety)}`,
        source: match?.audio ? "archive" : "synth",
      };
    });

    setPlan(nextPlan);
    setStatus(null);

    await playQueue(
      nextPlan.map((item, index) => ({
        id: item.id,
        url: item.url,
        rate: speed,
        speechText: item.word,
        onStart: () => setActiveIndex(index),
        onEnd: () => setActiveIndex(null),
        onError: (message) => setStatus(message),
      })),
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-shell space-y-4">
          <div className="small-label">Text to Speech</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            Use archived audio whenever it exists, then fall through to server synthesis.
          </h1>
          <p className="body-copy max-w-3xl">
            The playback plan is transparent. Each token shows whether it will
            use archived audio or generated speech, and the IPA transcription is
            visible before playback starts.
          </p>
        </div>

        <Card className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Current IPA</div>
            <CardTitle className="font-mono text-2xl text-[var(--color-green)]">
              /{previewTokens.map((item) => item.ipa).join(" ")} /
            </CardTitle>
            <CardDescription className="body-copy">
              Unknown words no longer fall back to the phone browser voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Waveform
              data={waveformData}
              barColor="rgba(143, 162, 141, 0.9)"
              barWidth={10}
              barGap={6}
              barRadius={999}
              height={72}
              fadeEdges={false}
              className="rounded-xl border border-[var(--color-border)] bg-card px-4 py-3"
            />
          </CardContent>
        </Card>
      </section>

      <section className="section-shell space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr_0.65fr]">
          <label className="grid gap-2">
            <span className="small-label">Ohlone Text</span>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              className="min-h-32 border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 py-3 text-lg text-[var(--color-parchment)]"
            />
          </label>

          <label className="grid gap-2">
            <span className="small-label">Variety</span>
            <select
              value={variety}
              onChange={(event) => setVariety(event.target.value as Variety)}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-parchment)]"
            >
              {varieties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="small-label">Playback Speed</span>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 py-4">
              <input
                type="range"
                min="0.65"
                max="1.3"
                step="0.05"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="w-full accent-[var(--color-ochre)]"
              />
              <div className="mt-2 text-sm text-[var(--color-mist)]">
                {speed.toFixed(2)}x
              </div>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handlePlay()}>
            {isPlaying ? "Playing" : "Play text"}
          </Button>
          <Button
            variant="outline"
            className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            onClick={stop}
          >
            Stop
          </Button>
        </div>

        {status || error ? (
          <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
            {status ?? error}
          </p>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[var(--color-border)] bg-card py-0">
          <CardHeader>
            <div className="small-label">Playback Plan</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Word-by-word routing
            </CardTitle>
            <CardDescription className="body-copy">
              Each token shows the Ohlone form, the lead English gloss when one
              is in the corpus, the IPA, and whether it will use an archive or synthesis.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-6">
            {previewTokens.length === 0 ? (
              <p className="body-copy">Enter text to generate a playback plan.</p>
            ) : null}

            {previewTokens.map((item, index) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  activeIndex === index || activeId === item.id
                    ? "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-panel-muted)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <OhloneText
                      text={item.word}
                      variety={variety}
                      className="text-2xl text-[var(--color-parchment)]"
                    />
                    <p className="text-lg leading-7 text-[var(--color-parchment)]">
                      {item.english ?? "No English gloss in the corpus"}
                    </p>
                    <p className="font-mono text-sm text-[var(--color-green)]">
                      /{item.ipa}/
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.source === "archive"
                        ? "border-[var(--color-green)] bg-[var(--color-green-soft)] text-[var(--color-parchment)]"
                        : "border-[var(--color-border)] bg-card text-[var(--color-mist)]"
                    }
                  >
                    {item.source === "archive" ? "Archived audio" : "Generated speech"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Suggested Phrases</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Start from attested material.
            </CardTitle>
            <CardDescription className="body-copy">
              These phrases come directly from the current corpus for the selected variety.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pb-6">
            {phraseSuggestions.map((phrase) => (
              <Button
                key={phrase.id}
                variant="outline"
                className="h-auto border-[var(--color-border)] bg-card px-4 py-2 text-left text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                onClick={() => setText(phrase.phrase)}
              >
                {phrase.phrase}
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

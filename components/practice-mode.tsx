"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { OhloneText } from "@/components/ohlone-text";
import { PronunciationStrip } from "@/components/pronunciation-strip";
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
import { MicSelector } from "@/components/ui/mic-selector";
import { Progress } from "@/components/ui/progress";
import { VoiceButton, type VoiceButtonState } from "@/components/ui/voice-button";
import { Waveform } from "@/components/ui/waveform";
import type { DictionaryEntry, PhraseEntry } from "@/lib/ohlone-data";
import { formatDuration } from "@/lib/utils";
import {
  canonicalWord,
  timelineForText,
  tokenizeOhloneText,
  type Variety,
  wordToIpa,
} from "@/lib/orthography";

type PracticeModeProps = {
  entries: DictionaryEntry[];
  phrases: PhraseEntry[];
  varieties: Variety[];
};

type PracticeItem = {
  id: string;
  type: "phrase" | "word";
  text: string;
  english: string;
  variety: Variety;
  ipa: string;
  audioUrl: string | null;
};

export function PracticeMode({
  entries,
  phrases,
  varieties,
}: PracticeModeProps) {
  const [variety, setVariety] = useState<Variety>("Mutsun");
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0.9);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMs, setRecordingMs] = useState<number | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<VoiceButtonState>("idle");
  const [micDeviceId, setMicDeviceId] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timeoutsRef = useRef<number[]>([]);
  const { error, isPlaying, playQueue, stop } = useAudioPlayer();

  const dictionaryLookup = useMemo(
    () => new Map(entries.map((entry) => [canonicalWord(entry.word, entry.variety), entry])),
    [entries],
  );

  const practiceItems = useMemo<PracticeItem[]>(
    () => [
      ...phrases
        .filter((phrase) => phrase.variety === variety)
        .map((phrase) => ({
          id: `phrase-${phrase.id}`,
          type: "phrase" as const,
          text: phrase.phrase,
          english: phrase.english ?? "No translation listed",
          variety: phrase.variety,
          ipa: phrase.ipaResolved,
          audioUrl: phrase.audio?.url ?? null,
        })),
      ...entries
        .filter((entry) => entry.variety === variety && entry.audio)
        .slice(0, 8)
        .map((entry) => ({
          id: `word-${entry.id}`,
          type: "word" as const,
          text: entry.word,
          english: entry.english,
          variety: entry.variety,
          ipa: entry.ipaResolved,
          audioUrl: entry.audio?.url ?? null,
        })),
    ],
    [entries, phrases, variety],
  );

  useEffect(() => {
    setSelectedId(practiceItems[0]?.id ?? "");
  }, [variety, practiceItems]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

  const activeItem =
    practiceItems.find((item) => item.id === selectedId) ?? practiceItems[0];

  const timeline = activeItem
    ? timelineForText(activeItem.text, activeItem.variety)
    : [];

  const estimatedDuration = timeline.reduce(
    (total, segment) => total + segment.durationMs,
    0,
  );

  const waveformData = timeline.map((segment) =>
    Math.min(0.92, Math.max(0.18, segment.durationMs / 300)),
  );

  function clearTimeline() {
    timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    timeoutsRef.current = [];
    setActiveSegment(null);
  }

  function startTimeline() {
    clearTimeline();
    let offset = 0;

    timeline.forEach((segment, index) => {
      const timeout = window.setTimeout(() => {
        setActiveSegment(index);
      }, offset / speed);
      timeoutsRef.current.push(timeout);
      offset += segment.durationMs;
    });

    const resetTimeout = window.setTimeout(() => {
      setActiveSegment(null);
    }, offset / speed + 120);
    timeoutsRef.current.push(resetTimeout);
  }

  async function handlePlay() {
    if (!activeItem) {
      return;
    }

    startTimeline();

    if (activeItem.audioUrl) {
      await playQueue([
        {
          id: activeItem.id,
          url: activeItem.audioUrl,
          rate: speed,
          speechText: activeItem.text,
        },
      ]);
      return;
    }

    const tokens = tokenizeOhloneText(activeItem.text);
    await playQueue(
      tokens.map((token, index) => {
        const entry = dictionaryLookup.get(canonicalWord(token, activeItem.variety));

        return {
          id: `${activeItem.id}-${index}`,
          url:
            entry?.audio?.url ??
            `/api/speech?text=${encodeURIComponent(token)}&variety=${encodeURIComponent(activeItem.variety)}`,
          rate: speed,
          speechText: token,
        };
      }),
    );
  }

  async function toggleRecording() {
    if (recordingState === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micDeviceId ? { deviceId: { exact: micDeviceId } } : true,
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setRecordingState("recording");

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (recordingUrl) {
          URL.revokeObjectURL(recordingUrl);
        }
        setRecordingUrl(url);
        setRecordingMs(Date.now() - startedAtRef.current);
        setRecordingError(null);
        setRecordingState("success");
        stream.getTracks().forEach((track) => track.stop());
      });

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (recordError) {
      setRecordingError(
        recordError instanceof Error
          ? recordError.message
          : "Microphone access failed.",
      );
      setRecordingState("error");
    }
  }

  const comparisonProgress =
    recordingMs && estimatedDuration
      ? Math.min(100, (recordingMs / estimatedDuration) * 100)
      : 0;

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="section-shell space-y-4">
          <div className="small-label">Pronunciation Practice</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            Follow the phonemes as they move, then record your own attempt.
          </h1>
          <p className="body-copy max-w-3xl">
            Timing is estimated from the IPA inventory so learners can rehearse
            articulation rather than just replay a clip.
          </p>
        </div>

        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardContent className="grid gap-4 py-6">
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
            <div className="grid gap-2">
              <span className="small-label">Microphone</span>
              <MicSelector value={micDeviceId} onValueChange={setMicDeviceId} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <Card className="border-[var(--color-border)] bg-card py-0">
          <CardHeader>
            <div className="small-label">Practice Set</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Pick a phrase or word.
            </CardTitle>
            <CardDescription className="body-copy">
              Start with archived materials for the selected variety.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-6">
            {practiceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  item.id === activeItem?.id
                    ? "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-panel-muted)] hover:border-[var(--color-border-strong)]"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                    {item.type === "phrase" ? "Phrase" : "Word"}
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                    {item.variety}
                  </Badge>
                </div>
                <OhloneText
                  text={item.text}
                  variety={item.variety}
                  className="mt-3 text-2xl text-[var(--color-parchment)]"
                />
                <p className="mt-2 text-lg leading-7 text-[var(--color-parchment)]">
                  {item.english}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border)] bg-card py-0">
          {activeItem ? (
            <>
              <CardHeader className="space-y-4 border-b border-border/80 pb-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="small-label">Now Practicing</div>
                    <OhloneText
                      as="h2"
                      text={activeItem.text}
                      variety={activeItem.variety}
                      className="text-4xl text-[var(--color-parchment)] sm:text-5xl"
                    />
                    <p className="text-xl leading-8 text-[var(--color-parchment)]">
                      {activeItem.english}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 py-4">
                    <div className="small-label">Playback Speed</div>
                    <input
                      type="range"
                      min="0.55"
                      max="1"
                      step="0.05"
                      value={speed}
                      onChange={(event) => setSpeed(Number(event.target.value))}
                      className="mt-3 w-44 accent-[var(--color-ochre)]"
                    />
                    <p className="mt-2 text-sm text-[var(--color-mist)]">
                      {speed.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5 py-6">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
                  <div className="small-label">Karaoke Guide</div>
                  <div className="mt-4">
                    <PronunciationStrip segments={timeline} activeIndex={activeSegment} />
                  </div>
                  <p className="mt-4 font-mono text-base text-[var(--color-green)]">
                    /{activeItem.ipa || tokenizeOhloneText(activeItem.text).map((word) => wordToIpa(word, activeItem.variety)).join(" ")} /
                  </p>
                  <div className="mt-4">
                    <Waveform
                      data={waveformData}
                      barColor="rgba(199, 156, 87, 0.9)"
                      barWidth={8}
                      barGap={5}
                      barRadius={999}
                      height={60}
                      fadeEdges={false}
                    />
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-mist)]">
                    Estimated guide length: {formatDuration(estimatedDuration)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void handlePlay()}>
                    {isPlaying ? "Playing" : "Play guide"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
                    onClick={() => {
                      clearTimeline();
                      stop();
                    }}
                  >
                    Stop
                  </Button>
                  <VoiceButton
                    state={recordingState}
                    label={recordingState === "recording" ? "Stop recording" : "Record yourself"}
                    onPress={() => void toggleRecording()}
                    variant="outline"
                    className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-parchment)]"
                  />
                </div>

                {error || recordingError ? (
                  <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
                    {error ?? recordingError}
                  </p>
                ) : null}

                {recordingUrl ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4">
                    <div className="small-label">Your Recording</div>
                    <audio controls src={recordingUrl} className="mt-4 w-full" />
                    <div className="mt-4 grid gap-2">
                      <Progress value={comparisonProgress} />
                      <p className="text-sm text-[var(--color-mist)]">
                        Your take: {recordingMs ? formatDuration(recordingMs) : "0:00"}.
                        Target guide: {formatDuration(estimatedDuration)}.
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </>
          ) : (
            <CardContent className="py-6">
              <p className="body-copy">
                Choose a word or phrase from the practice set to begin.
              </p>
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}

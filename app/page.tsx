import Link from "next/link";

import { OhloneText } from "@/components/ohlone-text";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { Waveform } from "@/components/ui/waveform";
import { getCorpus } from "@/lib/ohlone-data";

export default async function HomePage() {
  const corpus = await getCorpus();
  const heroWave = [0.12, 0.22, 0.36, 0.54, 0.48, 0.3, 0.42, 0.62, 0.38, 0.28, 0.18];
  const samples = [
    corpus.dictionary.find((entry) => entry.variety === "Mutsun" && entry.word === "Taakampi"),
    corpus.dictionary.find((entry) => entry.variety === "Chochenyo" && entry.word === "Tújŝtak"),
    corpus.dictionary.find((entry) => entry.variety === "OCEN Rumsen" && entry.word === "Saleki Tomanis"),
  ].filter(Boolean);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="section-shell space-y-6">
          <div className="space-y-4">
            <div className="small-label text-[var(--color-ochre)]">
              <ShimmeringText
                text="Verified dictionary, audio, and orthography corpus"
                repeat={false}
                startOnView={false}
                className="text-xs uppercase"
              />
            </div>
            <h1 className="editorial-heading max-w-4xl text-5xl text-[var(--color-parchment)] sm:text-6xl">
              Hear Ohlone words, see what they mean, and work from verified forms.
            </h1>
            <p className="body-copy max-w-3xl text-base sm:text-lg">
              The app reads the repository corpus directly: dictionary entries,
              archived audio, phonology, phrases, and orthography rules across
              Mutsun, Chochenyo, and OCEN Rumsen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dictionary"
              className="rounded-full border border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] px-5 py-3 text-sm text-[var(--color-parchment)]"
            >
              Browse dictionary
            </Link>
            <Link
              href="/tts"
              className="rounded-full border border-border bg-[var(--color-panel-muted)] px-5 py-3 text-sm text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            >
              Hear text
            </Link>
            <Link
              href="/practice"
              className="rounded-full border border-border bg-[var(--color-panel-muted)] px-5 py-3 text-sm text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            >
              Practice pronunciation
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
              {corpus.statistics.total_entries} entries
            </Badge>
            <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
              201 archived WAV files
            </Badge>
            <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
              3 varieties
            </Badge>
          </div>
        </div>

        <Card className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader className="pb-0">
            <div className="small-label">Orthography Preview</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)] sm:text-4xl">
              Characters stay distinct, not flattened into ASCII.
            </CardTitle>
            <CardDescription className="body-copy">
              The text renderer preserves glottal stops, special characters,
              and the phonemic capital letters used in Mutsun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pb-6">
            <OhloneText
              as="p"
              text="Luohu Notko Saanay Taakampi č ş ŝ ţ ʼ"
              variety="Mutsun"
              className="text-3xl text-[var(--color-parchment)] sm:text-4xl"
            />
            <Waveform
              data={heroWave}
              barColor="rgba(199, 156, 87, 0.92)"
              barWidth={10}
              barGap={6}
              barRadius={999}
              height={72}
              fadeEdges={false}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Dictionary Browser</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Look up the word first.
            </CardTitle>
            <CardDescription className="body-copy">
              Search by Ohlone or English, then compare meanings, IPA, and audio.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Text to Speech</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Archived audio first.
            </CardTitle>
            <CardDescription className="body-copy">
              Known words use archived WAV files. Unknown forms route through
              server-side synthesis instead of phone TTS voices.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Practice Mode</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Rehearse sound by sound.
            </CardTitle>
            <CardDescription className="body-copy">
              Follow phoneme timing, slow playback, and compare your own recording.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {samples.map((sample) =>
          sample ? (
            <article key={sample.id} className="section-shell space-y-4 border-[var(--color-border-strong)]">
              <div className="small-label">{sample.variety}</div>
              <OhloneText
                text={sample.word}
                variety={sample.variety}
                className="text-3xl text-[var(--color-parchment)]"
              />
              <p className="text-xl leading-8 text-[var(--color-parchment)]">
                {sample.meanings[0] ?? sample.english}
              </p>
              <p className="body-copy">{sample.english}</p>
              <p className="font-mono text-sm text-[var(--color-green)]">
                /{sample.ipaResolved}/
              </p>
            </article>
          ) : null,
        )}
      </section>
    </div>
  );
}

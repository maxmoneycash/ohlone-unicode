import Link from "next/link";

import { OhloneText } from "@/components/ohlone-text";
import { getCorpus } from "@/lib/ohlone-data";

export default async function HomePage() {
  const corpus = await getCorpus();
  const samples = [
    corpus.dictionary.find((entry) => entry.variety === "Chochenyo" && entry.word === "makkin"),
    corpus.dictionary.find((entry) => entry.variety === "Chochenyo" && entry.word === "noono"),
    corpus.dictionary.find((entry) => entry.variety === "Chochenyo" && entry.word === "saleki"),
  ].filter(Boolean);
  const chochenyoEntryCount = corpus.statistics.entries_by_variety.Chochenyo ?? 0;

  return (
    <div className="grid gap-8">
      <section className="section-shell grid gap-8 border-[var(--color-border-strong)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <div className="small-label text-[var(--color-ochre)]">Start Here</div>
          <h1 className="editorial-heading max-w-4xl text-5xl text-[var(--color-parchment)] sm:text-6xl">
            Learn Chochenyo one word at a time.
          </h1>
          <p className="body-copy max-w-3xl text-base sm:text-lg">
            Start with Chochenyo vocabulary, listen to archived audio when it
            exists, then practice the sounds. Other Ohlone varieties stay
            available, but Chochenyo is the main learning path.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dictionary"
              className="rounded-full border border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] px-5 py-3 text-sm text-[var(--color-parchment)]"
            >
              Find a word
            </Link>
            <Link
              href="/practice"
              className="rounded-full border border-border bg-[var(--color-panel-muted)] px-5 py-3 text-sm text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            >
              Practice sounds
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-5">
          <div className="small-label">Learning Flow</div>
          <ol className="mt-4 grid gap-4">
            {[
              ["Look up", "Find the word or English meaning."],
              ["Listen", "Use Chochenyo audio first when it is available."],
              ["Practice", "Break the word into sounds and repeat slowly."],
            ].map(([title, text], index) => (
              <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <div className="flex size-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-card text-sm tabular-nums text-[var(--color-ochre)]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-lg text-[var(--color-parchment)]">{title}</p>
                  <p className="text-sm leading-6 text-[var(--color-mist)]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="small-label">Words To Try</div>
            <h2 className="editorial-heading mt-2 text-3xl text-[var(--color-parchment)]">
              Start with Chochenyo basics.
            </h2>
          </div>
          <p className="text-sm text-[var(--color-copy-dim)]">
            {chochenyoEntryCount} Chochenyo entries · 15 archived audio files
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {samples.map((sample) =>
            sample ? (
              <Link
                key={sample.id}
                href={`/dictionary?query=${encodeURIComponent(sample.word)}`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div className="small-label">{sample.variety}</div>
                <OhloneText
                  text={sample.word}
                  variety={sample.variety}
                  className="mt-4 text-3xl text-[var(--color-parchment)]"
                />
                <p className="mt-3 text-lg leading-7 text-[var(--color-parchment)]">
                  {sample.meanings[0] ?? sample.english}
                </p>
                <p className="mt-3 font-mono text-sm text-[var(--color-green)]">
                  /{sample.ipaResolved}/
                </p>
              </Link>
            ) : null,
          )}
        </div>
      </section>

      <section className="quiet-rule pt-5">
        <p className="text-sm leading-6 text-[var(--color-copy-dim)]">
          Research tools are still available for source review and corpus building:
          {" "}
          <Link href="/corpus" className="text-[var(--color-mist)] hover:text-[var(--color-parchment)]">
            open the corpus workbench
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

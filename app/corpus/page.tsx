import Link from "next/link";

import audioAlignmentManifest from "@/data/audio_alignment_manifest.json";
import sourceBacklog from "@/data/corpus_source_backlog.json";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCorpus } from "@/lib/ohlone-data";

type Priority = "high" | "medium" | "low";

type BacklogItem = {
  name: string;
  url: string;
  varieties: string[];
  content_type: string;
  status: string;
  priority: Priority;
  why_it_matters: string;
  next_action: string;
};

type AudioLead = {
  id: string;
  title: string;
  url: string;
  platform: string;
  variety: string;
  content_type: string;
  caption_status: string;
  ohlone_text_status: string;
  alignment_status: string;
  priority: Priority;
  rights_status: string;
  next_action: string;
};

const sourceItems = sourceBacklog.items as BacklogItem[];
const audioItems = audioAlignmentManifest.items as AudioLead[];

function priorityClass(priority: Priority) {
  if (priority === "high") {
    return "border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]";
  }

  if (priority === "medium") {
    return "border-[var(--color-green)] bg-[var(--color-green-soft)] text-[var(--color-parchment)]";
  }

  return "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]";
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default async function CorpusPage() {
  const corpus = await getCorpus();
  const highPrioritySources = sourceItems.filter((item) => item.priority === "high");
  const highPriorityAudio = audioItems.filter((item) => item.priority === "high");

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="section-shell space-y-4">
          <div className="small-label">Corpus Workbench</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            Grow the Ohlone language corpus with reviewable source and audio queues.
          </h1>
          <p className="body-copy max-w-3xl">
            The dictionary is useful now, but the next jump is provenance:
            item-level sources, approved text examples, and phrase-level audio
            alignment that can support a cautious AI assistant.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dictionary"
              className="rounded-full border border-[var(--color-ochre)] bg-[var(--color-ochre-soft)] px-5 py-3 text-sm text-[var(--color-parchment)]"
            >
              Review dictionary
            </Link>
            <Link
              href="/assistant"
              className="rounded-full border border-border bg-[var(--color-panel-muted)] px-5 py-3 text-sm text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            >
              Test assistant
            </Link>
          </div>
        </div>

        <Card className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Current Corpus</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              The data is broad enough for retrieval, not for unsupervised generation.
            </CardTitle>
            <CardDescription className="body-copy">
              Use the corpus to cite, compare, and explain attested forms.
              Training speech or story generation needs permissioned aligned data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-6 sm:grid-cols-2">
            <Badge variant="outline" className="justify-center border-[var(--color-border-strong)] bg-card py-3 text-[var(--color-mist)]">
              <span className="tabular-nums">{corpus.statistics.total_entries}</span> entries
            </Badge>
            <Badge variant="outline" className="justify-center border-[var(--color-border-strong)] bg-card py-3 text-[var(--color-mist)]">
              <span className="tabular-nums">{corpus.statistics.total_phrases}</span> phrases
            </Badge>
            <Badge variant="outline" className="justify-center border-[var(--color-border-strong)] bg-card py-3 text-[var(--color-mist)]">
              <span className="tabular-nums">{corpus.statistics.total_sources}</span> sources
            </Badge>
            <Badge variant="outline" className="justify-center border-[var(--color-border-strong)] bg-card py-3 text-[var(--color-mist)]">
              <span className="tabular-nums">{audioItems.length}</span> audio leads
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="section-shell space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="small-label">Coverage</div>
            <h2 className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Entries by variety
            </h2>
          </div>
          <Badge variant="outline" className="border-[var(--color-border-strong)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]">
            {corpus.varieties.length} tracked varieties
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(corpus.statistics.entries_by_variety).map(([variety, count]) => (
            <article
              key={variety}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
            >
              <div className="small-label">{variety}</div>
              <p className="mt-3 text-3xl tabular-nums text-[var(--color-parchment)]">
                {count}
              </p>
              <p className="mt-1 text-sm text-[var(--color-copy-dim)]">dictionary entries</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[var(--color-border)] bg-card py-0">
          <CardHeader>
            <div className="small-label">Written Source Queue</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Prioritize sources with text, translations, and item-level references.
            </CardTitle>
            <CardDescription className="body-copy">
              {highPrioritySources.length} high-priority written sources are waiting
              for review or deeper itemization.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-6">
            {sourceItems.slice(0, 6).map((item) => (
              <article
                key={item.name}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={priorityClass(item.priority)}>
                    {item.priority} priority
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                    {humanize(item.status)}
                  </Badge>
                </div>
                <h3 className="mt-3 text-xl leading-7 text-[var(--color-parchment)]">
                  <a href={item.url} className="hover:text-[var(--color-ochre)]">
                    {item.name}
                  </a>
                </h3>
                <p className="mt-2 body-copy">{item.why_it_matters}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-copy-dim)]">
                  Next: {item.next_action}
                </p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border)] bg-card py-0">
          <CardHeader>
            <div className="small-label">Audio Alignment Queue</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              The scarce resource is clean audio-text alignment.
            </CardTitle>
            <CardDescription className="body-copy">
              {highPriorityAudio.length} high-priority media leads should be
              checked for captions, written forms, and permissions first.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pb-6">
            {audioItems.slice(0, 6).map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={priorityClass(item.priority)}>
                    {item.priority} priority
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                    {item.variety}
                  </Badge>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-card text-[var(--color-mist)]">
                    {humanize(item.alignment_status)}
                  </Badge>
                </div>
                <h3 className="mt-3 text-xl leading-7 text-[var(--color-parchment)]">
                  <a href={item.url} className="hover:text-[var(--color-ochre)]">
                    {item.title}
                  </a>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-mist)]">
                  Captions: {humanize(item.caption_status)}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-copy-dim)]">
                  Next: {item.next_action}
                </p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="section-shell space-y-5">
        <div className="space-y-2">
          <div className="small-label">Build Path</div>
          <h2 className="editorial-heading text-3xl text-[var(--color-parchment)]">
            Make RAG useful first, then decide if training is justified.
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {[
            "Inventory sources",
            "Review rights",
            "Extract text",
            "Align audio",
            "Ground assistant",
          ].map((step, index) => (
            <article
              key={step}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)] p-4"
            >
              <div className="small-label">Step {index + 1}</div>
              <p className="mt-3 text-lg leading-7 text-[var(--color-parchment)]">{step}</p>
            </article>
          ))}
        </div>

        <p className="body-copy max-w-4xl">
          The website should remain language-centered. History, maps, songs,
          stories, and archival context should enter through source-backed
          language records instead of becoming a broad general-history site.
        </p>
      </section>
    </div>
  );
}

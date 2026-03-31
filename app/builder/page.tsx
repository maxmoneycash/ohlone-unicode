import { SentenceBuilder } from "@/components/sentence-builder";
import { getCorpus } from "@/lib/ohlone-data";

export default async function BuilderPage() {
  const corpus = await getCorpus();

  return (
    <SentenceBuilder
      entries={corpus.dictionary}
      phrases={corpus.phrases}
      varieties={corpus.varieties}
    />
  );
}

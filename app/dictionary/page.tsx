import { DictionaryBrowser } from "@/components/dictionary-browser";
import { getCorpus } from "@/lib/ohlone-data";

export default async function DictionaryPage() {
  const corpus = await getCorpus();

  return (
    <DictionaryBrowser
      entries={corpus.dictionary}
      varieties={corpus.varieties}
      partsOfSpeech={corpus.partsOfSpeech}
      sharedConcepts={corpus.sharedConcepts}
    />
  );
}

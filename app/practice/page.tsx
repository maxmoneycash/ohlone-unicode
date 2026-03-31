import { PracticeMode } from "@/components/practice-mode";
import { getCorpus } from "@/lib/ohlone-data";

export default async function PracticePage() {
  const corpus = await getCorpus();

  return (
    <PracticeMode
      entries={corpus.dictionary}
      phrases={corpus.phrases}
      varieties={corpus.varieties}
    />
  );
}

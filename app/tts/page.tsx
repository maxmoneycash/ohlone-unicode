import { TtsWorkbench } from "@/components/tts-workbench";
import { getCorpus } from "@/lib/ohlone-data";

export default async function TextToSpeechPage() {
  const corpus = await getCorpus();

  return (
    <TtsWorkbench
      entries={corpus.dictionary}
      phrases={corpus.phrases}
      varieties={corpus.varieties}
    />
  );
}

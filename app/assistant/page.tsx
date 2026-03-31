import { AssistantPanel } from "@/components/assistant-panel";
import { getCorpus } from "@/lib/ohlone-data";

export default async function AssistantPage() {
  const corpus = await getCorpus();

  return <AssistantPanel varieties={corpus.varieties} />;
}

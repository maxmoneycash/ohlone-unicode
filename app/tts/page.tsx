import {
  TtsWorkbench,
  type TtsDictionaryEntry,
  type TtsPhraseEntry,
} from "@/components/tts-workbench";
import { getCorpus, type DictionaryEntry, type PhraseEntry } from "@/lib/ohlone-data";
import { type Variety } from "@/lib/orthography";

const DEFAULT_VARIETY: Variety = "Chochenyo";

function sortForLearning(left: DictionaryEntry, right: DictionaryEntry) {
  return Number(Boolean(right.audio)) - Number(Boolean(left.audio)) || left.word.localeCompare(right.word);
}

function toTtsEntry(entry: DictionaryEntry): TtsDictionaryEntry {
  return {
    id: entry.id,
    word: entry.word,
    meanings: entry.meanings,
    variety: entry.variety,
    ipaResolved: entry.ipaResolved,
    audio: entry.audio,
  };
}

function toTtsPhrase(phrase: PhraseEntry): TtsPhraseEntry {
  return {
    id: phrase.id,
    phrase: phrase.phrase,
    variety: phrase.variety,
  };
}

export default async function TextToSpeechPage() {
  const corpus = await getCorpus();
  const entries = corpus.dictionary
    .filter((entry) => entry.variety === DEFAULT_VARIETY)
    .sort(sortForLearning)
    .map(toTtsEntry);
  const phrases = corpus.phrases
    .filter((phrase) => phrase.variety === DEFAULT_VARIETY)
    .map(toTtsPhrase);

  return (
    <TtsWorkbench
      entries={entries}
      phrases={phrases}
      varieties={[DEFAULT_VARIETY]}
    />
  );
}

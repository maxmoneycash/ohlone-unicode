import {
  PracticeMode,
  type PracticeDictionaryEntry,
  type PracticePhraseEntry,
} from "@/components/practice-mode";
import { getCorpus, type DictionaryEntry, type PhraseEntry } from "@/lib/ohlone-data";
import { type Variety } from "@/lib/orthography";

const DEFAULT_VARIETY: Variety = "Chochenyo";

function sortForLearning(left: DictionaryEntry, right: DictionaryEntry) {
  return Number(Boolean(right.audio)) - Number(Boolean(left.audio)) || left.word.localeCompare(right.word);
}

function toPracticeEntry(entry: DictionaryEntry): PracticeDictionaryEntry {
  return {
    id: entry.id,
    word: entry.word,
    english: entry.english,
    variety: entry.variety,
    ipaResolved: entry.ipaResolved,
    audio: entry.audio,
  };
}

function toPracticePhrase(phrase: PhraseEntry): PracticePhraseEntry {
  return {
    id: phrase.id,
    phrase: phrase.phrase,
    english: phrase.english,
    variety: phrase.variety,
    ipaResolved: phrase.ipaResolved,
    audio: phrase.audio,
  };
}

export default async function PracticePage() {
  const corpus = await getCorpus();
  const entries = corpus.dictionary
    .filter((entry) => entry.variety === DEFAULT_VARIETY && entry.audio)
    .sort(sortForLearning)
    .map(toPracticeEntry);
  const phrases = corpus.phrases
    .filter((phrase) => phrase.variety === DEFAULT_VARIETY && phrase.audio)
    .map(toPracticePhrase);

  return (
    <PracticeMode
      entries={entries}
      phrases={phrases}
      varieties={[DEFAULT_VARIETY]}
    />
  );
}

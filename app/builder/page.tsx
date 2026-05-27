import {
  SentenceBuilder,
  type BuilderDictionaryEntry,
  type BuilderPhraseEntry,
} from "@/components/sentence-builder";
import { getCorpus, type DictionaryEntry, type PhraseEntry } from "@/lib/ohlone-data";
import { type Variety } from "@/lib/orthography";

const DEFAULT_VARIETY: Variety = "Chochenyo";

function sortForLearning(left: DictionaryEntry, right: DictionaryEntry) {
  return Number(Boolean(right.audio)) - Number(Boolean(left.audio)) || left.word.localeCompare(right.word);
}

function toBuilderEntry(entry: DictionaryEntry): BuilderDictionaryEntry {
  return {
    id: entry.id,
    word: entry.word,
    english: entry.english,
    ipaResolved: entry.ipaResolved,
    pos: entry.pos,
    variety: entry.variety,
    meanings: entry.meanings,
    audio: entry.audio,
  };
}

function toBuilderPhrase(phrase: PhraseEntry): BuilderPhraseEntry {
  return {
    id: phrase.id,
    phrase: phrase.phrase,
    english: phrase.english,
    variety: phrase.variety,
    audio: phrase.audio,
  };
}

export default async function BuilderPage() {
  const corpus = await getCorpus();
  const entries = corpus.dictionary
    .filter((entry) => entry.variety === DEFAULT_VARIETY)
    .sort(sortForLearning)
    .map(toBuilderEntry);
  const phrases = corpus.phrases
    .filter((phrase) => phrase.variety === DEFAULT_VARIETY)
    .map(toBuilderPhrase);

  return (
    <SentenceBuilder
      entries={entries}
      phrases={phrases}
      varieties={[DEFAULT_VARIETY]}
    />
  );
}

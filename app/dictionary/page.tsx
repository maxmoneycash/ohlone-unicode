import {
  ALL_VARIETIES,
  DictionaryBrowser,
  type LearnerDictionaryEntry,
} from "@/components/dictionary-browser";
import { getCorpus, type DictionaryEntry } from "@/lib/ohlone-data";
import { type Variety } from "@/lib/orthography";

const DEFAULT_VARIETY: Variety = "Chochenyo";
const RESULT_LIMIT = 30;

type DictionarySearchParams = {
  query?: string;
  variety?: string;
};

function isVariety(value: string | undefined, varieties: Variety[]): value is Variety {
  return Boolean(value && varieties.includes(value as Variety));
}

function entryScore(entry: DictionaryEntry, query: string, selectedVariety: Variety | typeof ALL_VARIETIES) {
  const lower = query.toLocaleLowerCase();
  let score = entry.variety === DEFAULT_VARIETY ? 20 : 0;

  if (entry.variety === selectedVariety) {
    score += 10;
  }

  if (entry.audio) {
    score += 8;
  }

  if (!lower) {
    return score;
  }

  const word = entry.word.toLocaleLowerCase();
  const english = entry.english.toLocaleLowerCase();
  const ipa = entry.ipaResolved.toLocaleLowerCase();

  if (word === lower) {
    score += 100;
  } else if (word.startsWith(lower)) {
    score += 70;
  } else if (word.includes(lower)) {
    score += 45;
  }

  if (english === lower) {
    score += 90;
  } else if (english.startsWith(lower)) {
    score += 60;
  } else if (english.includes(lower)) {
    score += 35;
  }

  if (ipa.includes(lower)) {
    score += 10;
  }

  return score;
}

function matchesEntry(entry: DictionaryEntry, query: string, selectedVariety: Variety | typeof ALL_VARIETIES) {
  if (selectedVariety !== ALL_VARIETIES && entry.variety !== selectedVariety) {
    return false;
  }

  if (!query) {
    return true;
  }

  const lower = query.toLocaleLowerCase();

  return (
    entry.word.toLocaleLowerCase().includes(lower) ||
    entry.english.toLocaleLowerCase().includes(lower) ||
    entry.ipaResolved.toLocaleLowerCase().includes(lower)
  );
}

function toLearnerEntry(entry: DictionaryEntry): LearnerDictionaryEntry {
  return {
    id: entry.id,
    word: entry.word,
    english: entry.english,
    ipaResolved: entry.ipaResolved,
    pos: entry.pos,
    variety: entry.variety,
    source: entry.source,
    page_ref: entry.page_ref,
    notes: entry.notes,
    example_mutsun: entry.example_mutsun,
    example_english: entry.example_english,
    meanings: entry.meanings,
    audio: entry.audio,
  };
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams?: Promise<DictionarySearchParams>;
}) {
  const corpus = await getCorpus();
  const params = await searchParams;
  const query = params?.query?.trim() ?? "";
  const varieties = [
    DEFAULT_VARIETY,
    ...corpus.varieties.filter((variety) => variety !== DEFAULT_VARIETY),
  ];
  const selectedVariety =
    params?.variety === ALL_VARIETIES
      ? ALL_VARIETIES
      : isVariety(params?.variety, corpus.varieties)
        ? params.variety
        : DEFAULT_VARIETY;

  const matches = corpus.dictionary
    .filter((entry) => matchesEntry(entry, query, selectedVariety))
    .sort(
      (left, right) =>
        entryScore(right, query, selectedVariety) -
          entryScore(left, query, selectedVariety) ||
        left.word.localeCompare(right.word),
    );

  return (
    <DictionaryBrowser
      entries={matches.slice(0, RESULT_LIMIT).map(toLearnerEntry)}
      varieties={varieties}
      query={query}
      selectedVariety={selectedVariety}
      totalMatches={matches.length}
      resultLimit={RESULT_LIMIT}
    />
  );
}

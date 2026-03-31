import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  canonicalWord,
  CASE_PHONEMES,
  segmentWord,
  textToIpa,
  type OrthographySegment,
  type Variety,
  VARIETY_ORDER,
} from "@/lib/orthography";

type RawDictionaryEntry = {
  id: number;
  word: string;
  english: string;
  ipa: string | null;
  pos: string | null;
  variety: Variety;
  source: string | null;
  page_ref: string | null;
  from_lang: string | null;
  sci_name: string | null;
  cultural_info: string | null;
  other_pronunc: string | null;
  notes: string | null;
  example_mutsun: string | null;
  example_english: string | null;
};

type RawPhrase = {
  id: number;
  phrase: string;
  english: string | null;
  ipa: string | null;
  variety: Variety;
  source: string | null;
  context: string | null;
};

type RawPhonology = {
  id: number;
  symbol: string;
  ipa: string | null;
  variety: Variety;
  description: string | null;
  type: string | null;
  place: string | null;
  voice: string | null;
  unicode_hex: string | null;
  is_case_phonemic: number;
  is_digraph: number;
};

type RawAudioEntry = {
  word: string;
  english: string;
  ipa: string;
  variety: Variety;
  audio_file: string;
};

type RawCorpus = {
  metadata: Record<string, unknown>;
  statistics: {
    entries_by_variety: Record<string, number>;
    total_entries: number;
    total_phrases: number;
    total_sources: number;
  };
  dictionary: RawDictionaryEntry[];
  phrases: RawPhrase[];
  phonology: RawPhonology[];
  sources: unknown[];
};

export type AudioReference = {
  file: string;
  url: string;
};

export type DictionaryEntry = RawDictionaryEntry & {
  ipaResolved: string;
  audio: AudioReference | null;
  phonemeBreakdown: OrthographySegment[];
  conceptKey: string;
  searchIndex: string;
  meanings: string[];
  casePhonemes: string[];
};

export type PhraseEntry = RawPhrase & {
  ipaResolved: string;
  phonemeBreakdown: OrthographySegment[];
  audio: AudioReference | null;
};

export type PhonologyEntry = RawPhonology;

export type OhloneCorpus = {
  dictionary: DictionaryEntry[];
  phrases: PhraseEntry[];
  phonology: PhonologyEntry[];
  varieties: Variety[];
  partsOfSpeech: string[];
  statistics: RawCorpus["statistics"];
  sharedConcepts: string[];
};

function repoPath(...segments: string[]) {
  return path.join(process.cwd(), ...segments);
}

function audioUrl(file: string) {
  return `/api/audio/${file.split("/").map(encodeURIComponent).join("/")}`;
}

function conceptKey(english: string) {
  return english
    .toLocaleLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/['".,!?]/g, "")
    .split(/[;/]/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

function splitMeanings(english: string) {
  return english
    .split(/[;/]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export const getCorpus = cache(async (): Promise<OhloneCorpus> => {
  const [corpusText, audioIndexText] = await Promise.all([
    readFile(repoPath("data", "ohlone_master.json"), "utf8"),
    readFile(repoPath("audio", "audio_index.json"), "utf8"),
  ]);

  const corpus = JSON.parse(corpusText) as RawCorpus;
  const audioIndex = JSON.parse(audioIndexText) as RawAudioEntry[];

  const audioLookup = new Map<string, RawAudioEntry>();

  for (const entry of audioIndex) {
    audioLookup.set(
      `${entry.variety}::${canonicalWord(entry.word, entry.variety)}`,
      entry,
    );
  }

  const dictionary = corpus.dictionary.map<DictionaryEntry>((entry) => {
    const audioMatch =
      audioLookup.get(
        `${entry.variety}::${canonicalWord(entry.word, entry.variety)}`,
      ) ?? null;
    const ipaResolved =
      entry.ipa?.trim() || audioMatch?.ipa?.trim() || textToIpa(entry.word, entry.variety);

    return {
      ...entry,
      ipaResolved,
      audio: audioMatch
        ? {
            file: audioMatch.audio_file,
            url: audioUrl(audioMatch.audio_file),
          }
        : null,
      phonemeBreakdown: segmentWord(entry.word, entry.variety),
      conceptKey: conceptKey(entry.english),
      searchIndex: [
        entry.word,
        entry.english,
        entry.pos ?? "",
        entry.variety,
        ipaResolved,
      ]
        .join(" ")
        .toLocaleLowerCase(),
      meanings: splitMeanings(entry.english),
      casePhonemes: CASE_PHONEMES[entry.variety],
    };
  });

  const phraseLookup = new Map(
    audioIndex.map((entry) => [
      `${entry.variety}::${canonicalWord(entry.word, entry.variety)}`,
      entry,
    ]),
  );

  const phrases = corpus.phrases.map<PhraseEntry>((phrase) => {
    const audioMatch =
      phraseLookup.get(
        `${phrase.variety}::${canonicalWord(phrase.phrase, phrase.variety)}`,
      ) ?? null;
    const ipaResolved =
      phrase.ipa?.trim() ||
      audioMatch?.ipa?.trim() ||
      textToIpa(phrase.phrase, phrase.variety);

    return {
      ...phrase,
      ipaResolved,
      phonemeBreakdown: segmentWord(phrase.phrase, phrase.variety),
      audio: audioMatch
        ? {
            file: audioMatch.audio_file,
            url: audioUrl(audioMatch.audio_file),
          }
        : null,
    };
  });

  const conceptCounts = new Map<string, Set<Variety>>();

  for (const entry of dictionary) {
    const concepts = conceptCounts.get(entry.conceptKey) ?? new Set<Variety>();
    concepts.add(entry.variety);
    conceptCounts.set(entry.conceptKey, concepts);
  }

  const sharedConcepts = [...conceptCounts.entries()]
    .filter(([, varieties]) => varieties.size > 1)
    .map(([key]) => key)
    .sort();

  const partsOfSpeech = [...new Set(dictionary.map((entry) => entry.pos ?? "Unknown"))].sort(
    (left, right) => left.localeCompare(right),
  );

  return {
    dictionary,
    phrases,
    phonology: corpus.phonology,
    varieties: [...VARIETY_ORDER],
    partsOfSpeech,
    statistics: corpus.statistics,
    sharedConcepts,
  };
});

export async function getAssistantContext() {
  const [orthographyGuide, encodingAnalysis, corpus] = await Promise.all([
    readFile(repoPath("docs", "orthography-guide.md"), "utf8"),
    readFile(repoPath("docs", "encoding-analysis.md"), "utf8"),
    getCorpus(),
  ]);

  const partsOfSpeech = corpus.partsOfSpeech.join(", ");
  const suffixEntries = corpus.dictionary.filter((entry) =>
    ["Suff.", "Nrevers", "Vrevers", "Perf.", "Pro"].includes(entry.pos ?? ""),
  );

  return {
    orthographyGuide,
    encodingAnalysis,
    partsOfSpeech,
    suffixEntries,
    dictionary: corpus.dictionary.map((entry) => ({
      word: entry.word,
      english: entry.english,
      ipa: entry.ipaResolved,
      pos: entry.pos,
      variety: entry.variety,
      source: entry.source,
    })),
    phonology: corpus.phonology.map((entry) => ({
      symbol: entry.symbol,
      ipa: entry.ipa,
      variety: entry.variety,
      description: entry.description,
      type: entry.type,
      place: entry.place,
      voice: entry.voice,
      is_case_phonemic: entry.is_case_phonemic,
    })),
  };
}

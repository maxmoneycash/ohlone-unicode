export const VARIETY_ORDER = ["Mutsun", "Chochenyo", "OCEN Rumsen", "Ramaytush", "Awaswas"] as const;

export type Variety = (typeof VARIETY_ORDER)[number];

export type OrthographySegment = {
  source: string;
  ipa: string;
  durationMs: number;
};

type Mapping = readonly [source: string, target: string][];

const MUTSUN_TO_IPA: Mapping = [
  ["tY", "tʲ"],
  ["ts", "ts"],
  ["L", "lʲ"],
  ["N", "ɲ"],
  ["S", "ʂ"],
  ["T", "ʈ"],
  ["c", "tʃ"],
  ["h", "h"],
  ["k", "k"],
  ["l", "l"],
  ["m", "m"],
  ["n", "n"],
  ["p", "p"],
  ["r", "ɾ"],
  ["s", "s"],
  ["t", "t"],
  ["w", "w"],
  ["y", "j"],
  ["d", "d"],
  ["ʼ", "ʔ"],
  ["'", "ʔ"],
  ["aa", "aː"],
  ["ee", "eː"],
  ["ii", "iː"],
  ["oo", "oː"],
  ["uu", "uː"],
  ["a", "a"],
  ["e", "e"],
  ["i", "i"],
  ["o", "o"],
  ["u", "u"],
];

const CHOCHENYO_TO_IPA: Mapping = [
  ["T", "ʈ"],
  ["ŝ", "ʃ"],
  ["c", "tʃ"],
  ["s", "ʃ"],
  ["x", "h"],
  ["ʼ", "ʔ"],
  ["'", "ʔ"],
  ["aa", "aː"],
  ["ee", "eː"],
  ["ii", "iː"],
  ["oo", "oː"],
  ["uu", "uː"],
  ["á", "a"],
  ["é", "e"],
  ["í", "i"],
  ["ó", "o"],
  ["ú", "u"],
  ["a", "a"],
  ["e", "e"],
  ["i", "i"],
  ["o", "o"],
  ["u", "u"],
  ["h", "h"],
  ["k", "k"],
  ["l", "l"],
  ["m", "m"],
  ["n", "n"],
  ["p", "p"],
  ["r", "ɾ"],
  ["t", "t"],
  ["w", "w"],
  ["y", "j"],
];

// Ramaytush (SF Peninsula) — King Street plaque orthography
// sh = /ʃ/, ' = glottal stop, doubled vowels = long, otherwise standard Latin
const RAMAYTUSH_TO_IPA: Mapping = [
  ["sh", "ʃ"],
  ["'", "ʔ"],
  ["aa", "aː"],
  ["ee", "eː"],
  ["ii", "iː"],
  ["oo", "oː"],
  ["uu", "uː"],
  ["á", "a"], ["é", "e"], ["í", "i"], ["ó", "o"], ["ú", "u"],
  ["a", "a"], ["e", "e"], ["i", "i"], ["o", "o"], ["u", "u"],
  ["h", "h"], ["k", "k"], ["l", "l"], ["m", "m"], ["n", "n"],
  ["p", "p"], ["r", "ɾ"], ["s", "s"], ["t", "t"], ["w", "w"],
  ["y", "j"], ["ch", "tʃ"], ["c", "k"],
];

// Awaswas (Santa Cruz) — historical mission-era transcription
// Based on Callaghan 1988 wordlists; ch = /tʃ/, standard Latin otherwise
const AWASWAS_TO_IPA: Mapping = [
  ["ch", "tʃ"],
  ["'", "ʔ"],
  ["aa", "aː"], ["ee", "eː"], ["ii", "iː"], ["oo", "oː"], ["uu", "uː"],
  ["a", "a"], ["e", "e"], ["i", "i"], ["o", "o"], ["u", "u"],
  ["h", "h"], ["k", "k"], ["l", "l"], ["m", "m"], ["n", "n"],
  ["p", "p"], ["r", "ɾ"], ["s", "s"], ["t", "t"], ["w", "w"], ["y", "j"],
];

const OCEN_TO_IPA: Mapping = [
  ["T", "ʈ"],
  ["ts", "ts"],
  ["C", "tʃ"],
  ["c", "tʃ"],
  ["X", "h"],
  ["x", "h"],
  ["S", "ʃ"],
  ["s", "ʃ"],
  ["č", "tʃ"],
  ["ş", "ʃ"],
  ["ŝ", "ʃ"],
  ["ţ", "ts"],
  ["ʼ", "ʔ"],
  ["ʔ", "ʔ"],
  ["'", "ʔ"],
  ["aa", "aː"],
  ["ee", "eː"],
  ["ii", "iː"],
  ["oo", "oː"],
  ["uu", "uː"],
  ["á", "a"],
  ["é", "e"],
  ["í", "i"],
  ["ó", "o"],
  ["ú", "u"],
  ["a", "a"],
  ["e", "e"],
  ["i", "i"],
  ["o", "o"],
  ["u", "u"],
  ["h", "h"],
  ["k", "k"],
  ["l", "l"],
  ["m", "m"],
  ["n", "n"],
  ["p", "p"],
  ["r", "ɾ"],
  ["t", "t"],
  ["w", "w"],
  ["y", "j"],
];

export const VARIETY_IPA_MAPS: Record<Variety, Mapping> = {
  Mutsun: MUTSUN_TO_IPA,
  Chochenyo: CHOCHENYO_TO_IPA,
  "OCEN Rumsen": OCEN_TO_IPA,
  Ramaytush: RAMAYTUSH_TO_IPA,
  Awaswas: AWASWAS_TO_IPA,
};

const ESPEAK_IPA_FIXES: readonly [source: string, target: string][] = [
  ["ʂ", "ʃ"],
  ["lʲ", "lj"],
  ["tʲ", "tj"],
];

const MAPPING_PRESERVE_CASE: Record<Variety, string[]> = {
  Mutsun: ["L", "N", "S", "T", "Y"],
  Chochenyo: ["T"],
  "OCEN Rumsen": ["T"],
  Ramaytush: [],
  Awaswas: [],
};

export const CASE_PHONEMES: Record<Variety, string[]> = {
  Mutsun: ["L", "N", "S", "T"],
  Chochenyo: ["T"],
  "OCEN Rumsen": ["T"],
  Ramaytush: [],
  Awaswas: [],
};

export function normalizeGlottalStops(text: string) {
  return text.replace(/['’‘`´]/g, "ʼ");
}

export function stripStress(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

export function canonicalWord(word: string, variety: Variety) {
  const preserve = new Set(MAPPING_PRESERVE_CASE[variety]);
  return stripStress(normalizeGlottalStops(word))
    .split("")
    .map((character) =>
      preserve.has(character) ? character : character.toLocaleLowerCase(),
    )
    .join("");
}

export function tokenizeOhloneText(text: string) {
  return normalizeGlottalStops(text).match(/[\p{L}\p{M}ʼʔ-]+/gu) ?? [];
}

export function ipaForEspeak(ipa: string) {
  return ESPEAK_IPA_FIXES.reduce(
    (current, [source, target]) => current.replaceAll(source, target),
    ipa,
  );
}

export function wordToIpa(word: string, variety: Variety) {
  const mapping = VARIETY_IPA_MAPS[variety];
  const clean = normalizeGlottalStops(word.trim()).replace(/^[*-]+/, "");
  const segments: string[] = [];

  for (let index = 0; index < clean.length; ) {
    const match = mapping.find(([source]) => clean.startsWith(source, index));
    if (match) {
      segments.push(match[1]);
      index += match[0].length;
      continue;
    }

    segments.push(clean[index] ?? "");
    index += 1;
  }

  return segments.join("");
}

export function estimateSegmentDuration(ipa: string) {
  if (ipa.includes("ː")) {
    return 300;
  }

  if (["a", "e", "i", "o", "u"].includes(ipa)) {
    return 150;
  }

  if (["p", "t", "k", "ʈ", "ʔ", "d"].includes(ipa)) {
    return 80;
  }

  if (["s", "ʃ", "ʂ", "h", "x", "ɲ"].includes(ipa)) {
    return 120;
  }

  if (["tʃ", "ts", "tʲ"].includes(ipa)) {
    return 110;
  }

  if (["l", "lʲ", "m", "n", "ɾ", "w", "j"].includes(ipa)) {
    return 100;
  }

  return 120;
}

export function segmentWord(word: string, variety: Variety): OrthographySegment[] {
  const mapping = VARIETY_IPA_MAPS[variety];
  const clean = normalizeGlottalStops(word.trim()).replace(/^[*-]+/, "");
  const segments: OrthographySegment[] = [];

  for (let index = 0; index < clean.length; ) {
    const match = mapping.find(([source]) => clean.startsWith(source, index));

    if (match) {
      segments.push({
        source: match[0],
        ipa: match[1],
        durationMs: estimateSegmentDuration(match[1]),
      });
      index += match[0].length;
      continue;
    }

    const character = clean[index] ?? "";
    segments.push({
      source: character,
      ipa: character,
      durationMs: estimateSegmentDuration(character),
    });
    index += 1;
  }

  return segments;
}

export function textToIpa(text: string, variety: Variety) {
  return tokenizeOhloneText(text)
    .map((token) => wordToIpa(token, variety))
    .join(" ");
}

export function timelineForText(text: string, variety: Variety) {
  return tokenizeOhloneText(text).flatMap((token) =>
    segmentWord(token, variety).map((segment) => ({
      ...segment,
      token,
    })),
  );
}

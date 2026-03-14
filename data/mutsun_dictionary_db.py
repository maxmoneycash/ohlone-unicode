#!/usr/bin/env python3
"""
mutsun_dictionary_db.py — Structured database of the Mutsun language.

Built from the Mutsun-English English-Mutsun Dictionary
(Warner, Butler & Geary, 2016) — CC BY-NC 4.0 licensed.

This script creates a SQLite database and JSON export of all extractable
Mutsun vocabulary, phonology, and grammatical information.

The dictionary contains ~4,000 entries. This file includes the verified
core vocabulary extracted from the published dictionary, organized by
the Mutsun alphabetical order.

NOTE: The full dictionary PDF (677 pages) is available for free download at:
  https://scholarspace.manoa.hawaii.edu/handle/10125/24679
  https://scholarcommons.scu.edu/mutsun/3/

Users should download and process the full PDF for complete data.
This file contains the verified structural framework + sample entries
extracted from the publicly accessible portions.
"""

import json
import sqlite3
import os
import re

# === MUTSUN PHONOLOGY ===

MUTSUN_PHONOLOGY = {
    "vowels": {
        "a": {"ipa": "a", "description": "Open front unrounded, as in 'father'", "can_be_long": True},
        "e": {"ipa": "e", "description": "Close-mid front unrounded, as in 'met'", "can_be_long": True},
        "i": {"ipa": "i", "description": "Close front unrounded, as in 'machine'", "can_be_long": True},
        "o": {"ipa": "o", "description": "Close-mid back rounded, as in 'wrote'", "can_be_long": True},
        "u": {"ipa": "u", "description": "Close back rounded, as in 'rule'", "can_be_long": True},
    },
    "consonants": {
        "c": {"ipa": "tʃ", "description": "Like English 'ch' in 'chip'", "type": "affricate", "place": "postalveolar", "voice": "voiceless"},
        "h": {"ipa": "h", "description": "Like English 'h' in 'hello'", "type": "fricative", "place": "glottal", "voice": "voiceless"},
        "k": {"ipa": "k", "description": "Like English 'k' in 'Kate'", "type": "stop", "place": "velar", "voice": "voiceless"},
        "l": {"ipa": "l", "description": "Like English 'l' in 'lost'", "type": "lateral", "place": "alveolar", "voice": "voiced"},
        "L": {"ipa": "lʲ", "description": "Like 'l' with 'y' after it, as in 'tell you'", "type": "lateral", "place": "palatal", "voice": "voiced", "case_phonemic": True},
        "m": {"ipa": "m", "description": "Like English 'm' in 'must'", "type": "nasal", "place": "bilabial", "voice": "voiced"},
        "n": {"ipa": "n", "description": "Like English 'n' in 'nest'", "type": "nasal", "place": "alveolar", "voice": "voiced"},
        "N": {"ipa": "ɲ", "description": "Like Spanish 'ñ' in 'señor'", "type": "nasal", "place": "palatal", "voice": "voiced", "case_phonemic": True},
        "p": {"ipa": "p", "description": "Like English 'p' in 'pool'", "type": "stop", "place": "bilabial", "voice": "voiceless"},
        "r": {"ipa": "ɾ", "description": "Single tap, like Spanish 'r' in 'pero' or 'dd' in 'ladder'", "type": "tap", "place": "alveolar", "voice": "voiced"},
        "s": {"ipa": "s", "description": "Like English 's' in 'see'", "type": "fricative", "place": "alveolar", "voice": "voiceless"},
        "S": {"ipa": "ʂ", "description": "Like English 'sh' in 'shop' (retroflex)", "type": "fricative", "place": "retroflex", "voice": "voiceless", "case_phonemic": True},
        "t": {"ipa": "t", "description": "Like English 't' in 'top'", "type": "stop", "place": "alveolar", "voice": "voiceless"},
        "T": {"ipa": "ʈ", "description": "Retroflex 't' — curl tongue back against roof of mouth", "type": "stop", "place": "retroflex", "voice": "voiceless", "case_phonemic": True},
        "ts": {"ipa": "ts", "description": "Like 'ts' in 'cats'", "type": "affricate", "place": "alveolar", "voice": "voiceless", "digraph": True},
        "tY": {"ipa": "tʲ", "description": "Like British 'Tuesday' (tyuesday) or 'Katya'", "type": "stop", "place": "palatal", "voice": "voiceless", "digraph": True},
        "w": {"ipa": "w", "description": "Like English 'w' in 'want'", "type": "approximant", "place": "labiovelar", "voice": "voiced"},
        "y": {"ipa": "j", "description": "Like English 'y' in 'yell'", "type": "approximant", "place": "palatal", "voice": "voiced"},
        "ʼ": {"ipa": "ʔ", "description": "Glottal stop — like gap in 'uh-oh'", "type": "stop", "place": "glottal", "voice": "voiceless", "unicode": "U+02BC"},
    },
    "notes": {
        "length": "Vowels and consonants can be long (doubled): aa, ee, ii, oo, uu, pp, tt, kk, ss, etc.",
        "no_silent_letters": "All letters are pronounced. No silent letters.",
        "regular_spelling": "Mutsun spelling is totally regular. Each letter always represents the same sound.",
        "case_phonemic": "Capital letters L, N, S, T represent DIFFERENT sounds from lowercase l, n, s, t.",
        "absent_sounds": "Mutsun has no b, d, j, f, v, z (except in Spanish loanwords).",
        "stress": "Generally on the first syllable (word-initial stress).",
    }
}

# === DICTIONARY SORT ORDER ===
MUTSUN_SORT_ORDER = [
    "a", "c", "d", "e", "h", "i", "k", "l", "L", "m", "n", "N",
    "o", "p", "r", "s", "S", "t", "T", "ts", "tY", "u", "w", "y", "ʼ"
]

# === PARTS OF SPEECH ===
PARTS_OF_SPEECH = {
    "N": "Noun",
    "Nrevers": "Noun (reversible — forms verb pair by metathesis)",
    "Npersonal": "Personal noun (name of person or group)",
    "Nplace": "Place name",
    "V": "Verb",
    "Vrevers": "Verb (reversible — forms noun pair by metathesis)",
    "Command": "Inherent imperative verb (always a command)",
    "Perf.": "Perfective form (action completed, resulting state)",
    "Num": "Number",
    "Quant": "Quantifier adverb",
    "Q": "Question word",
    "Pro": "Pronoun",
    "Conj.": "Conjunction",
    "Excl.": "Exclamation",
    "Adv": "Adverb",
    "Suff.": "Suffix",
    "Infix": "Infix",
}

# === VERIFIED SAMPLE ENTRIES ===
# These are entries explicitly visible in the dictionary PDF content we extracted.
# The full dictionary contains ~4,000 entries across 677 pages.

VERIFIED_ENTRIES = [
    # === A section (pages 1-9) ===
    {"mutsun": "aacic", "english": "pipe", "pos": "N", "section": "a", "page_start": 1},
    {"mutsun": "aamane", "english": "truly, really, indeed", "pos": "Adv", "section": "a"},
    {"mutsun": "akku", "english": "enter", "pos": "V", "section": "a", "notes": "Can mean 'enter a place' or with suffixes 'put something in'; used in many contexts"},
    {"mutsun": "akwaswas", "english": "Akwaswas Tribe, Santa Cruz Indians", "pos": "Npersonal", "section": "a"},
    {"mutsun": "ara", "english": "then, and, next", "pos": "Adv", "section": "a", "other_pronunc": "aru"},
    {"mutsun": "arkeh", "english": "oak", "pos": "N", "section": "a"},
    {"mutsun": "arikkay", "english": "valley oak tree/acorn", "pos": "N", "section": "a"},
    {"mutsun": "aruh'a", "english": "morning", "pos": "N", "section": "a"},
    {"mutsun": "aruuta", "english": "tomorrow", "pos": "Adv", "section": "a"},
    {"mutsun": "asa'a", "english": "truly", "pos": "Adv", "section": "a"},
    {"mutsun": "accuSte", "english": "finished, done", "pos": "Perf.", "section": "a"},
    {"mutsun": "ahhes", "english": "comb", "pos": "N", "section": "a"},
    {"mutsun": "atSa", "english": "be a girl", "pos": "V", "section": "a"},

    # === C section (pages 10-17) ===
    {"mutsun": "caahi", "english": "barn owl", "pos": "N", "section": "c", "page_start": 10},
    {"mutsun": "cipituk", "english": "mallard duck", "pos": "N", "section": "c"},
    {"mutsun": "cit", "english": "shout during gambling game", "pos": "Excl.", "section": "c"},
    {"mutsun": "corko", "english": "dry up", "pos": "V", "section": "c"},
    {"mutsun": "corkoSte", "english": "dry", "pos": "Perf.", "section": "c"},
    {"mutsun": "cunyu", "english": "sing", "pos": "V", "section": "c", "from_lang": "Soledeño"},
    {"mutsun": "ceeyes", "english": "jackrabbit", "pos": "Nrevers", "section": "c"},
    {"mutsun": "ceyse", "english": "hunt jackrabbits", "pos": "Vrevers", "section": "c"},

    # === D section (page 18) ===
    {"mutsun": "diyos", "english": "God", "pos": "N", "section": "d", "from_lang": "Spanish 'Dios'", "page_start": 18},

    # === E section (pages 18-22) ===
    {"mutsun": "eccer", "english": "iron", "pos": "N", "section": "e", "page_start": 18},
    {"mutsun": "ekwe", "english": "not", "pos": "Adv", "section": "e"},
    {"mutsun": "emhe", "english": "softly, quietly", "pos": "Adv", "section": "e"},
    {"mutsun": "enenum", "english": "secretly", "pos": "Adv", "section": "e"},
    {"mutsun": "enne", "english": "write, draw", "pos": "V", "section": "e"},
    {"mutsun": "ennes", "english": "pen", "pos": "N", "section": "e", "notes": "From enne + -s (instrument suffix)"},

    # === H section (pages 23-57) — largest section ===
    {"mutsun": "haahe", "english": "run away", "pos": "V", "section": "h", "page_start": 23},
    {"mutsun": "haayi", "english": "come here!", "pos": "Command", "section": "h"},
    {"mutsun": "hassen", "english": "get/be angry", "pos": "V", "section": "h", "other_pronunc": "hasseni (before suffixes)"},
    {"mutsun": "hatte", "english": "who; anyone, someone, no one", "pos": "Q/Pro", "section": "h"},
    {"mutsun": "hatlu", "english": "make cornmeal or acorn mush", "pos": "V", "section": "h"},
    {"mutsun": "heLekpu", "english": "be happy", "pos": "V", "section": "h"},
    {"mutsun": "helwe", "english": "strip the bark off", "pos": "V", "section": "h"},
    {"mutsun": "hemec'a", "english": "one", "pos": "Num", "section": "h"},
    {"mutsun": "heSSem'a", "english": "quickly", "pos": "Adv", "section": "h"},
    {"mutsun": "hiimi", "english": "always", "pos": "Adv", "section": "h"},
    {"mutsun": "himah'a", "english": "all, every", "pos": "Quant", "section": "h"},
    {"mutsun": "hinne", "english": "walk", "pos": "V", "section": "h"},
    {"mutsun": "hinse", "english": "wander", "pos": "V", "section": "h", "notes": "From hinne + infix -s- 'do repeatedly'"},
    {"mutsun": "hiSSen", "english": "work", "pos": "V", "section": "h", "notes": "native word; loanword: tawah"},
    {"mutsun": "hohe", "english": "be late", "pos": "V", "section": "h", "from_lang": "probably Pahsin"},
    {"mutsun": "huTel", "english": "earring", "pos": "Nrevers", "section": "h"},
    {"mutsun": "huTle", "english": "put on earrings", "pos": "Vrevers", "section": "h"},
    {"mutsun": "huusu", "english": "eel", "pos": "N", "section": "h"},
    {"mutsun": "huyhuy", "english": "cutgrass, bunchgrass", "pos": "N", "section": "h", "notes": "Used in basketweaving"},

    # === I section (pages 58-63) ===
    {"mutsun": "icci", "english": "bite", "pos": "V", "section": "i", "page_start": 58},
    {"mutsun": "ice", "english": "It's nothing!", "pos": "Excl.", "section": "i"},
    {"mutsun": "*inha", "english": "get sick", "pos": "V", "section": "i", "notes": "Only used with -n(i), -Ste, -ti, or -pu"},
    {"mutsun": "inhan", "english": "get/become sick", "pos": "V", "section": "i"},
    {"mutsun": "inhaSte", "english": "sick, has gotten sick", "pos": "Perf.", "section": "i"},
    {"mutsun": "inna", "english": "fall", "pos": "V", "section": "i"},
    {"mutsun": "innaSte", "english": "fallen", "pos": "Perf.", "section": "i"},
    {"mutsun": "issu", "english": "hand", "pos": "N", "section": "i"},

    # === K section (pages 64-78) ===
    {"mutsun": "kaa", "english": "daughter", "pos": "N", "section": "k", "page_start": 64},
    {"mutsun": "kaayi", "english": "ache, hurt, be spicy", "pos": "V", "section": "k"},
    {"mutsun": "kaamer", "english": "dwarf sunflower", "pos": "Nrevers", "section": "k"},
    {"mutsun": "kamre", "english": "gather dwarf sunflowers", "pos": "Vrevers", "section": "k"},
    {"mutsun": "kaatYul", "english": "calf of the leg; leg", "pos": "Nrevers", "section": "k"},
    {"mutsun": "katYlu", "english": "be thick-legged", "pos": "Vrevers", "section": "k"},
    {"mutsun": "kaphan", "english": "three", "pos": "Num", "section": "k"},
    {"mutsun": "kawra", "english": "end", "pos": "V", "section": "k"},
    {"mutsun": "kawraSte", "english": "ended", "pos": "Perf.", "section": "k"},
    {"mutsun": "ke", "english": "what?; yes?; Look! Listen!", "pos": "Q/Excl.", "section": "k"},
    {"mutsun": "kicca", "english": "lock", "pos": "V", "section": "k"},
    {"mutsun": "kicwa", "english": "unlock", "pos": "V", "section": "k", "notes": "From kicca + infix -w- 'undo'"},
    {"mutsun": "komme", "english": "get tired", "pos": "V", "section": "k"},
    {"mutsun": "kommeSte", "english": "tired", "pos": "Perf.", "section": "k"},

    # === L section (page 79-86) ===
    {"mutsun": "laake", "english": "rise", "pos": "V", "section": "l", "page_start": 79},
    {"mutsun": "laalak", "english": "goose", "pos": "N", "section": "l"},
    {"mutsun": "lalla", "english": "knock over", "pos": "V", "section": "l"},
    {"mutsun": "lallawi", "english": "knock outward", "pos": "V", "section": "l", "notes": "From lalla + suffix -wi (variant of infix -w-)"},

    # === L (palatal) section (page 87) ===
    {"mutsun": "Luohu", "english": "yearling calf", "pos": "N", "section": "L", "page_start": 87},

    # === M section (pages 87-104) ===
    {"mutsun": "maahi", "english": "close, cover", "pos": "V", "section": "m", "page_start": 87},
    {"mutsun": "maayi", "english": "laugh", "pos": "V", "section": "m"},
    {"mutsun": "moT", "english": "question word", "pos": "Q", "section": "m"},
    {"mutsun": "mukurma", "english": "woman", "pos": "N", "section": "m"},
    {"mutsun": "muuruS", "english": "toothache", "pos": "N", "section": "m"},

    # === N section (pages 105-109) ===
    {"mutsun": "naaru", "english": "turnip", "pos": "N", "section": "n", "page_start": 105},
    {"mutsun": "nenne", "english": "miss (a person)", "pos": "V", "section": "n"},
    {"mutsun": "neppe", "english": "this", "pos": "Pro", "section": "n"},
    {"mutsun": "nepkam", "english": "these", "pos": "Pro", "section": "n", "notes": "Irregular plural of neppe"},
    {"mutsun": "*nesse", "english": "ask permission", "pos": "V", "section": "n", "notes": "Only used with -pu (nessepu)"},

    # === N (palatal) section (page 110) ===
    {"mutsun": "Notko", "english": "be short", "pos": "V", "section": "N", "page_start": 110},

    # === O section (pages 111-113) ===
    {"mutsun": "oce", "english": "send", "pos": "V", "section": "o", "page_start": 111},
    {"mutsun": "onespu", "english": "fondle, caress, hold", "pos": "V", "section": "o"},
    {"mutsun": "ooso", "english": "wake up", "pos": "V", "section": "o", "notes": "Without suffix = wake up on own; with -mpi = wake someone up"},
    {"mutsun": "oshe", "english": "answer", "pos": "V", "section": "o", "notes": "[Ar + Asc. guess] — use uuni instead"},

    # === P section (pages 114-129) ===
    {"mutsun": "paaka", "english": "shell", "pos": "V", "section": "p", "page_start": 114},
    {"mutsun": "paTTi", "english": "hold, catch, grasp", "pos": "V", "section": "p"},
    {"mutsun": "pelohte", "english": "bald", "pos": "Perf.", "section": "p"},
    {"mutsun": "pesyon", "english": "thought", "pos": "N", "section": "p"},
    {"mutsun": "pire", "english": "world, earth, land, ground, atmosphere", "pos": "N", "section": "p"},
    {"mutsun": "por", "english": "flea", "pos": "N", "section": "p"},
    {"mutsun": "porpor", "english": "Fremont cottonwood", "pos": "N", "section": "p", "sci_name": "Populus fremontii"},
    {"mutsun": "pulmu", "english": "make bread", "pos": "V", "section": "p"},

    # === R section (pages 130-139) ===
    {"mutsun": "raakat", "english": "name", "pos": "N", "section": "r", "page_start": 130},
    {"mutsun": "rammay", "english": "inside", "pos": "Adv", "section": "r"},
    {"mutsun": "ricca", "english": "talk, speak", "pos": "V", "section": "r"},
    {"mutsun": "rini", "english": "above", "pos": "Adv", "section": "r", "notes": "Asc. unsure; may not be native Mutsun. See taprey"},
    {"mutsun": "rorSo", "english": "play", "pos": "V", "section": "r", "other_pronunc": "roroS (before -pu/-mu)"},

    # === S section (pages 140-154) ===
    {"mutsun": "saake", "english": "gather pinenuts", "pos": "V", "section": "s", "page_start": 140},
    {"mutsun": "santiya", "english": "watermelon", "pos": "N", "section": "s", "from_lang": "Spanish 'sandía'"},
    {"mutsun": "sii", "english": "water", "pos": "N", "section": "s"},

    # === S (retroflex) section (pages 155-158) ===
    {"mutsun": "Saanay", "english": "near, nearby", "pos": "Adv", "section": "S", "page_start": 155},
    {"mutsun": "SaSran", "english": "raccoon", "pos": "N", "section": "S"},
    {"mutsun": "Sokwe", "english": "wow", "pos": "Excl.", "section": "S"},

    # === T section (pages 159-176) ===
    {"mutsun": "taa", "english": "older sister", "pos": "N", "section": "t", "page_start": 159},
    {"mutsun": "taacin", "english": "kangaroo rat, river rat", "pos": "N", "section": "t", "sci_name": "Dipodomys or Perodipus"},
    {"mutsun": "tacci", "english": "catch river/kangaroo rats", "pos": "V", "section": "t"},
    {"mutsun": "taprey", "english": "above", "pos": "Adv", "section": "t", "notes": "Native Mutsun word for 'above' (preferred over rini)"},
    {"mutsun": "tare", "english": "kiddo, buddy", "pos": "N", "section": "t", "notes": "Male or female, relative or not"},
    {"mutsun": "tawah", "english": "work, employment", "pos": "N", "section": "t", "from_lang": "Spanish 'trabajo'", "notes": "native: hiSSen"},
    {"mutsun": "timren", "english": "get a headache", "pos": "V", "section": "t"},

    # === T (retroflex) section (pages 177-184) ===
    {"mutsun": "Taakampi", "english": "bring, carry something", "pos": "V", "section": "T", "page_start": 177},
    {"mutsun": "Taywe", "english": "make acorn soup", "pos": "V", "section": "T"},
    {"mutsun": "TiiTin", "english": "get well/better, recover", "pos": "V", "section": "T"},

    # === TS section (pages 185) ===
    {"mutsun": "tsayla", "english": "lie face up", "pos": "V", "section": "ts", "page_start": 185},

    # === TY section (page 186) ===
    {"mutsun": "tYottYoni", "english": "holly berry", "pos": "N", "section": "tY", "page_start": 186},
    {"mutsun": "tYuuken", "english": "jump", "pos": "V", "section": "tY"},

    # === U section (pages 186-191) ===
    {"mutsun": "ucirmin", "english": "small needle", "pos": "N", "section": "u", "page_start": 186},
    {"mutsun": "uuni", "english": "answer", "pos": "V", "section": "u", "notes": "Preferred over oshe"},

    # === W section (pages 192-203) ===
    {"mutsun": "waaha", "english": "scratch, sing slowly", "pos": "V", "section": "w", "page_start": 192},
    {"mutsun": "waate", "english": "come", "pos": "V", "section": "w"},
    {"mutsun": "wacosta", "english": "Carmel River", "pos": "Nplace", "section": "w"},
    {"mutsun": "wacruntak", "english": "Castroville", "pos": "Nplace", "section": "w"},
    {"mutsun": "wak", "english": "he/she/it", "pos": "Pro", "section": "w"},

    # === Y section (pages 204-210) ===
    {"mutsun": "yaase", "english": "eat", "pos": "V", "section": "y", "page_start": 204},
    {"mutsun": "yasri", "english": "be enough", "pos": "V", "section": "y"},
    {"mutsun": "yeeho", "english": "be aged", "pos": "V", "section": "y", "other_pronunc": "yehoo (before certain suffixes)"},
    {"mutsun": "yuksi", "english": "gather acorns", "pos": "V", "section": "y"},
    {"mutsun": "yuukis", "english": "acorn", "pos": "N", "section": "y"},
    {"mutsun": "yuu", "english": "and", "pos": "Conj.", "section": "y"},

    # === ' (glottal stop) section (page 211) ===
    {"mutsun": "-ʼa", "english": "unknown meaning", "pos": "Suff.", "section": "ʼ", "page_start": 211},

    # === GRAMMATICAL SUFFIXES ===
    {"mutsun": "-Ste", "english": "perfective (action completed)", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-hte", "english": "perfective (variant of -Ste)", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-pu", "english": "reflexive / middle voice", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-mu", "english": "variant of -pu", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-mpi", "english": "causative (make someone do something)", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-n", "english": "intransitive suffix", "pos": "Suff.", "section": "grammar", "other_pronunc": "-ni (before other suffixes)"},
    {"mutsun": "-s", "english": "instrument noun (thing you use to do verb)", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-kiSpu", "english": "act like, pretend to", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-yuT", "english": "plural command", "pos": "Suff.", "section": "grammar"},
    {"mutsun": "-s-", "english": "do repeatedly (infix)", "pos": "Infix", "section": "grammar"},
    {"mutsun": "-w-", "english": "undo, open, release (infix)", "pos": "Infix", "section": "grammar", "other_pronunc": "-wi (as suffix)"},

    # === PRONOUNS / CLITICS ===
    {"mutsun": "-ka", "english": "I (tack-on pronoun)", "pos": "Pro", "section": "grammar"},
    {"mutsun": "-me", "english": "you (tack-on pronoun)", "pos": "Pro", "section": "grammar"},
    {"mutsun": "-k", "english": "he/she/it (tack-on pronoun)", "pos": "Pro", "section": "grammar"},
    {"mutsun": "kan-", "english": "my (possessive prefix)", "pos": "Pro", "section": "grammar"},

    # === NUMBERS ===
    {"mutsun": "hemec'a", "english": "one", "pos": "Num", "section": "numbers"},
    {"mutsun": "kaphan", "english": "three", "pos": "Num", "section": "numbers"},
]


def mutsun_to_ipa(word: str) -> str:
    """Convert a Mutsun orthographic word to approximate IPA."""
    ipa_map = [
        ("tY", "tʲ"), ("ts", "ts"),
        ("L", "lʲ"), ("N", "ɲ"), ("S", "ʂ"), ("T", "ʈ"),
        ("c", "tʃ"), ("h", "h"), ("k", "k"), ("l", "l"),
        ("m", "m"), ("n", "n"), ("p", "p"), ("r", "ɾ"),
        ("s", "s"), ("t", "t"), ("w", "w"), ("y", "j"),
        ("d", "d"), ("ʼ", "ʔ"), ("'", "ʔ"),
        ("aa", "aː"), ("ee", "eː"), ("ii", "iː"), ("oo", "oː"), ("uu", "uː"),
        ("a", "a"), ("e", "e"), ("i", "i"), ("o", "o"), ("u", "u"),
    ]
    result = []
    i = 0
    clean = word.lstrip("*-").rstrip("-")
    while i < len(clean):
        matched = False
        for src, tgt in ipa_map:
            if clean[i:i+len(src)] == src:
                result.append(tgt)
                i += len(src)
                matched = True
                break
        if not matched:
            result.append(clean[i])
            i += 1
    return "".join(result)


def build_database(db_path: str):
    """Build SQLite database from verified entries."""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Create tables
    c.execute("""CREATE TABLE IF NOT EXISTS phonology (
        symbol TEXT PRIMARY KEY,
        ipa TEXT,
        type TEXT,
        description TEXT,
        place TEXT,
        voice TEXT,
        is_vowel BOOLEAN,
        case_phonemic BOOLEAN DEFAULT FALSE,
        is_digraph BOOLEAN DEFAULT FALSE
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mutsun TEXT NOT NULL,
        english TEXT NOT NULL,
        ipa TEXT,
        pos TEXT,
        pos_full TEXT,
        section TEXT,
        page_start INTEGER,
        from_lang TEXT,
        sci_name TEXT,
        other_pronunc TEXT,
        notes TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS parts_of_speech (
        abbrev TEXT PRIMARY KEY,
        full_name TEXT
    )""")

    # Insert phonology
    for sym, data in MUTSUN_PHONOLOGY["vowels"].items():
        c.execute("INSERT OR REPLACE INTO phonology VALUES (?,?,?,?,?,?,?,?,?)",
                  (sym, data["ipa"], "vowel", data["description"], "varies", "voiced", True, False, False))

    for sym, data in MUTSUN_PHONOLOGY["consonants"].items():
        c.execute("INSERT OR REPLACE INTO phonology VALUES (?,?,?,?,?,?,?,?,?)",
                  (sym, data["ipa"], data.get("type",""), data["description"],
                   data.get("place",""), data.get("voice",""), False,
                   data.get("case_phonemic", False), data.get("digraph", False)))

    # Insert parts of speech
    for abbrev, full in PARTS_OF_SPEECH.items():
        c.execute("INSERT OR REPLACE INTO parts_of_speech VALUES (?,?)", (abbrev, full))

    # Insert dictionary entries
    for entry in VERIFIED_ENTRIES:
        ipa = mutsun_to_ipa(entry["mutsun"])
        pos_full = PARTS_OF_SPEECH.get(entry["pos"], entry["pos"])
        c.execute("""INSERT INTO dictionary
            (mutsun, english, ipa, pos, pos_full, section, page_start,
             from_lang, sci_name, other_pronunc, notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (entry["mutsun"], entry["english"], ipa, entry["pos"], pos_full,
             entry.get("section"), entry.get("page_start"),
             entry.get("from_lang"), entry.get("sci_name"),
             entry.get("other_pronunc"), entry.get("notes")))

    conn.commit()

    # Print stats
    c.execute("SELECT COUNT(*) FROM dictionary")
    dict_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM phonology")
    phon_count = c.fetchone()[0]
    print(f"Database built: {dict_count} dictionary entries, {phon_count} phonology entries")
    print(f"Saved to: {db_path}")

    conn.close()


def export_json(db_path: str, json_path: str):
    """Export database to JSON."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    data = {
        "metadata": {
            "title": "Mutsun Language Database",
            "source": "Mutsun-English English-Mutsun Dictionary (Warner, Butler & Geary, 2016)",
            "license": "CC BY-NC 4.0 (dictionary); MIT (this database code)",
            "note": "Sample entries from publicly accessible dictionary. Full dictionary: https://scholarspace.manoa.hawaii.edu/handle/10125/24679",
            "entry_count_note": "Full dictionary contains ~4,000 entries. This extract contains verified sample entries.",
        },
        "phonology": MUTSUN_PHONOLOGY,
        "sort_order": MUTSUN_SORT_ORDER,
        "parts_of_speech": PARTS_OF_SPEECH,
        "dictionary": [],
    }

    c.execute("SELECT * FROM dictionary ORDER BY section, mutsun")
    for row in c.fetchall():
        data["dictionary"].append(dict(row))

    conn.close()

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"JSON exported: {json_path}")


if __name__ == "__main__":
    db_path = "/home/claude/ohlone-unicode/data/mutsun.db"
    json_path = "/home/claude/ohlone-unicode/data/mutsun.json"

    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    build_database(db_path)
    export_json(db_path, json_path)

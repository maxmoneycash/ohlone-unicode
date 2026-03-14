# Ohlone Language Family — Character Inventory

This document catalogs every character needed to write the attested Ohlone language varieties, based on published dictionaries, grammars, and community-developed orthographies.

## 1. Common Latin Base Characters

All Ohlone varieties share the following standard Latin characters:

**Lowercase:** a, c, d, e, h, i, k, l, m, n, o, p, r, s, t, u, w, y

**Notes:**
- `b`, `f`, `g`, `j`, `q`, `v`, `z` are generally absent from native vocabulary but may appear in loanwords (e.g., Mutsun `diyos` "God" from Spanish)
- Vowels: All varieties use the five-vowel system `a, e, i, o, u` with Spanish-like pronunciation

## 2. Mutsun Character Inventory

Source: Warner, Butler & Geary (2016), *Mutsun-English English-Mutsun Dictionary*

### 2.1 Special Characters

| Orthographic Symbol | IPA Value | Unicode | Description |
|---------------------|-----------|---------|-------------|
| L | /lʲ/ or /ʎ/ | U+004C (Latin Capital L) | Palatalized lateral; **distinct phoneme from lowercase `l`** |
| N | /ɲ/ | U+004E (Latin Capital N) | Palatal nasal; **distinct phoneme from lowercase `n`** |
| S | /ʂ/ or /ʃ/ | U+0053 (Latin Capital S) | Retroflex or postalveolar fricative; **distinct phoneme from lowercase `s`** |
| T | /ʈ/ | U+0054 (Latin Capital T) | Retroflex stop; **distinct phoneme from lowercase `t`** |
| ts | /ts/ | U+0074 + U+0073 | Alveolar affricate; digraph |
| tY | /tʲ/ or /c/ | U+0074 + U+0059 | Palatal stop; digraph |
| ʼ | /ʔ/ | U+02BC | Glottal stop (modifier letter apostrophe) |

### 2.2 Encoding Issue: Case-Distinct Phonemes

Mutsun is **unusual among Latin-script languages** in that uppercase letters L, N, S, T function as entirely separate phonemes from their lowercase counterparts. This creates several digital challenges:

- **Case folding breaks meaning**: If software lowercases "Saanay" (retroflex S, meaning "nearby"), it becomes "saanay" (alveolar s), a different phoneme
- **Searching**: Case-insensitive search conflates distinct words
- **Sorting/collation**: Standard Unicode collation treats L/l as equivalent
- **Auto-capitalization**: Mobile keyboards and text processors will incorrectly capitalize or lowercase these letters

**Potential solutions:**
1. Use dedicated Unicode characters (e.g., Ʂ U+0282 for retroflex S)
2. Define a custom locale with Ohlone-specific collation rules (CLDR)
3. Propose annotation of existing characters for Ohlone usage

### 2.3 Length Marking

Vowel and consonant length is indicated by doubling the character:

| Short | Long | Example |
|-------|------|---------|
| a | aa | `aacic` "pipe" |
| o | oo | `toolos` "knee" [toːlos] |
| t | tt | |
| k | kk | `akka` |

### 2.4 Complete Mutsun Alphabet (Dictionary Order)

```
a  c  d  e  h  i  k  l  L  m  n  N  o  p  r  s  S  t  T  ts  tY  u  w  y  ʼ
```

Total: 25 entries (22 single characters + 2 digraphs + 1 modifier)

## 3. Rumsen Character Inventory

Source: Kaufman (2008); Kroeber (1904); Okrand (1977)

### 3.1 Special Characters

| Orthographic Symbol | IPA Value | Unicode | Description |
|---------------------|-----------|---------|-------------|
| č | /tʃ/ | U+010D | Voiceless postalveolar affricate |
| ş | /ʃ/ | U+015F | Voiceless postalveolar fricative |
| ţ | /ts/ | U+0163 | Voiceless alveolar affricate |
| ŝ | /ʃ/ | U+015D | Alternative postalveolar fricative |
| x | /x/ | U+0078 | Voiceless velar fricative |
| ʼ / ʔ | /ʔ/ | U+02BC / U+0294 | Glottal stop |

### 3.2 Length Marking

Same convention as Mutsun — doubling of vowels and consonants.

## 4. Chochenyo Character Inventory

Source: Muwekma Ohlone Tribe language materials; Harrington field notes; acorn.wiki

### 4.1 Special Characters

| Orthographic Symbol | IPA Value | Unicode | Description |
|---------------------|-----------|---------|-------------|
| c | /tʃ/ | U+0063 | Postalveolar affricate (reuse of basic Latin `c`) |
| s | /ʃ/ | U+0073 | Postalveolar fricative (reuse of basic Latin `s`) |
| x | /h/ | U+0078 | Glottal fricative |
| T | /ʈ/ | U+0054 | Retroflex stop |
| ʼ | /ʔ/ | U+02BC | Glottal stop |

### 4.2 Chochenyo Vowels

Vowel values follow Spanish conventions:
- a = /a/ (as in "father")
- e = /e/ (as in "met")
- i = /i/ (as in "machine")
- o = /o/ (as in "wrote")
- u = /u/ (as in "rule")

Length marked by doubling: `aa`, `ee`, `ii`, `oo`, `uu`

## 5. OCEN Rumsen Character Inventory

Source: Ohlone Costanoan Esselen Nation, David L. Shaul

### 5.1 Special Characters

| Orthographic Symbol | IPA Value | Unicode | Description |
|---------------------|-----------|---------|-------------|
| X / x | /h/ | U+0058 / U+0078 | Sounds like H |
| C / c | /tʃ/ | U+0043 / U+0063 | Sounds like CH |
| S / s | /ʃ/ | U+0053 / U+0073 | Sounds like SH |
| T | retroflex | U+0054 | Curl tongue back to palate |
| R / r | /ɾ/ | U+0052 / U+0072 | Probable flap/tap |
| ʼ | /ʔ/ | U+02BC | Glottal stop |

### 5.2 Stress

Penultimate (next-to-last syllable) stress is the default pattern.

## 6. Cross-Variety Comparison

| Sound | IPA | Mutsun | Rumsen | Chochenyo | OCEN |
|-------|-----|--------|--------|-----------|------|
| Postalveolar affricate | /tʃ/ | c | č | c | C/c |
| Postalveolar fricative | /ʃ/ | s | ş/ŝ | s | S/s |
| Retroflex stop | /ʈ/ | T | — | T | T |
| Palatalized lateral | /lʲ/ | L | — | — | — |
| Palatal nasal | /ɲ/ | N | — | — | — |
| Alveolar affricate | /ts/ | ts | ţ | — | — |
| Palatal stop | /c/ | tY | — | — | — |
| Velar/glottal fricative | /x/ or /h/ | h | x | x | X/x |
| Glottal stop | /ʔ/ | ʼ | ʼ/ʔ | ʼ | ʼ |

## 7. Complete Unicode Code Points Required

### 7.1 Basic Latin (U+0000–U+007F)
Standard ASCII letters used across all varieties.

### 7.2 Latin Extended-A (U+0100–U+017F)
| Char | Code | Name | Used In |
|------|------|------|---------|
| č | U+010D | LATIN SMALL LETTER C WITH CARON | Rumsen |
| ş | U+015F | LATIN SMALL LETTER S WITH CEDILLA | Rumsen |
| ŝ | U+015D | LATIN SMALL LETTER S WITH CIRCUMFLEX | Rumsen |
| ţ | U+0163 | LATIN SMALL LETTER T WITH CEDILLA | Rumsen |

### 7.3 Spacing Modifier Letters (U+02B0–U+02FF)
| Char | Code | Name | Used In |
|------|------|------|---------|
| ʼ | U+02BC | MODIFIER LETTER APOSTROPHE | All varieties |

### 7.4 IPA Extensions (U+0250–U+02AF)
| Char | Code | Name | Used In |
|------|------|------|---------|
| ʔ | U+0294 | LATIN LETTER GLOTTAL STOP | Rumsen (alternative) |

### 7.5 Characters Needing Special Handling
| Usage | Current Encoding | Issue |
|-------|-----------------|-------|
| Mutsun `L` (palatalized) | U+004C (same as English L) | Case-folding conflation |
| Mutsun `N` (palatal) | U+004E (same as English N) | Case-folding conflation |
| Mutsun `S` (retroflex) | U+0053 (same as English S) | Case-folding conflation |
| Mutsun `T` (retroflex) | U+0054 (same as English T) | Case-folding conflation |
| Mutsun `tY` (palatal stop) | Digraph t+Y | No single code point |
| Glottal stop `ʼ` vs `'` | U+02BC vs U+0027 | Frequent mis-encoding |

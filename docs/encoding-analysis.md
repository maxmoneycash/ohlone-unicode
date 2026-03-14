# Encoding Analysis: Unicode Coverage for Ohlone Languages

## Executive Summary

The Ohlone language family can be written using existing Unicode characters. However, several practical encoding challenges exist that impede digital language revitalization efforts. This document identifies those challenges and proposes solutions ranging from software configuration to formal Unicode proposals.

## 1. Coverage Assessment

### Fully Covered Characters

The following Ohlone-specific characters are already encoded in Unicode with dedicated code points:

| Character | Code Point | Unicode Name | Block |
|-----------|-----------|--------------|-------|
| č | U+010D | LATIN SMALL LETTER C WITH CARON | Latin Extended-A |
| Č | U+010C | LATIN CAPITAL LETTER C WITH CARON | Latin Extended-A |
| ş | U+015F | LATIN SMALL LETTER S WITH CEDILLA | Latin Extended-A |
| Ş | U+015E | LATIN CAPITAL LETTER S WITH CEDILLA | Latin Extended-A |
| ŝ | U+015D | LATIN SMALL LETTER S WITH CIRCUMFLEX | Latin Extended-A |
| Ŝ | U+015C | LATIN CAPITAL LETTER S WITH CIRCUMFLEX | Latin Extended-A |
| ţ | U+0163 | LATIN SMALL LETTER T WITH CEDILLA | Latin Extended-A |
| Ţ | U+0162 | LATIN CAPITAL LETTER T WITH CEDILLA | Latin Extended-A |
| ʼ | U+02BC | MODIFIER LETTER APOSTROPHE | Spacing Modifier Letters |
| ʔ | U+0294 | LATIN LETTER GLOTTAL STOP | IPA Extensions |

**Status: No encoding action needed.** These characters exist and are well-supported in modern fonts and operating systems.

### Partially Covered: Case-Sensitive Phonemes (HIGH PRIORITY)

**Problem:** Mutsun (and to some extent Chochenyo and OCEN Rumsen) uses uppercase Latin letters L, N, S, T as phonemes distinct from their lowercase counterparts. Unicode treats these as case variants of the same abstract character.

**Impact:**
- `str.lower()` in any programming language destroys phonemic distinctions
- Case-insensitive database queries return incorrect results
- Browser search (Ctrl+F) conflates distinct words
- Auto-capitalization on mobile devices corrupts text
- Collation/sorting alphabetizes incorrectly

**Analysis of alternatives:**

#### Option A: Use Existing Distinct Code Points

Some IPA or Latin Extended characters could serve as replacements:

| Mutsun Letter | Possible Unicode Alternative | Code | Notes |
|---------------|------------------------------|------|-------|
| L (palatal) | Ꝇ (Latin small letter broken L) | U+A747 | Visually distinct, not standard |
| L (palatal) | ʎ (Latin small letter turned y) | U+028E | IPA for palatal lateral — semantically correct but visually wrong |
| N (palatal) | ɲ (Latin small letter N with left hook) | U+0272 | IPA for palatal nasal — correct phonetically |
| S (retroflex) | ʂ (Latin small letter S with hook) | U+0282 | IPA for retroflex fricative — correct |
| T (retroflex) | ʈ (Latin small letter T with retroflex hook) | U+0288 | IPA for retroflex stop — correct |

**Concern:** Using IPA characters changes the community-established orthography. The Mutsun dictionary and all teaching materials use plain uppercase L, N, S, T. Switching to IPA characters would require community consensus and reprinting of materials.

#### Option B: Unicode Locale / CLDR Tailoring

Define Mutsun-specific collation and casing rules in the Unicode Common Locale Data Repository (CLDR):

- Register an Ohlone locale (e.g., `cst` for Northern Ohlone, `css` for Southern Ohlone per ISO 639-3)
- Define casing rules that prevent L→l, N→n, S→s, T→t mappings
- Define sort order matching the Mutsun dictionary: `a c d e h i k l L m n N o p r s S t T ts tY u w y ʼ`

**This is the recommended approach.** It preserves the existing orthography while fixing software behavior.

#### Option C: Propose New Unicode Characters

Propose encoding of dedicated characters such as:
- LATIN LETTER OHLONE PALATALIZED L
- LATIN LETTER OHLONE PALATAL N  
- LATIN LETTER OHLONE RETROFLEX S
- LATIN LETTER OHLONE RETROFLEX T

**Assessment:** The Unicode Consortium generally disfavors encoding characters that are visually identical to existing characters. This approach is unlikely to succeed unless strong evidence shows that the current encoding is fundamentally inadequate.

### Encoding Hazard: Glottal Stop (HIGH PRIORITY)

**Problem:** The glottal stop can be represented by at least four different characters:

| Character | Code | Name | Visual |
|-----------|------|------|--------|
| ' | U+0027 | APOSTROPHE | Straight quote |
| ' | U+2019 | RIGHT SINGLE QUOTATION MARK | Curly quote |
| ʼ | U+02BC | MODIFIER LETTER APOSTROPHE | Letter-like |
| ʔ | U+0294 | LATIN LETTER GLOTTAL STOP | IPA symbol |

Most users will type U+0027 (keyboard apostrophe) or their software will auto-correct to U+2019 (smart quote). **Neither is correct for Ohlone text.** The correct character is U+02BC (modifier letter apostrophe), which is classified as a letter rather than punctuation.

**Impact:**
- Word boundary detection: `ma'yin` with U+0027 may be split into two words
- Search failure: Searching for `maʼyin` (U+02BC) won't find `ma'yin` (U+0027)
- Spell-checking: Different code points treated as different words
- Data interchange: Inconsistent encoding across documents

**Recommended solution:**
1. Keyboard layouts should produce U+02BC for the glottal stop key
2. Validation tools should flag U+0027 and U+2019 in Ohlone text
3. Normalization script should convert variants to U+02BC

### Digraph Encoding (MEDIUM PRIORITY)

**Problem:** Mutsun uses two digraphs — `ts` and `tY` — that function as single phonemes.

**Analysis:** Unicode does not generally encode digraphs as single characters (with rare exceptions like Dutch ĳ U+0133). The standard practice is to represent them as two characters and handle them at the font/input method level.

**Recommended solution:**
- Document the digraphs in CLDR as grapheme clusters
- Ensure keyboard layouts can produce `ts` and `tY` with single keystrokes
- Consider font ligatures for visual cohesion

## 2. Recommended Actions

### Immediate (Software / Documentation)

1. **Create Ohlone keyboard layouts** for macOS, Windows, iOS, and Android that produce correct code points
2. **Write a text encoding guide** for language teachers and learners
3. **Build a validation script** that detects incorrect glottal stop characters
4. **Publish font recommendations** — fonts that cover all required code points

### Medium-Term (Standards)

5. **Submit CLDR locale data** for Mutsun (`css`) and Chochenyo (`cst`) including:
   - Collation order
   - Case-folding exceptions
   - Exemplar character sets
6. **Engage with the Unicode Consortium** Script Encoding Working Group to discuss the case-sensitive phoneme issue

### Long-Term (Proposal)

7. **Draft a formal proposal** documenting the Ohlone character requirements — even if no new characters are proposed, an informational document helps future software developers
8. **Coordinate with tribal language committees** to ensure any encoding decisions reflect community preferences

## 3. Comparison with Other Indigenous Language Encoding Efforts

| Project | Approach | Outcome |
|---------|----------|---------|
| Cherokee | Dedicated script block | U+13A0–U+13FF (85 characters) |
| Unified Canadian Aboriginal Syllabics | Dedicated script block | U+1400–U+167F (640+ characters) |
| Osage | Dedicated script block | U+104B0–U+104FF (72 characters) |
| Navajo | Latin Extended characters | Uses existing ą, ę, į, ǫ, etc. |
| Hawaiian | Latin + ʻokina | U+02BB (modifier letter turned comma) |

The Ohlone situation is most similar to **Hawaiian** and **Navajo**: Latin-based orthographies that need a small number of special characters plus proper digital tooling. Hawaiian's ʻokina (U+02BB) is an instructive parallel to the Ohlone glottal stop (U+02BC).

## 4. Font Coverage Test

To verify whether a font supports all required Ohlone characters, test the following string:

```
Mutsun:     aacic caahi Luohu Notko Saanay Taakampi tsayla tYottYoni waʼaha
Rumsen:     čak şuri ţapan ŝipak xačin maʔki
Chochenyo:  xučyun Tújŝtak makkin muwekma wolwoolum
OCEN:       saleki Mechix tsa'a
```

Characters that must render correctly:
```
č ş ŝ ţ ʼ ʔ L N S T
```

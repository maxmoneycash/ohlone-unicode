# Proposal for Ohlone Language Support in the Unicode Standard

**Document:** L2/26-XXX (Draft)
**Title:** Proposal for Improved Unicode Support for the Ohlone (Costanoan) Language Family
**Source:** Ohlone Unicode Project (community draft)
**Author:** [To be completed with tribal community co-authors]
**Date:** 2026-03-08
**Status:** DRAFT — Pending tribal community review and collaboration

---

## 1. Introduction

This document proposes improvements to Unicode Standard support for the Ohlone (Costanoan) language family, an Indigenous language family of Northern California historically spoken across the San Francisco Bay Area and Monterey Bay region. The Ohlone family comprises eight attested varieties: Awaswas, Chalon, Chochenyo (Chocheño), Karkin, Mutsun, Ramaytush, Rumsen, and Tamyen.

While the last native speakers passed by the 1950s, three varieties — Chochenyo, Mutsun, and Rumsen — are actively being revitalized by tribal communities. Digital infrastructure is critical to these revitalization efforts: without proper encoding, these languages cannot be reliably typed, searched, sorted, transmitted, or preserved in digital form.

This proposal does not request allocation of a new Unicode block. Rather, it requests:

1. Registration of Ohlone locale data in CLDR
2. Documentation of Ohlone character requirements as an informational annex
3. Consideration of the case-sensitive phoneme encoding challenge

## 2. Background

### 2.1 The Ohlone Languages

The Ohlone languages form a branch of the Utian language family, which also includes the Miwok languages. They are part of the broader hypothesized Yok-Utian grouping. ISO 639-3 codes exist for Northern Ohlone (cst) and Southern Ohlone (css).

The primary communities engaged in revitalization include:

- **Muwekma Ohlone Tribe** — Chochenyo language revitalization
- **Confederated Villages of Lisjan** — Chochenyo through the Mak Noono Tiirinikma program
- **Amah Mutsun Tribal Band** — Mutsun language revitalization
- **Ohlone Costanoan Esselen Nation (OCEN)** — Rumsen language work
- **Costanoan Rumsen Carmel Tribe** — Rumsen documentation

### 2.2 Orthographic Systems

All modern Ohlone orthographies are Latin-based, developed by linguists in collaboration with tribal communities. The primary published reference is the Mutsun-English English-Mutsun Dictionary (Warner, Butler & Geary, 2016).

## 3. Character Requirements

### 3.1 Characters Already Encoded in Unicode

The majority of characters needed for Ohlone text are already available in Unicode:

| Character | Code Point | Block | Used By |
|-----------|-----------|-------|---------|
| Basic Latin a-z | U+0061–U+007A | Basic Latin | All |
| Basic Latin A-Z | U+0041–U+005A | Basic Latin | All (Mutsun: case-phonemic) |
| č | U+010D | Latin Extended-A | Rumsen |
| ş | U+015F | Latin Extended-A | Rumsen |
| ŝ | U+015D | Latin Extended-A | Rumsen |
| ţ | U+0163 | Latin Extended-A | Rumsen |
| ʼ | U+02BC | Spacing Modifier Letters | All |
| ʔ | U+0294 | IPA Extensions | Rumsen |

### 3.2 The Case-Sensitive Phoneme Problem

Mutsun orthography (and to a lesser extent Chochenyo and OCEN Rumsen) uses uppercase Latin letters as phonemes distinct from their lowercase equivalents:

| Uppercase | Lowercase | Distinction |
|-----------|-----------|-------------|
| L /lʲ/ (palatalized lateral) | l /l/ (plain lateral) | Different phonemes |
| N /ɲ/ (palatal nasal) | n /n/ (alveolar nasal) | Different phonemes |
| S /ʂ/ (retroflex fricative) | s /s/ (alveolar fricative) | Different phonemes |
| T /ʈ/ (retroflex stop) | t /t/ (alveolar stop) | Different phonemes |

This creates a fundamental tension with Unicode's case folding model, where L and l are considered equivalent characters differing only in case. In Mutsun, they are as distinct as p and b.

**Impact on digital text processing:**

- Case-insensitive search conflates distinct words
- Database queries with LOWER() or UPPER() destroy phonemic distinctions
- Auto-capitalization on mobile devices corrupts text
- Collation algorithms sort incorrectly
- Spell-checkers treat case variants as identical

**Comparison with other languages:**
- The DIN 5007 standard for German treats ß and ss as equivalent for sorting but distinct for display
- Turkish has the well-known I/İ and ı/I case mapping distinction
- Mutsun's situation is more extreme: four letters have case-distinct phonemic values

### 3.3 The Glottal Stop Encoding Hazard

The glottal stop /ʔ/ is a phoneme in all Ohlone varieties. The correct encoding is U+02BC (MODIFIER LETTER APOSTROPHE), which is classified as a letter (General_Category=Lm). However, users commonly type:

- U+0027 APOSTROPHE (punctuation)
- U+2019 RIGHT SINGLE QUOTATION MARK (auto-inserted by smart quote features)
- U+0060 GRAVE ACCENT

This parallels the well-documented Hawaiian ʻokina (U+02BB) encoding challenge.

### 3.4 Digraph Handling

Mutsun uses two digraphs that function as single phonemes:

- **ts** /ts/ — alveolar affricate
- **tY** /tʲ/ — palatal stop

These do not require new code points (per Unicode encoding principles), but should be documented for proper grapheme cluster handling.

## 4. Proposed Actions

### 4.1 CLDR Locale Registration (Primary Request)

We request registration of locale data in CLDR for:

- **Mutsun** (ISO 639-3: css) — exemplar characters, collation, casing rules
- **Chochenyo** (ISO 639-3: cst) — exemplar characters, collation

**Exemplar character set for Mutsun:**
```
[a c d e h i k l L m n N o p r s S t T {ts} {tY} u w y ʼ]
```

**Collation order for Mutsun:**
```
a < c < d < e < h < i < k < l < L < m < n < N < o < p < r < s < S < t < T < ts < tY < u < w < y < ʼ
```

**Special casing rules for Mutsun:**
- L (U+004C) and l (U+006C) are NOT case equivalents
- N (U+004E) and n (U+006E) are NOT case equivalents
- S (U+0053) and s (U+0073) are NOT case equivalents
- T (U+0054) and t (U+0074) are NOT case equivalents

### 4.2 Informational Documentation

We request that the Ohlone character requirements be documented in a Technical Note or FAQ entry, covering:

- Complete character repertoire per variety
- Correct code points for commonly confused characters
- Font coverage requirements
- Input method considerations

### 4.3 Future Consideration

If CLDR tailoring proves insufficient to address the case-sensitive phoneme problem, a future proposal may request:

- Dedicated code points for Mutsun phonemic uppercase letters, OR
- Annotation mechanism to mark characters as "case-independent" in specific language contexts

## 5. References

- Warner, N., Butler, L., & Geary, Q. (2016). *Mutsun-English English-Mutsun Dictionary*. University of Hawaiʻi Press.
- Okrand, M. (1977). *Mutsun Grammar*. Ph.D. dissertation, UC Berkeley.
- Golla, V. (2011). *California Indian Languages*. UC Press.
- Hinton, L. (2001). "The Ohlone Languages." In *The Green Book of Language Revitalization in Practice*.
- Callaghan, C. (2001). "More Evidence for Yok-Utian."
- Kaufman, D. (2008). "Rumsen Ohlone Folklore." *Journal of Folklore Research* 45(3).
- Warner, N., Butler, L., & Luna-Costillas, Q. (2006). "Making a Dictionary for Community Use in Language Revitalization." *International Journal of Lexicography* 19(3).
- Unicode Consortium. FAQ: Submitting Character Proposals. https://unicode.org/faq/char_proposal
- Unicode CLDR. https://cldr.unicode.org/

## 6. Contact

[To be completed — should include tribal community representatives as primary contacts]

---

*This is a community draft document. A formal submission to the Unicode Consortium will be prepared in collaboration with Ohlone tribal language committees. No formal proposal should be submitted without tribal community endorsement.*

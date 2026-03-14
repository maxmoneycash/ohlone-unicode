# Ohlone Unicode Project

**Digital encoding infrastructure for the Ohlone (Costanoan) language family of Northern California.**

> *"Makkin Mak Muwekma Wolwoolum. We are Muwekma Ohlone. We speak in our beautiful Muwekma language!"*
> — Muwekma Ohlone Tribe Language Committee

## Overview

The Ohlone languages — historically spoken across the San Francisco Bay Area and Monterey Bay region — comprise eight attested varieties: **Awaswas, Chalon, Chochenyo, Karkin, Mutsun, Ramaytush, Rumsen, and Tamyen**. While the last native speakers passed by the 1950s, Chochenyo, Mutsun, and Rumsen are actively being revitalized by tribal communities including the Muwekma Ohlone Tribe, the Amah Mutsun Tribal Band, and the Ohlone Costanoan Esselen Nation.

This project addresses a critical gap: **the Ohlone languages use Latin-based orthographies with specialized characters that are either missing from Unicode, scattered across distant code blocks, or lack proper digital tooling.** Without proper encoding, these languages cannot be reliably typed, searched, sorted, or preserved digitally.

## Project Goals

1. **Document** all characters needed to write the Ohlone language family
2. **Propose** encoding additions or annotations to the Unicode Consortium where gaps exist
3. **Provide** keyboard layouts, input methods, and font recommendations
4. **Create** reference materials for language learners, educators, and software developers

## Repository Structure

```
ohlone-unicode/
├── README.md                    # This file
├── CONTRIBUTING.md              # How to contribute
├── LICENSE                      # MIT License
│
├── proposal/
│   ├── ohlone-unicode-proposal.pdf   # Formal UTC proposal document
│   └── ohlone-unicode-proposal.md    # Source markdown
│
├── docs/
│   ├── character-inventory.md   # Complete character inventory across all varieties
│   ├── orthography-guide.md     # Orthographic conventions per variety
│   └── encoding-analysis.md     # Analysis of existing Unicode coverage & gaps
│
├── charts/
│   ├── ohlone-characters.csv    # Machine-readable character table
│   └── code-chart.md            # Visual code chart (Unicode block style)
│
├── tools/
│   ├── keyboard/
│   │   └── ohlone-keyboard.md   # Keyboard layout specifications
│   ├── validate.py              # Script to validate Ohlone text encoding
│   └── transliterate.py         # Transliteration between orthographic systems
│
└── fonts/
    └── font-recommendations.md  # Fonts that support Ohlone characters
```

## The Encoding Challenge

The modern Ohlone orthographies — developed by linguists and tribal communities for language revitalization — use Latin letters augmented with special characters. The key challenges include:

### Mutsun (Amah Mutsun Tribal Band)
- **Capital letters as distinct phonemes**: `L` (palatalized /l/), `N` (palatal nasal), `S` (retroflex /ʂ/), `T` (retroflex /ʈ/)
- **Digraphs**: `ts` (affricate /ts/), `tY` (palatal stop)
- **Glottal stop**: `ʼ` (modifier letter apostrophe, U+02BC)
- **Vowel/consonant length**: indicated by doubling (e.g., `aa`, `tt`)

### Rumsen (Costanoan Rumsen Carmel Tribe)
- **Special characters**: `č` (U+010D), `ş` (U+015F), `ţ` (U+0163), `ŝ` (U+015D)
- **Velar fricative**: `x` for /x/
- **Glottal stop**: `ʔ` (U+0294) or `ʼ` (U+02BC)

### Chochenyo (Muwekma Ohlone Tribe / Confederated Villages of Lisjan)
- **Non-obvious letter values**: `c` = /tʃ/, `s` = /ʃ/, `x` = /h/
- **Retroflex**: `T` for retroflex stops
- **Glottal stop**: `'` or `ʼ`

### OCEN Rumsen (Ohlone Costanoan Esselen Nation)
- **Similar conventions**: `c` = /tʃ/, `s` = /ʃ/, `x` = /h/
- **Retroflex**: `T` curled tongue back to palate

## Current Unicode Coverage

Most characters needed are already encoded in Unicode, but are **scattered across multiple blocks**, creating practical difficulties for font support, keyboard design, and text processing. See [`docs/encoding-analysis.md`](docs/encoding-analysis.md) for the full analysis.

| Character | IPA | Used In | Unicode | Block |
|-----------|-----|---------|---------|-------|
| ʼ | /ʔ/ | All | U+02BC | Spacing Modifier Letters |
| č | /tʃ/ | Rumsen | U+010D | Latin Extended-A |
| ş | /ʃ/ | Rumsen | U+015F | Latin Extended-A |
| ţ | /ts/ | Rumsen | U+0163 | Latin Extended-A |
| ŝ | /ʃ/ | Rumsen/Chochenyo | U+015D | Latin Extended-A |

## How to Get Involved

This is a community-driven project. We welcome contributions from:

- **Ohlone tribal members and language learners** — Your knowledge is essential
- **Linguists** — Help verify phonemic inventories and orthographic conventions
- **Software engineers** — Build keyboards, input methods, and validation tools
- **Font designers** — Ensure complete glyph coverage for Ohlone orthographies

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Acknowledgments

This project is built on the foundational work of:

- The **Muwekma Ohlone Tribe** Language Committee and their Chochenyo revitalization efforts
- The **Amah Mutsun Tribal Band** and researchers Natasha Warner, Lynnika Butler, and Quirina Geary for the Mutsun-English Dictionary
- The **Ohlone Costanoan Esselen Nation** and linguist David L. Shaul
- The **Confederated Villages of Lisjan** and the Sogorea Te' Land Trust's Mak Noono Tiirinikma program
- The **UC Berkeley California Language Archive** and Survey of California and Other Indian Languages
- **Marc Okrand** for the foundational Mutsun Grammar (1977)
- **Felipe Arroyo de la Cuesta** and **John Peabody Harrington** for early documentation

## Important Note

This project aims to support — not replace — the language revitalization work being done by Ohlone tribal communities. Any formal Unicode proposal will be developed **in collaboration with** tribal language committees. The encoding decisions documented here reflect published academic and community sources; tribal communities retain authority over their languages and orthographic choices.

## References

- Warner, N., Butler, L., & Geary, Q. (2016). *Mutsun-English English-Mutsun Dictionary*. University of Hawaiʻi Press.
- Okrand, M. (1977). *Mutsun Grammar*. Ph.D. dissertation, UC Berkeley.
- Arroyo de la Cuesta, F. (1862). *A vocabulary or phrase book of the Mutsun language of Alta California*.
- Kaufman, D. (2008). "Rumsen Ohlone Folklore: Two Tales." *Journal of Folklore Research* 45(3): 383–91.
- Callaghan, C. (2001). "More Evidence for Yok-Utian." *Survey of California and Other Indian Languages* Report 12.
- Hinton, L. (2001). "The Ohlone Languages." In *The Green Book of Language Revitalization in Practice*.
- Golla, V. (2011). *California Indian Languages*. UC Press.

## License

MIT — See [LICENSE](LICENSE) for details.

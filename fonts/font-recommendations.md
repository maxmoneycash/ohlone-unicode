# Font Recommendations for Ohlone Languages

## Requirements

A font suitable for Ohlone language text must include the following glyphs:

### Minimum Character Set

| Character | Code Point | Required For |
|-----------|-----------|--------------|
| Basic Latin a-z, A-Z | U+0041–U+007A | All varieties |
| č | U+010D | Rumsen |
| Č | U+010C | Rumsen |
| ş | U+015F | Rumsen |
| Ş | U+015E | Rumsen |
| ŝ | U+015D | Rumsen, Chochenyo |
| Ŝ | U+015C | Rumsen, Chochenyo |
| ţ | U+0163 | Rumsen |
| Ţ | U+0162 | Rumsen |
| ʼ | U+02BC | All varieties |
| ʔ | U+0294 | Rumsen |

## Recommended Fonts

### Free / Open Source

| Font | License | Latin Ext-A | U+02BC | U+0294 | Notes |
|------|---------|-------------|--------|--------|-------|
| **Noto Sans** | OFL | ✅ | ✅ | ✅ | Google's universal font family. Excellent coverage. |
| **Noto Serif** | OFL | ✅ | ✅ | ✅ | Serif companion to Noto Sans. |
| **Charis SIL** | OFL | ✅ | ✅ | ✅ | Designed for linguistic work. Excellent IPA support. |
| **Doulos SIL** | OFL | ✅ | ✅ | ✅ | Serif font for linguistic texts. |
| **Gentium Plus** | OFL | ✅ | ✅ | ✅ | Beautiful serif with broad Unicode coverage. |
| **Linux Libertine** | OFL/GPL | ✅ | ✅ | ✅ | Elegant serif alternative. |
| **DejaVu Sans** | Free | ✅ | ✅ | ✅ | Broad Unicode coverage. |
| **Source Sans Pro** | OFL | ✅ | ✅ | ⚠️ | Adobe's open source sans-serif. Check U+0294. |

### System Fonts

| Font | Platform | Coverage | Notes |
|------|----------|----------|-------|
| **SF Pro** | macOS/iOS | Partial | May lack U+0294 |
| **Segoe UI** | Windows | Good | Covers Latin Extended-A |
| **Roboto** | Android | Partial | Check modifier letters block |

### Fonts for Print / Teaching Materials

For printed dictionaries, textbooks, and teaching materials:

1. **Charis SIL** — specifically designed for linguistics; clear letterforms that distinguish similar characters
2. **Gentium Plus** — beautiful and readable at small sizes
3. **Noto Serif** — professional appearance, widely available

### Fonts for Digital / Web

For websites, apps, and digital documents:

1. **Noto Sans** — clean, modern, universal
2. **Source Sans Pro** — excellent readability on screen
3. **DejaVu Sans** — good fallback with wide coverage

## Testing Font Coverage

Use this test string to verify all required Ohlone characters render correctly:

```
abcdefhiklmnoprstuwxy LNST
čşŝţ ČŞŜŢ
ʼ ʔ
aacic caahi Luohu Notko Saanay Taakampi tsayla tYottYoni
čak şuri ţapan xačin
xučyun Tújŝtak makkin muwekma
```

If any characters appear as □ (missing glyph), ◻ (empty box), or ⍰ (question mark), the font does not support those characters.

## Web CSS Font Stack

```css
/* Ohlone-compatible font stack */
.ohlone-text {
    font-family: 
        'Charis SIL',
        'Gentium Plus',
        'Noto Sans',
        'Noto Serif',
        'DejaVu Sans',
        'Segoe UI',
        sans-serif;
}
```

## Font Installation

### Charis SIL (Recommended)

1. Download from: https://software.sil.org/charis/
2. Install the `.ttf` or `.otf` files
3. Available for Windows, macOS, and Linux

### Noto Sans/Serif

1. Download from: https://fonts.google.com/noto
2. Or use via Google Fonts CDN:

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
```

## Known Issues

### The ʼ (U+02BC) Rendering Problem

Some fonts render U+02BC identically to U+0027 (straight apostrophe) or U+2019 (right single quote). While this is visually acceptable, it can confuse users about which character they're typing. Fonts like Charis SIL give U+02BC a slightly different design to help distinguish it.

### Auto-Substitution

Some applications (Microsoft Word, Google Docs) will auto-replace `'` (U+0027) with `'` (U+2019 RIGHT SINGLE QUOTATION MARK). This is incorrect for Ohlone text. To prevent this:

- **Microsoft Word**: File → Options → Proofing → AutoCorrect Options → uncheck "Straight quotes with smart quotes"
- **Google Docs**: Tools → Preferences → uncheck "Use smart quotes"
- **macOS**: System Preferences → Keyboard → Text → uncheck "Use smart quotes and dashes"

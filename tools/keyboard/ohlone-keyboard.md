# Ohlone Keyboard Layout Specification

## Overview

This document specifies keyboard layouts for typing Ohlone languages on modern devices. The primary design goals are:

1. All Ohlone characters accessible without modifier-key gymnastics
2. Glottal stop (ʼ U+02BC) always produces the correct code point
3. Mutsun case-distinct phonemes (L, N, S, T) easily typed
4. Digraphs (ts, tY) available as single or double keystrokes
5. Compatible with standard QWERTY physical layout

## Layout: Ohlone QWERTY (All Varieties)

### Base Layer (no modifier)

Standard QWERTY with one critical change:

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  `  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │  0  │  -  │  =  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  q  │  w  │  e  │  r  │  t  │  y  │  u  │  i  │  o  │  p  │  [  │  ]  │  \  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  a  │  s  │  d  │  h  │  c  │  k  │  l  │  n  │  m  │  ;  │  ʼ  │ Ret │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│Shift│  x  │  f  │  g  │  b  │  j  │  z  │  ,  │  .  │  /  │Shift│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Key change:** The `'` (apostrophe) key produces `ʼ` (U+02BC MODIFIER LETTER APOSTROPHE) instead of `'` (U+0027).

### Shift Layer

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  ~  │  !  │  @  │  #  │  $  │  %  │  ^  │  &  │  *  │  (  │  )  │  _  │  +  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  Q  │  W  │  E  │  R  │  T  │  Y  │  U  │  I  │  O  │  P  │  {  │  }  │  |  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  A  │  S  │  D  │  H  │  C  │  K  │  L  │  N  │  M  │  :  │  ʔ  │ Ret │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│Shift│  X  │  F  │  G  │  B  │  J  │  Z  │  <  │  >  │  ?  │Shift│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Note for Mutsun:** Shift+S produces `S` (retroflex /ʂ/), Shift+L produces `L` (palatal /lʲ/), Shift+N produces `N` (palatal /ɲ/), Shift+T produces `T` (retroflex /ʈ/). This is standard shift behavior but here it produces **different phonemes**.

### AltGr / Option Layer (Rumsen characters)

```
AltGr + c → č  (U+010D)
AltGr + s → ş  (U+015F)
AltGr + S → ŝ  (U+015D)
AltGr + t → ţ  (U+0163)
AltGr + ' → ʔ  (U+0294)
```

## Mobile Keyboard (iOS / Android)

### Recommended Approach

Create a custom keyboard or input method that:

1. **Long-press `'`** → shows picker with `ʼ` (U+02BC) and `ʔ` (U+0294)
2. **Long-press `s`** → shows picker with `ş`, `ŝ`, `S` (retroflex)
3. **Long-press `c`** → shows picker with `č`
4. **Long-press `t`** → shows picker with `ţ`, `T` (retroflex)
5. **Disable auto-capitalization** — critical for Mutsun where case is phonemic
6. **Disable smart quotes** — prevents ʼ from being replaced with curly quotes

### Auto-Capitalization Warning

⚠️ Standard iOS/Android auto-capitalize at sentence start will incorrectly capitalize Mutsun words that begin with lowercase phonemes. For example:

- `saake` (gather pinenuts) → auto-caps to `Saake` → now begins with retroflex S, wrong word
- `laake` (rise) → auto-caps to `Laake` → now begins with palatalized L, wrong word

**This must be disabled for Ohlone text input.**

## Implementation Notes

### macOS (Ukelele)

Use [Ukelele](https://software.sil.org/ukelele/) to create a `.keylayout` file:

```xml
<!-- Key mapping for apostrophe key producing U+02BC -->
<key code="39" output="&#x02BC;"/>
<!-- AltGr mappings for Rumsen characters -->
<key code="8" modifiers="optionKey" output="&#x010D;"/>  <!-- c → č -->
<key code="1" modifiers="optionKey" output="&#x015F;"/>  <!-- s → ş -->
<key code="17" modifiers="optionKey" output="&#x0163;"/>  <!-- t → ţ -->
```

### Windows (MSKLC)

Use [Microsoft Keyboard Layout Creator](https://www.microsoft.com/en-us/download/details.aspx?id=102134) to define the layout.

### Linux (XKB)

Add custom symbols file to `/usr/share/X11/xkb/symbols/`:

```
partial alphanumeric_keys
xkb_symbols "ohlone" {
    include "us(basic)"
    name[Group1]= "English (Ohlone)";
    
    // Apostrophe key → modifier letter apostrophe
    key <AC11> { [ U02BC, U0294 ] };
    
    // AltGr layer for Rumsen
    key <AC03> { [ d, D, U010D, U010C ] };  // d, D, č, Č
    key <AC02> { [ s, S, U015F, U015E ] };  // s, S, ş, Ş
    key <AC05> { [ t, T, U0163, U0162 ] };  // t, T, ţ, Ţ
};
```

## Testing

After installing, verify the keyboard produces correct code points by typing into a Unicode-aware editor and checking:

```python
# Python test
text = input("Type a glottal stop: ")
for ch in text:
    print(f"U+{ord(ch):04X} {ch}")
# Should show: U+02BC ʼ
```

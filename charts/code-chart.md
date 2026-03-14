# Ohlone Languages — Code Chart

A visual reference chart of all characters used in Ohlone language orthographies, modeled after the format of official Unicode code charts.

## Ohlone Latin Character Set

```
    _0   _1   _2   _3   _4   _5   _6   _7   _8   _9   _A   _B   _C   _D   _E   _F

0_  a    c    d    e    h    i    k    l    L    m    n    N    o    p    r    s

1_  S    t    T    u    w    x    y    ʼ    č    ş    ŝ    ţ    ʔ   (ts) (tY)
```

## Detailed Code Chart

### Basic Latin Characters (U+0041–U+007A)

```
┌──────┬────────┬───────┬──────────────────────────────────────┐
│ Char │ Code   │ IPA   │ Ohlone Usage                         │
├──────┼────────┼───────┼──────────────────────────────────────┤
│  a   │ U+0061 │ /a/   │ ALL: open vowel                      │
│  c   │ U+0063 │ /tʃ/  │ MUT/CHO/OCEN: postalveolar affricate │
│  d   │ U+0064 │ /d/   │ MUT: loanwords only                  │
│  e   │ U+0065 │ /e/   │ ALL: mid front vowel                 │
│  h   │ U+0068 │ /h/   │ MUT/RUM: glottal fricative            │
│  i   │ U+0069 │ /i/   │ ALL: close front vowel               │
│  k   │ U+006B │ /k/   │ ALL: velar stop                      │
│  l   │ U+006C │ /l/   │ ALL: lateral approximant             │
│  m   │ U+006D │ /m/   │ ALL: bilabial nasal                  │
│  n   │ U+006E │ /n/   │ ALL: alveolar nasal                  │
│  o   │ U+006F │ /o/   │ ALL: mid back vowel                  │
│  p   │ U+0070 │ /p/   │ ALL: bilabial stop                   │
│  r   │ U+0072 │ /ɾ/   │ ALL: alveolar tap                    │
│  s   │ U+0073 │ /s/   │ MUT/RUM: alveolar fricative          │
│      │        │ /ʃ/   │ CHO/OCEN: postalveolar fricative     │
│  t   │ U+0074 │ /t/   │ ALL: alveolar stop                   │
│  u   │ U+0075 │ /u/   │ ALL: close back vowel                │
│  w   │ U+0077 │ /w/   │ ALL: labial-velar approximant        │
│  x   │ U+0078 │ /x/   │ RUM: velar fricative                 │
│      │        │ /h/   │ CHO/OCEN: glottal fricative           │
│  y   │ U+0079 │ /j/   │ ALL: palatal approximant             │
└──────┴────────┴───────┴──────────────────────────────────────┘
```

### Case-Distinct Phonemes (U+004C–U+0054)

⚠️ These uppercase letters function as **separate phonemes** in Mutsun, not as capital forms of lowercase letters.

```
┌──────┬────────┬───────┬──────────────────────────────────────┐
│ Char │ Code   │ IPA   │ Ohlone Usage                         │
├──────┼────────┼───────┼──────────────────────────────────────┤
│  L   │ U+004C │ /lʲ/  │ MUT: palatalized lateral             │
│  N   │ U+004E │ /ɲ/   │ MUT: palatal nasal                   │
│  S   │ U+0053 │ /ʂ/   │ MUT: retroflex fricative              │
│  T   │ U+0054 │ /ʈ/   │ MUT/CHO/OCEN: retroflex stop         │
└──────┴────────┴───────┴──────────────────────────────────────┘
```

### Latin Extended-A (U+0100–U+017F)

```
┌──────┬────────┬───────┬──────────────────────────────────────┐
│ Char │ Code   │ IPA   │ Ohlone Usage                         │
├──────┼────────┼───────┼──────────────────────────────────────┤
│  č   │ U+010D │ /tʃ/  │ RUM: postalveolar affricate          │
│  ş   │ U+015F │ /ʃ/   │ RUM: postalveolar fricative          │
│  ŝ   │ U+015D │ /ʃ/   │ RUM/CHO: postalveolar fricative (alt)│
│  ţ   │ U+0163 │ /ts/  │ RUM: alveolar affricate              │
└──────┴────────┴───────┴──────────────────────────────────────┘
```

### Modifier & IPA Characters

```
┌──────┬────────┬───────┬──────────────────────────────────────┐
│ Char │ Code   │ IPA   │ Ohlone Usage                         │
├──────┼────────┼───────┼──────────────────────────────────────┤
│  ʼ   │ U+02BC │ /ʔ/   │ ALL: glottal stop (PREFERRED)        │
│  ʔ   │ U+0294 │ /ʔ/   │ RUM: glottal stop (IPA alternative)  │
└──────┴────────┴───────┴──────────────────────────────────────┘
```

### Digraphs

```
┌──────┬──────────────────┬───────┬────────────────────────────┐
│ Seq  │ Code Points      │ IPA   │ Ohlone Usage               │
├──────┼──────────────────┼───────┼────────────────────────────┤
│  ts  │ U+0074 + U+0073  │ /ts/  │ MUT: alveolar affricate    │
│  tY  │ U+0074 + U+0059  │ /tʲ/  │ MUT: palatal stop          │
└──────┴──────────────────┴───────┴────────────────────────────┘
```

## Abbreviations

- **ALL** = All Ohlone varieties
- **MUT** = Mutsun
- **RUM** = Rumsen
- **CHO** = Chochenyo
- **OCEN** = OCEN Rumsen (Ohlone Costanoan Esselen Nation)

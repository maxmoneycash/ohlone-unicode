#!/usr/bin/env python3
"""
transliterate.py — Transliterate between Ohlone orthographic systems.

Converts between the different orthographic conventions used across
Ohlone language varieties and historical documentation systems.

Usage:
    python transliterate.py <input_file> --from mutsun --to ipa
    echo "Saanay" | python transliterate.py --from mutsun --to ipa
"""

import sys
import argparse
import re

# === Transliteration Maps ===
# Ordered by longest match first to handle digraphs correctly

MUTSUN_TO_IPA = [
    # Digraphs first (longest match)
    ("tY", "tʲ"),
    ("ts", "ts"),
    # Case-distinct phonemes
    ("L", "lʲ"),
    ("N", "ɲ"),
    ("S", "ʂ"),
    ("T", "ʈ"),
    # Regular consonants
    ("c", "tʃ"),
    ("h", "h"),
    ("k", "k"),
    ("l", "l"),
    ("m", "m"),
    ("n", "n"),
    ("p", "p"),
    ("r", "ɾ"),
    ("s", "s"),
    ("t", "t"),
    ("w", "w"),
    ("y", "j"),
    ("d", "d"),
    # Glottal stop
    ("ʼ", "ʔ"),
    # Vowels — long (doubled) first
    ("aa", "aː"),
    ("ee", "eː"),
    ("ii", "iː"),
    ("oo", "oː"),
    ("uu", "uː"),
    ("a", "a"),
    ("e", "e"),
    ("i", "i"),
    ("o", "o"),
    ("u", "u"),
]

RUMSEN_TO_IPA = [
    ("č", "tʃ"),
    ("ş", "ʃ"),
    ("ŝ", "ʃ"),
    ("ţ", "ts"),
    ("x", "x"),
    ("ʼ", "ʔ"),
    ("ʔ", "ʔ"),
    ("h", "h"),
    ("k", "k"),
    ("l", "l"),
    ("m", "m"),
    ("n", "n"),
    ("p", "p"),
    ("r", "ɾ"),
    ("s", "s"),
    ("t", "t"),
    ("w", "w"),
    ("y", "j"),
    ("c", "k"),
    # Vowels — long first
    ("aa", "aː"),
    ("ee", "eː"),
    ("ii", "iː"),
    ("oo", "oː"),
    ("uu", "uː"),
    ("a", "a"),
    ("e", "e"),
    ("i", "i"),
    ("o", "o"),
    ("u", "u"),
]

CHOCHENYO_TO_IPA = [
    ("T", "ʈ"),
    ("ŝ", "ʃ"),
    ("c", "tʃ"),
    ("s", "ʃ"),
    ("x", "h"),
    ("ʼ", "ʔ"),
    ("h", "h"),
    ("k", "k"),
    ("l", "l"),
    ("m", "m"),
    ("n", "n"),
    ("p", "p"),
    ("r", "ɾ"),
    ("t", "t"),
    ("w", "w"),
    ("y", "j"),
    # Vowels
    ("aa", "aː"),
    ("ee", "eː"),
    ("ii", "iː"),
    ("oo", "oː"),
    ("uu", "uː"),
    ("a", "a"),
    ("e", "e"),
    ("i", "i"),
    ("o", "o"),
    ("u", "u"),
]

# Cross-variety transliteration maps
MUTSUN_TO_RUMSEN = [
    ("tY", "—"),   # No direct Rumsen equivalent
    ("ts", "ţ"),
    ("L", "L"),    # No Rumsen equivalent (keep as-is)
    ("N", "N"),    # No Rumsen equivalent
    ("S", "ş"),
    ("T", "T"),    # Rumsen may not distinguish this
    ("c", "č"),
    ("ʼ", "ʼ"),
]

TRANSLITERATION_SETS = {
    ("mutsun", "ipa"): MUTSUN_TO_IPA,
    ("rumsen", "ipa"): RUMSEN_TO_IPA,
    ("chochenyo", "ipa"): CHOCHENYO_TO_IPA,
    ("mutsun", "rumsen"): MUTSUN_TO_RUMSEN,
}


def transliterate(text: str, mapping: list[tuple[str, str]]) -> str:
    """Apply a transliteration mapping to text, matching longest sequences first."""
    result = []
    i = 0
    while i < len(text):
        matched = False
        # Try longest matches first
        for source, target in mapping:
            if text[i:i+len(source)] == source:
                result.append(target)
                i += len(source)
                matched = True
                break
        if not matched:
            result.append(text[i])
            i += 1
    return "".join(result)


def show_interlinear(text: str, mapping: list[tuple[str, str]]) -> str:
    """Show character-by-character transliteration in interlinear format."""
    segments_src = []
    segments_tgt = []
    i = 0
    while i < len(text):
        matched = False
        for source, target in mapping:
            if text[i:i+len(source)] == source:
                segments_src.append(source)
                segments_tgt.append(target)
                i += len(source)
                matched = True
                break
        if not matched:
            segments_src.append(text[i])
            segments_tgt.append(text[i])
            i += 1
    
    # Align columns
    widths = [max(len(s), len(t)) for s, t in zip(segments_src, segments_tgt)]
    line1 = "  ".join(s.center(w) for s, w in zip(segments_src, widths))
    line2 = "  ".join(t.center(w) for t, w in zip(segments_tgt, widths))
    return f"Source: {line1}\nIPA:    {line2}"


def main():
    parser = argparse.ArgumentParser(
        description="Transliterate between Ohlone orthographic systems."
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        help="Input text file (reads stdin if omitted)",
    )
    parser.add_argument(
        "--from", "-f",
        dest="source",
        choices=["mutsun", "rumsen", "chochenyo", "ocen"],
        required=True,
        help="Source orthographic system",
    )
    parser.add_argument(
        "--to", "-t",
        dest="target",
        choices=["ipa", "mutsun", "rumsen", "chochenyo"],
        required=True,
        help="Target orthographic system",
    )
    parser.add_argument(
        "--interlinear", "-i",
        action="store_true",
        help="Show interlinear (aligned) transliteration",
    )
    
    args = parser.parse_args()
    
    # Read input
    if args.input_file:
        with open(args.input_file, "r", encoding="utf-8") as f:
            text = f.read().strip()
    else:
        text = sys.stdin.read().strip()
    
    # Find mapping
    key = (args.source, args.target)
    if key not in TRANSLITERATION_SETS:
        print(f"Error: No transliteration mapping from {args.source} to {args.target}", file=sys.stderr)
        print(f"Available: {', '.join(f'{s}→{t}' for s, t in TRANSLITERATION_SETS)}", file=sys.stderr)
        sys.exit(1)
    
    mapping = TRANSLITERATION_SETS[key]
    
    if args.interlinear:
        for line in text.split("\n"):
            if line.strip():
                print(show_interlinear(line, mapping))
                print()
    else:
        print(transliterate(text, mapping))


if __name__ == "__main__":
    main()

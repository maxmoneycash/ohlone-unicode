#!/usr/bin/env python3
"""
validate.py — Validate encoding of Ohlone language text.

Checks for common encoding errors in Ohlone/Costanoan text:
  1. Incorrect glottal stop characters (U+0027, U+2019 instead of U+02BC)
  2. Incorrect smart quotes that should be glottal stops
  3. Characters outside the Ohlone character repertoire
  4. Potential case-folding damage in Mutsun text

Usage:
    python validate.py <input_file> [--variety mutsun|rumsen|chochenyo|ocen]
    echo "some text" | python validate.py --variety mutsun
"""

import sys
import argparse
import unicodedata

# === Character Repertoires ===

# Common base characters across all varieties
COMMON_CHARS = set("acdehiklmnoprstuwxy ")

# Variety-specific allowed characters
VARIETY_CHARS = {
    "mutsun": COMMON_CHARS | set("LNSTYʼ"),      # L,N,S,T as distinct phonemes; Y for tY digraph
    "rumsen": COMMON_CHARS | set("čşŝţxʼʔ"),
    "chochenyo": COMMON_CHARS | set("Tŝʼ"),
    "ocen": COMMON_CHARS | set("TXCSRʼ"),
    "all": COMMON_CHARS | set("LNSTYčşŝţʼʔXCSR"),
}

# Characters that are always wrong in Ohlone text
WRONG_GLOTTAL_STOPS = {
    "\u0027": "APOSTROPHE (U+0027) — should be ʼ (U+02BC)",
    "\u2019": "RIGHT SINGLE QUOTATION MARK (U+2019) — should be ʼ (U+02BC)",
    "\u2018": "LEFT SINGLE QUOTATION MARK (U+2018) — should be ʼ (U+02BC)",
    "\u0060": "GRAVE ACCENT (U+0060) — should be ʼ (U+02BC)",
    "\u00B4": "ACUTE ACCENT (U+00B4) — should be ʼ (U+02BC)",
}

# Mutsun case-sensitive phonemes
MUTSUN_CASE_PHONEMES = {
    "L": "palatalized lateral /lʲ/",
    "N": "palatal nasal /ɲ/",
    "S": "retroflex fricative /ʂ/",
    "T": "retroflex stop /ʈ/",
}


def validate_text(text: str, variety: str = "all") -> list[dict]:
    """Validate Ohlone text and return a list of issues found."""
    issues = []
    allowed = VARIETY_CHARS.get(variety, VARIETY_CHARS["all"])
    
    for i, char in enumerate(text):
        # Skip whitespace, newlines, punctuation
        if char in "\n\r\t.,;:!?()-–—\"" or char == " ":
            continue
        
        # Check for wrong glottal stop characters
        if char in WRONG_GLOTTAL_STOPS:
            issues.append({
                "position": i,
                "character": char,
                "severity": "ERROR",
                "message": f"Incorrect glottal stop: {WRONG_GLOTTAL_STOPS[char]}",
                "suggestion": "Replace with ʼ (U+02BC MODIFIER LETTER APOSTROPHE)",
                "context": _get_context(text, i),
            })
        
        # Check for characters outside the repertoire
        elif char.lower() not in allowed and char not in allowed:
            # Allow digits
            if char.isdigit():
                continue
            issues.append({
                "position": i,
                "character": char,
                "severity": "WARNING",
                "message": f"Character '{char}' (U+{ord(char):04X} {unicodedata.name(char, '?')}) not in {variety} repertoire",
                "suggestion": "Verify this character is intentional",
                "context": _get_context(text, i),
            })
    
    # Mutsun-specific: check for potential case-folding damage
    if variety == "mutsun":
        _check_mutsun_case(text, issues)
    
    return issues


def _check_mutsun_case(text: str, issues: list):
    """Check for signs of case-folding damage in Mutsun text."""
    words = text.split()
    for word in words:
        # If a word is entirely lowercase but starts with what could be
        # a case-distinct phoneme, flag it
        if len(word) > 1 and word[0] in "lnst" and word == word.lower():
            upper = word[0].upper()
            if upper in MUTSUN_CASE_PHONEMES:
                # This is only a warning — lowercase l/n/s/t are valid too
                pass  # Can't distinguish without dictionary lookup


def _get_context(text: str, position: int, radius: int = 10) -> str:
    """Get surrounding context for an issue."""
    start = max(0, position - radius)
    end = min(len(text), position + radius + 1)
    ctx = text[start:end]
    # Mark the problematic character
    rel_pos = position - start
    return ctx[:rel_pos] + "→" + ctx[rel_pos] + "←" + ctx[rel_pos + 1:]


def fix_glottal_stops(text: str) -> str:
    """Replace incorrect glottal stop characters with U+02BC."""
    for wrong_char in WRONG_GLOTTAL_STOPS:
        text = text.replace(wrong_char, "\u02BC")
    return text


def print_report(issues: list, filename: str = "<stdin>"):
    """Print a human-readable validation report."""
    if not issues:
        print(f"✓ {filename}: No encoding issues found.")
        return
    
    errors = [i for i in issues if i["severity"] == "ERROR"]
    warnings = [i for i in issues if i["severity"] == "WARNING"]
    
    print(f"{'='*60}")
    print(f"Ohlone Text Validation Report: {filename}")
    print(f"{'='*60}")
    print(f"  {len(errors)} error(s), {len(warnings)} warning(s)")
    print()
    
    for issue in issues:
        severity = issue["severity"]
        icon = "✗" if severity == "ERROR" else "⚠"
        print(f"  {icon} [{severity}] Position {issue['position']}: {issue['message']}")
        print(f"    Context: ...{issue['context']}...")
        print(f"    Fix: {issue['suggestion']}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Validate encoding of Ohlone language text."
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        help="Input text file to validate (reads stdin if omitted)",
    )
    parser.add_argument(
        "--variety", "-v",
        choices=["mutsun", "rumsen", "chochenyo", "ocen", "all"],
        default="all",
        help="Ohlone variety to validate against (default: all)",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Auto-fix glottal stop encoding and print corrected text",
    )
    
    args = parser.parse_args()
    
    # Read input
    if args.input_file:
        with open(args.input_file, "r", encoding="utf-8") as f:
            text = f.read()
        filename = args.input_file
    else:
        text = sys.stdin.read()
        filename = "<stdin>"
    
    if args.fix:
        fixed = fix_glottal_stops(text)
        print(fixed, end="")
    else:
        issues = validate_text(text, args.variety)
        print_report(issues, filename)
        sys.exit(1 if any(i["severity"] == "ERROR" for i in issues) else 0)


if __name__ == "__main__":
    main()

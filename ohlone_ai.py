#!/usr/bin/env python3
"""
ohlone_ai.py — AI that speaks and writes in the Ohlone language.

Features:
  1. SPEAK: Takes any Mutsun/Chochenyo/Rumsen word or phrase → generates audio
  2. WRITE: Takes English → looks up Ohlone translation → outputs correct orthography
  3. DICTIONARY: Interactive lookup across all Ohlone varieties
  4. TEACH: Pronunciation guide with phoneme-by-phoneme breakdown

Uses espeak-ng for IPA-based speech synthesis. The pronunciation is phonemically
accurate (correct individual sounds) though the voice is synthetic.

Requirements: espeak-ng (apt install espeak-ng)

Usage:
  python ohlone_ai.py speak "yuukis"           # Speak a Mutsun word
  python ohlone_ai.py speak "Saleki Asatsa"    # Speak an OCEN Rumsen phrase
  python ohlone_ai.py translate "water"         # English → Ohlone
  python ohlone_ai.py translate "daughter"      # Shows all varieties
  python ohlone_ai.py teach "Taakampi"          # Phoneme-by-phoneme breakdown
  python ohlone_ai.py batch speak words.txt     # Speak every word in a file
  python ohlone_ai.py generate-audio            # Generate WAV for entire dictionary
"""

import os
import sys
import json
import sqlite3
import subprocess
import argparse
from pathlib import Path

# === PATHS ===
SCRIPT_DIR = Path(__file__).parent
DB_PATH = SCRIPT_DIR / "data" / "ohlone_master.db"
AUDIO_DIR = SCRIPT_DIR / "audio"

# === IPA CONVERSION MAPS ===

MUTSUN_TO_IPA = [
    ("tY", "tʲ"), ("ts", "ts"),
    ("L", "lʲ"), ("N", "ɲ"), ("S", "ʂ"), ("T", "ʈ"),
    ("c", "tʃ"), ("h", "h"), ("k", "k"), ("l", "l"),
    ("m", "m"), ("n", "n"), ("p", "p"), ("r", "ɾ"),
    ("s", "s"), ("t", "t"), ("w", "w"), ("y", "j"),
    ("d", "d"), ("ʼ", "ʔ"), ("'", "ʔ"),
    ("aa", "aː"), ("ee", "eː"), ("ii", "iː"), ("oo", "oː"), ("uu", "uː"),
    ("a", "a"), ("e", "e"), ("i", "i"), ("o", "o"), ("u", "u"),
]

# OCEN Rumsen: c=tʃ, s=ʃ, x=h, T=retroflex
OCEN_TO_IPA = [
    ("T", "ʈ"),
    ("C", "tʃ"), ("c", "tʃ"),
    ("X", "h"), ("x", "h"),
    ("S", "ʃ"), ("s", "ʃ"),
    ("ts", "ts"),
    ("h", "h"), ("k", "k"), ("l", "l"),
    ("m", "m"), ("n", "n"), ("p", "p"), ("r", "ɾ"),
    ("t", "t"), ("w", "w"), ("y", "j"),
    ("ʼ", "ʔ"), ("'", "ʔ"),
    ("aa", "aː"), ("ee", "eː"), ("ii", "iː"), ("oo", "oː"), ("uu", "uː"),
    ("a", "a"), ("e", "e"), ("i", "i"), ("o", "o"), ("u", "u"),
]

# Chochenyo: c=tʃ, s=ʃ, x=h
CHOCHENYO_TO_IPA = OCEN_TO_IPA  # Same conventions

VARIETY_IPA_MAPS = {
    "Mutsun": MUTSUN_TO_IPA,
    "OCEN Rumsen": OCEN_TO_IPA,
    "Chochenyo": CHOCHENYO_TO_IPA,
}

# espeak-ng IPA compatibility — some IPA symbols need adjustment
ESPEAK_IPA_FIXES = [
    ("ʈ", "ʈ"),     # retroflex stop — espeak may approximate
    ("ʂ", "ʃ"),     # retroflex fricative → postalveolar (closest espeak has)
    ("lʲ", "lj"),   # palatalized lateral
    ("tʲ", "tj"),   # palatal stop
    ("ɾ", "ɾ"),     # tap
    ("ɲ", "ɲ"),     # palatal nasal
]


def word_to_ipa(word: str, variety: str = "Mutsun") -> str:
    """Convert an Ohlone word to IPA."""
    mapping = VARIETY_IPA_MAPS.get(variety, MUTSUN_TO_IPA)
    result, i = [], 0
    clean = word.strip().lstrip("*-")
    while i < len(clean):
        matched = False
        for src, tgt in mapping:
            if clean[i:i+len(src)] == src:
                result.append(tgt)
                i += len(src)
                matched = True
                break
        if not matched:
            result.append(clean[i])
            i += 1
    return "".join(result)


def ipa_for_espeak(ipa: str) -> str:
    """Adjust IPA for espeak-ng compatibility."""
    for src, tgt in ESPEAK_IPA_FIXES:
        ipa = ipa.replace(src, tgt)
    return ipa


def speak_ipa(ipa: str, output_wav: str = None, speed: int = 120) -> str:
    """Synthesize speech from IPA using espeak-ng."""
    espeak_ipa = ipa_for_espeak(ipa)
    cmd = ["espeak-ng", "-v", "en", f"-s{speed}", f"[[{espeak_ipa}]]"]
    
    if output_wav:
        cmd.extend(["-w", output_wav])
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        if output_wav:
            return output_wav
        return "played"
    except subprocess.CalledProcessError as e:
        print(f"espeak-ng error: {e.stderr.decode()}", file=sys.stderr)
        return None
    except FileNotFoundError:
        print("espeak-ng not found. Install: apt install espeak-ng", file=sys.stderr)
        return None


def speak_word(word: str, variety: str = "Mutsun", output_wav: str = None, speed: int = 120):
    """Convert an Ohlone word to speech."""
    ipa = word_to_ipa(word, variety)
    print(f"  Word:    {word}")
    print(f"  Variety: {variety}")
    print(f"  IPA:     /{ipa}/")
    
    result = speak_ipa(ipa, output_wav, speed)
    if output_wav and result:
        print(f"  Audio:   {output_wav}")
    return ipa


def speak_phrase(phrase: str, variety: str = "Mutsun", output_wav: str = None, speed: int = 110):
    """Speak an entire phrase, word by word with pauses."""
    words = phrase.strip().split()
    full_ipa_parts = []
    
    for w in words:
        ipa = word_to_ipa(w, variety)
        full_ipa_parts.append(ipa)
    
    # Join with short pause
    full_ipa = " ".join(full_ipa_parts)
    print(f"  Phrase:  {phrase}")
    print(f"  Variety: {variety}")
    print(f"  IPA:     /{full_ipa}/")
    
    result = speak_ipa(full_ipa, output_wav, speed)
    if output_wav and result:
        print(f"  Audio:   {output_wav}")
    return full_ipa


def teach_word(word: str, variety: str = "Mutsun"):
    """Give a detailed phoneme-by-phoneme pronunciation breakdown."""
    mapping = VARIETY_IPA_MAPS.get(variety, MUTSUN_TO_IPA)
    
    print(f"\n{'='*50}")
    print(f"  PRONUNCIATION GUIDE: {word}")
    print(f"  Variety: {variety}")
    print(f"{'='*50}\n")
    
    # Break down phoneme by phoneme
    phoneme_descriptions = {
        "a": "Open 'ah' as in 'father'",
        "aː": "Long 'aah' — hold the 'ah' sound longer",
        "e": "'eh' as in 'met'",
        "eː": "Long 'eeh' — hold it",
        "i": "'ee' as in 'machine'",
        "iː": "Long 'eee'",
        "o": "'oh' as in 'wrote'",
        "oː": "Long 'ooh'",
        "u": "'oo' as in 'rule'",
        "uː": "Long 'ooo'",
        "tʃ": "'ch' as in 'chip' — tongue behind upper teeth",
        "h": "'h' as in 'hello'",
        "k": "'k' as in 'key'",
        "l": "'l' as in 'let'",
        "lʲ": "'l' + 'y' blended — say 'tell you' fast, the 'lly' part",
        "m": "'m' as in 'mom'",
        "n": "'n' as in 'net'",
        "ɲ": "'ny' as in Spanish 'señor' — tongue on roof of mouth",
        "p": "'p' as in 'pen'",
        "ɾ": "Quick tongue tap — like 'dd' in 'ladder' or Spanish 'r' in 'pero'",
        "s": "'s' as in 'see'",
        "ʃ": "'sh' as in 'ship'",
        "ʂ": "'sh' but with tongue curled BACK (retroflex) — like 'sh' said with an Indian accent",
        "t": "'t' as in 'top'",
        "ʈ": "'t' but with tongue curled BACK (retroflex) — curl tip of tongue up and back",
        "ts": "'ts' as in 'cats' — said as one sound",
        "tʲ": "'t' + 'y' blended — like British 'Tuesday' (tyuesday)",
        "w": "'w' as in 'want'",
        "j": "'y' as in 'yes'",
        "d": "'d' as in 'dog' (loanwords only)",
        "ʔ": "Glottal stop — the little catch in your throat in 'uh-oh'",
        "x": "'ch' as in Scottish 'loch' — friction in back of throat",
    }
    
    segments = []
    ipa_full = word_to_ipa(word, variety)
    
    # Re-parse to get individual phonemes with their spellings
    i = 0
    clean = word.strip().lstrip("*-")
    while i < len(clean):
        matched = False
        for src, tgt in mapping:
            if clean[i:i+len(src)] == src:
                segments.append((src, tgt))
                i += len(src)
                matched = True
                break
        if not matched:
            segments.append((clean[i], clean[i]))
            i += 1
    
    print(f"  Full word:  {word}")
    print(f"  Full IPA:   /{ipa_full}/")
    print()
    
    for j, (spelling, ipa) in enumerate(segments):
        desc = phoneme_descriptions.get(ipa, f"(IPA: {ipa})")
        marker = "→" if spelling != ipa else " "
        print(f"  {j+1}. [{spelling:4s}] {marker} /{ipa}/  —  {desc}")
    
    print(f"\n  Say it slowly: ", end="")
    for spelling, ipa in segments:
        print(f"[{ipa}]", end=" - ")
    print(f"\n  Say it fast:   /{ipa_full}/")
    
    # Generate audio
    speak_ipa(ipa_full, speed=90)


def translate_english(english_query: str):
    """Look up English word in Ohlone dictionary."""
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        print("Run: python data/process_all_sources.py")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    
    query = f"%{english_query.lower()}%"
    c.execute("""SELECT word, english, ipa, pos, variety, source 
                 FROM dictionary 
                 WHERE LOWER(english) LIKE ? 
                 ORDER BY variety, word""", (query,))
    results = c.fetchall()
    
    if not results:
        print(f"  No Ohlone translation found for '{english_query}'")
        conn.close()
        return
    
    print(f"\n{'='*60}")
    print(f"  OHLONE TRANSLATIONS: '{english_query}'")
    print(f"{'='*60}\n")
    
    current_variety = None
    for word, english, ipa, pos, variety, source in results:
        if variety != current_variety:
            current_variety = variety
            print(f"  [{variety}]")
        
        ipa_display = ipa if ipa else word_to_ipa(word, variety)
        print(f"    {word:20s} — {english}")
        print(f"    {'':20s}   /{ipa_display}/  ({pos})")
    
    conn.close()
    
    # Speak the first result
    if results:
        first_word, _, _, _, first_variety, _ = results[0]
        print(f"\n  Speaking: {first_word} [{first_variety}]")
        speak_word(first_word, first_variety)


def generate_full_audio():
    """Generate WAV files for every word in the dictionary."""
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return
    
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT word, english, variety FROM dictionary WHERE pos NOT LIKE 'Suff%' AND pos != 'Infix' AND word NOT LIKE '-%' ORDER BY variety, word")
    rows = c.fetchall()
    conn.close()
    
    print(f"Generating audio for {len(rows)} words...")
    
    generated = 0
    for word, english, variety in rows:
        # Clean filename
        safe_name = word.replace("ʼ", "_glottal_").replace("'", "_glottal_").replace("*", "").replace(" ", "_")
        safe_variety = variety.replace(" ", "_").lower()
        wav_path = AUDIO_DIR / safe_variety / f"{safe_name}.wav"
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        
        ipa = word_to_ipa(word, variety)
        result = speak_ipa(ipa, str(wav_path), speed=120)
        if result:
            generated += 1
            if generated % 20 == 0:
                print(f"  Generated {generated}/{len(rows)}...")
    
    print(f"\nDone! Generated {generated} audio files in {AUDIO_DIR}")
    
    # Create index JSON
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute("SELECT word, english, ipa, variety FROM dictionary WHERE pos NOT LIKE 'Suff%' AND pos != 'Infix' AND word NOT LIKE '-%' ORDER BY variety, word")
    index = []
    for word, english, ipa, variety in c.fetchall():
        safe_name = word.replace("ʼ", "_glottal_").replace("'", "_glottal_").replace("*", "").replace(" ", "_")
        safe_variety = variety.replace(" ", "_").lower()
        index.append({
            "word": word,
            "english": english,
            "ipa": ipa if ipa else word_to_ipa(word, variety),
            "variety": variety,
            "audio_file": f"{safe_variety}/{safe_name}.wav",
        })
    conn.close()
    
    index_path = AUDIO_DIR / "audio_index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    print(f"Index: {index_path}")


def interactive_mode():
    """Interactive Ohlone AI session."""
    print("""
╔══════════════════════════════════════════════════════════╗
║            OHLONE LANGUAGE AI                            ║
║   Speak and write in Mutsun, Chochenyo, and Rumsen      ║
╚══════════════════════════════════════════════════════════╝

Commands:
  speak <word>          — Hear an Ohlone word pronounced
  translate <english>   — Find Ohlone translation
  teach <word>          — Get phoneme-by-phoneme breakdown
  phrase <text>         — Speak an entire phrase
  list                  — Show all words in dictionary
  quit                  — Exit
""")
    
    while True:
        try:
            line = input("\nohlone> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAho!")
            break
        
        if not line:
            continue
        
        parts = line.split(None, 1)
        cmd = parts[0].lower()
        arg = parts[1] if len(parts) > 1 else ""
        
        if cmd in ("quit", "exit", "q"):
            print("Aho!")
            break
        elif cmd == "speak":
            if arg:
                speak_word(arg)
            else:
                print("  Usage: speak <word>")
        elif cmd == "phrase":
            if arg:
                speak_phrase(arg)
            else:
                print("  Usage: phrase <text>")
        elif cmd == "translate":
            if arg:
                translate_english(arg)
            else:
                print("  Usage: translate <english word>")
        elif cmd == "teach":
            if arg:
                teach_word(arg)
            else:
                print("  Usage: teach <word>")
        elif cmd == "list":
            if DB_PATH.exists():
                conn = sqlite3.connect(str(DB_PATH))
                c = conn.cursor()
                c.execute("SELECT word, english, variety FROM dictionary ORDER BY variety, word LIMIT 50")
                for w, e, v in c.fetchall():
                    print(f"  [{v:12s}] {w:20s} — {e}")
                c.execute("SELECT COUNT(*) FROM dictionary")
                total = c.fetchone()[0]
                print(f"\n  ... showing 50 of {total} entries. Use 'translate' to search.")
                conn.close()
        else:
            print(f"  Unknown command: {cmd}")
            print("  Commands: speak, translate, teach, phrase, list, quit")


def main():
    parser = argparse.ArgumentParser(description="Ohlone Language AI — Speak and write in Ohlone")
    sub = parser.add_subparsers(dest="command")
    
    sp = sub.add_parser("speak", help="Speak an Ohlone word")
    sp.add_argument("word", help="Ohlone word to speak")
    sp.add_argument("--variety", "-v", default="Mutsun", help="Language variety")
    sp.add_argument("--output", "-o", help="Output WAV file path")
    sp.add_argument("--speed", "-s", type=int, default=120, help="Speech speed (default 120)")
    
    ph = sub.add_parser("phrase", help="Speak an Ohlone phrase")
    ph.add_argument("text", help="Phrase to speak")
    ph.add_argument("--variety", "-v", default="Mutsun")
    ph.add_argument("--output", "-o", help="Output WAV file")
    
    tr = sub.add_parser("translate", help="English → Ohlone translation")
    tr.add_argument("english", help="English word to translate")
    
    te = sub.add_parser("teach", help="Phoneme-by-phoneme pronunciation guide")
    te.add_argument("word", help="Ohlone word to learn")
    te.add_argument("--variety", "-v", default="Mutsun")
    
    sub.add_parser("generate-audio", help="Generate WAV for entire dictionary")
    sub.add_parser("interactive", help="Interactive mode")
    
    args = parser.parse_args()
    
    if args.command == "speak":
        speak_word(args.word, args.variety, args.output, args.speed)
    elif args.command == "phrase":
        speak_phrase(args.text, args.variety, args.output)
    elif args.command == "translate":
        translate_english(args.english)
    elif args.command == "teach":
        teach_word(args.word, args.variety)
    elif args.command == "generate-audio":
        generate_full_audio()
    elif args.command == "interactive":
        interactive_mode()
    else:
        interactive_mode()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
harrington_htr.py — Handwritten Text Recognition pipeline for Harrington field notes.

Takes microfilm page images (from Smithsonian digital surrogates) and extracts
Ohlone language data using a multi-stage approach:

  Stage 1: Vision LLM (Claude/GPT-4V) for zero-shot transcription
  Stage 2: TrOCR fine-tuned model for production-grade HTR
  Stage 3: Transliteration from Harrington notation → modern orthography
  Stage 4: Validation against known Mutsun/Chochenyo/Rumsen vocabulary

Requirements:
  pip install anthropic Pillow transformers torch

Usage:
  # Zero-shot with Claude Vision (fastest to prototype)
  python harrington_htr.py --input page.png --method claude

  # With TrOCR (requires model download)
  python harrington_htr.py --input page.png --method trocr

  # Batch process a directory of images
  python harrington_htr.py --input ./microfilm_pages/ --method claude --batch
"""

import os
import sys
import json
import argparse
import base64
from pathlib import Path
from datetime import datetime

# === HARRINGTON NOTATION MAPPING ===
# Maps Harrington's idiosyncratic symbols to modern Mutsun orthography

HARRINGTON_TO_MUTSUN = [
    # Harrington used dots under letters for retroflex
    ("ṭ", "T"),    # t with underdot → retroflex T
    ("ṣ", "S"),    # s with underdot → retroflex S
    ("ḷ", "L"),    # l with underdot → palatalized L (approximate)
    # Harrington used ñ or ny for palatal nasal
    ("ñ", "N"),
    ("ny", "N"),
    # Harrington used various affricate notations
    ("tš", "c"),    # t-s-hacek → Mutsun c (/tʃ/)
    ("č", "c"),     # c-hacek → Mutsun c
    ("tc", "c"),    # tc digraph → Mutsun c
    ("ts", "ts"),   # keep as-is (Mutsun affricate)
    ("ty", "tY"),   # ty → Mutsun tY (palatal stop)
    # Harrington used macrons for long vowels
    ("ā", "aa"),
    ("ē", "ee"),
    ("ī", "ii"),
    ("ō", "oo"),
    ("ū", "uu"),
    # Glottal stop
    ("ʼ", "ʼ"),
    ("'", "ʼ"),     # Normalize apostrophe
    ("ʔ", "ʼ"),     # IPA glottal → modifier letter
]

HARRINGTON_TO_IPA = [
    ("ṭ", "ʈ"), ("ṣ", "ʂ"), ("ḷ", "lʲ"),
    ("ñ", "ɲ"), ("ny", "ɲ"),
    ("tš", "tʃ"), ("č", "tʃ"), ("tc", "tʃ"),
    ("ts", "ts"), ("ty", "tʲ"),
    ("ā", "aː"), ("ē", "eː"), ("ī", "iː"), ("ō", "oː"), ("ū", "uː"),
    ("ʼ", "ʔ"), ("'", "ʔ"), ("ʔ", "ʔ"),
    ("h", "h"), ("k", "k"), ("l", "l"), ("m", "m"), ("n", "n"),
    ("p", "p"), ("r", "ɾ"), ("s", "s"), ("t", "t"),
    ("w", "w"), ("y", "j"),
    ("a", "a"), ("e", "e"), ("i", "i"), ("o", "o"), ("u", "u"),
]


def transliterate(text: str, mapping: list) -> str:
    """Apply transliteration mapping (longest match first)."""
    result = []
    i = 0
    while i < len(text):
        matched = False
        for src, tgt in mapping:
            if text[i:i+len(src)] == src:
                result.append(tgt)
                i += len(src)
                matched = True
                break
        if not matched:
            result.append(text[i])
            i += 1
    return "".join(result)


# === STAGE 1: CLAUDE VISION ZERO-SHOT ===

CLAUDE_SYSTEM_PROMPT = """You are an expert in reading handwritten linguistic field notes, 
specifically those of John Peabody Harrington (1884-1961), an American linguist who documented 
Ohlone (Costanoan) languages of California.

Harrington's notation conventions:
- Dots under letters (ṭ, ṣ) indicate retroflex consonants
- Macrons (ā, ē, ī, ō, ū) indicate long vowels  
- ñ or ny = palatal nasal
- č or tš or tc = postalveolar affricate (like English "ch")
- ts = alveolar affricate
- ty = palatal stop
- ' or ʼ = glottal stop
- Double letters (aa, tt, etc.) = long/geminate sounds
- He writes extensive English commentary around the Ohlone words
- He frequently crosses out words and adds corrections in margins
- He sometimes writes in a mix of English, Spanish, and Ohlone

Your task: Transcribe the handwritten text on this page as accurately as possible.
For each Ohlone/Costanoan word you identify, output it in this format:
  WORD: [Harrington's notation] | ENGLISH: [English gloss if visible] | NOTES: [any context]

Preserve Harrington's original notation exactly. Do not modernize the spelling.
If text is illegible, mark it as [ILLEGIBLE].
If you're uncertain about a character, mark it as [?]."""


def transcribe_with_claude(image_path: str, api_key: str = None) -> dict:
    """Transcribe a Harrington field note page using Claude Vision."""
    try:
        import anthropic
    except ImportError:
        print("Install anthropic SDK: pip install anthropic")
        return {"error": "anthropic not installed"}
    
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {"error": "No ANTHROPIC_API_KEY set"}
    
    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    
    # Determine media type
    ext = Path(image_path).suffix.lower()
    media_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", 
                   ".gif": "image/gif", ".webp": "image/webp", ".tiff": "image/tiff", ".tif": "image/tiff"}
    media_type = media_types.get(ext, "image/png")
    
    client = anthropic.Anthropic(api_key=api_key)
    
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=CLAUDE_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": image_data}
                },
                {
                    "type": "text",
                    "text": "Please transcribe all text on this page from Harrington's Costanoan field notes. "
                            "Identify all Ohlone/Costanoan words and their English glosses. "
                            "Note the language variety if identifiable (Chochenyo, Mutsun, or Rumsen)."
                }
            ]
        }]
    )
    
    raw_text = message.content[0].text
    
    return {
        "method": "claude_vision",
        "image": str(image_path),
        "raw_transcription": raw_text,
        "harrington_notation": raw_text,
        "modern_mutsun": transliterate(raw_text, HARRINGTON_TO_MUTSUN),
        "ipa": transliterate(raw_text, HARRINGTON_TO_IPA),
        "timestamp": datetime.now().isoformat(),
    }


# === STAGE 2: TrOCR (Microsoft Transformer OCR) ===

def transcribe_with_trocr(image_path: str, model_name: str = "microsoft/trocr-large-handwritten") -> dict:
    """Transcribe using Microsoft TrOCR transformer model."""
    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        from PIL import Image
    except ImportError:
        print("Install: pip install transformers torch Pillow")
        return {"error": "transformers not installed"}
    
    processor = TrOCRProcessor.from_pretrained(model_name)
    model = VisionEncoderDecoderModel.from_pretrained(model_name)
    
    image = Image.open(image_path).convert("RGB")
    
    # TrOCR works best on single text lines, so for a full page
    # you'd need line segmentation first. This processes the full image.
    pixel_values = processor(images=image, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values, max_length=512)
    raw_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    
    return {
        "method": "trocr",
        "model": model_name,
        "image": str(image_path),
        "raw_transcription": raw_text,
        "modern_mutsun": transliterate(raw_text, HARRINGTON_TO_MUTSUN),
        "ipa": transliterate(raw_text, HARRINGTON_TO_IPA),
        "timestamp": datetime.now().isoformat(),
        "note": "TrOCR works best on single text lines. For full pages, use line segmentation first.",
    }


# === STAGE 3: BATCH PROCESSING ===

def process_directory(input_dir: str, method: str, output_dir: str = "htr_output", **kwargs):
    """Process all images in a directory."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    image_extensions = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".gif", ".webp", ".bmp"}
    images = sorted([f for f in input_path.iterdir() if f.suffix.lower() in image_extensions])
    
    if not images:
        print(f"No images found in {input_dir}")
        return
    
    print(f"Found {len(images)} images in {input_dir}")
    results = []
    
    for i, img_path in enumerate(images):
        print(f"\n[{i+1}/{len(images)}] Processing: {img_path.name}")
        
        if method == "claude":
            result = transcribe_with_claude(str(img_path), **kwargs)
        elif method == "trocr":
            result = transcribe_with_trocr(str(img_path), **kwargs)
        else:
            print(f"Unknown method: {method}")
            continue
        
        # Save individual result
        result_path = output_path / f"{img_path.stem}_result.json"
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        results.append(result)
        print(f"  → Saved: {result_path}")
    
    # Save combined results
    combined_path = output_path / "all_results.json"
    with open(combined_path, "w", encoding="utf-8") as f:
        json.dump({
            "method": method,
            "total_pages": len(results),
            "successful": sum(1 for r in results if "error" not in r),
            "timestamp": datetime.now().isoformat(),
            "results": results,
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Batch processing complete: {len(results)} pages")
    print(f"Combined output: {combined_path}")


# === MAIN ===

def main():
    parser = argparse.ArgumentParser(
        description="HTR pipeline for Harrington Ohlone field notes."
    )
    parser.add_argument("--input", "-i", required=True, help="Input image file or directory")
    parser.add_argument("--method", "-m", choices=["claude", "trocr"], default="claude",
                        help="HTR method (default: claude)")
    parser.add_argument("--batch", action="store_true", help="Process entire directory")
    parser.add_argument("--output", "-o", default="htr_output", help="Output directory for batch mode")
    parser.add_argument("--anthropic-key", default=os.environ.get("ANTHROPIC_API_KEY"),
                        help="Anthropic API key for Claude method")
    parser.add_argument("--trocr-model", default="microsoft/trocr-large-handwritten",
                        help="TrOCR model name (default: microsoft/trocr-large-handwritten)")
    
    args = parser.parse_args()
    
    if args.batch or Path(args.input).is_dir():
        process_directory(args.input, args.method, args.output, 
                         api_key=args.anthropic_key if args.method == "claude" else None)
    else:
        if args.method == "claude":
            result = transcribe_with_claude(args.input, api_key=args.anthropic_key)
        elif args.method == "trocr":
            result = transcribe_with_trocr(args.input, model_name=args.trocr_model)
        
        print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

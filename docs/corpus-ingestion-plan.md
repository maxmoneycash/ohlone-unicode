# Ohlone Corpus Ingestion Plan

This project should stay language-first: dictionary, orthography, texts, place names, source review, and audio alignment. History belongs in the corpus when it explains a word, source, speaker, place name, text, or recording.

## Data Principles

- Keep discovery records separate from ingested language data.
- Never treat a public web page or video as permission to train a model.
- Store provenance for every form: source, page or timestamp, variety, confidence, and review status.
- Keep sensitive songs, stories, prayers, and ceremonial material cataloged but not reused unless permission is explicit.
- Prefer phrase-level aligned examples over isolated words when building AI context.

## Written Source Pipeline

1. Add candidate sources to `data/corpus_source_backlog.json`.
2. Review rights, community sensitivity, and source quality.
3. Extract entries into a review file before merging into `data/ohlone_master.json`.
4. Preserve source spelling in notes when normalized spelling is added.
5. Rebuild `data/ohlone_master.db` after approved JSON changes.

Minimum record fields:

```json
{
  "word": "attested form",
  "english": "gloss or translation",
  "variety": "Mutsun",
  "source": "source name",
  "page_ref": "page, image, folio, or item id",
  "notes": "review status and source spelling"
}
```

## Audio Alignment Pipeline

1. Add each media lead to `data/audio_alignment_manifest.json`.
2. Pull metadata and captions only; do not download or reuse full media until rights are clear.
3. Mark Ohlone-language spans separately from English commentary.
4. Segment into short clips only after permission review.
5. Store one row per segment with start/end timestamps, text, translation, source, speaker if public, rights status, and review status.

Recommended segment fields:

```json
{
  "source_id": "youtube-video-id-or-archive-id",
  "start": 12.4,
  "end": 16.9,
  "variety": "Chochenyo",
  "text": "written Ohlone form",
  "translation": "English translation",
  "speaker": "public speaker name or null",
  "rights_status": "permission_confirmed | permission_required | restricted",
  "review_status": "draft | language_reviewed | approved"
}
```

## AI Build Path

The near-term target should be retrieval, not model training:

1. Build a source-grounded RAG assistant from dictionary entries, phrases, OCR notes, and approved texts.
2. Add phrase-level audio playback when an approved aligned segment exists.
3. Use transcription/alignment tools only to propose candidates for human review.
4. Train or fine-tune only after there is a permissioned corpus with enough aligned speech-text pairs.

## Immediate Priorities

- Finish item-level inventory for the Mutsun Text Collection.
- Convert high-value YouTube/audio leads into metadata and caption records.
- Create a manual review queue for OCR entries and audio segment candidates.
- Add source and review status filters to the website.
- Expand the assistant prompt with source metadata and uncertainty rules.

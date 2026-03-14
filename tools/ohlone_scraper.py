#!/usr/bin/env python3
"""
ohlone_scraper.py — Firecrawl-based pipeline to scrape all known Ohlone language sources.

Targets:
  1. Smithsonian SOVA — Harrington Costanoan microfilm (Volume 2, Reels 36-80)
  2. UC Berkeley CLA — Language archive pages for all 8 Ohlone varieties
  3. Mutsun Dictionary PDF — Full 677-page dictionary (CC BY-NC 4.0)
  4. OCEN Language page — Rumsen vocabulary and pronunciation guide
  5. Muwekma Ohlone — Chochenyo language revitalization materials
  6. Amah Mutsun — Language program materials
  7. Arroyo de la Cuesta (1862) — Archive.org public domain vocabulary
  8. Kroeber (1910) — UC Berkeley digital repository
  9. Okrand Grammar (1977) — eScholarship
  10. acorn.wiki — Chochenyo learning resources
  11. SCU Mutsun Text Collection — Santa Clara University
  12. Harrington Database (UC Davis) — Partial transcriptions index

Requirements:
  pip install firecrawl-py python-dotenv

Usage:
  export FIRECRAWL_API_KEY=fc-YOUR-API-KEY
  python ohlone_scraper.py [--target all|smithsonian|berkeley|dictionaries|community]
"""

import os
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

try:
    from firecrawl import Firecrawl
except ImportError:
    print("Install firecrawl-py: pip install firecrawl-py")
    exit(1)

# === CONFIGURATION ===

OUTPUT_DIR = Path("scraped_data")
SCREENSHOTS_DIR = OUTPUT_DIR / "screenshots"
MARKDOWN_DIR = OUTPUT_DIR / "markdown"
PDF_DIR = OUTPUT_DIR / "pdfs"
RAW_DIR = OUTPUT_DIR / "raw"

# Rate limiting
DELAY_BETWEEN_REQUESTS = 2  # seconds


# === TARGET URLS ===

# ---- SMITHSONIAN: Harrington Costanoan microfilm finding aids & digital surrogates ----
SMITHSONIAN_TARGETS = {
    "harrington_costanoan_part1": {
        "url": "https://sova.si.edu/record/NAA.1976-95",
        "description": "Harrington Costanoan finding aid — main entry",
        "formats": ["markdown", "links"],
    },
    "harrington_costanoan_part2": {
        "url": "https://www.si.edu/object/archives/components/sova-naa-1976-95-ref17248",
        "description": "Harrington Costanoan Part 2 — Chochenyo, Mutsun, Rumsen notes",
        "formats": ["markdown", "links"],
    },
    "harrington_costanoan_part3_learning_lab": {
        "url": "https://learninglab.si.edu/resources/view/216584",
        "description": "Harrington Costanoan Part 3 — Learning Lab with digital surrogates",
        "formats": ["markdown", "links", {"type": "screenshot", "fullPage": True}],
    },
    "harrington_guide_volume2_pdf": {
        "url": "http://anthropology.si.edu/naa/harrington/pdf/mf_guides/jp harrington guide - volume 2.pdf",
        "description": "Guide to Harrington field notes Vol 2 (Northern & Central CA) — includes Costanoan reel index",
        "formats": ["markdown"],
        "parsers": ["pdf"],
    },
    "naa_harrington_index": {
        "url": "https://anthropology.si.edu/naa/harrington/index.html",
        "description": "NAA Harrington papers main index page",
        "formats": ["markdown", "links"],
    },
}

# ---- UC BERKELEY: California Language Archive ----
BERKELEY_TARGETS = {
    "cla_chochenyo": {
        "url": "https://cla.berkeley.edu/languages/chochenyo.html",
        "description": "CLA Chochenyo language page — bibliography, materials list",
        "formats": ["markdown", "links"],
    },
    "cla_mutsun": {
        "url": "https://cla.berkeley.edu/languages/mutsun.html",
        "description": "CLA Mutsun language page",
        "formats": ["markdown", "links"],
    },
    "cla_rumsen": {
        "url": "https://cla.berkeley.edu/languages/rumsen.html",
        "description": "CLA Rumsen language page",
        "formats": ["markdown", "links"],
    },
    "cla_awaswas": {
        "url": "https://cla.berkeley.edu/languages/awaswas.html",
        "description": "CLA Awaswas language page",
        "formats": ["markdown", "links"],
    },
    "cla_chalon": {
        "url": "https://cla.berkeley.edu/languages/chalon.html",
        "description": "CLA Chalon (Soledad) language page",
        "formats": ["markdown", "links"],
    },
    "cla_karkin": {
        "url": "https://cla.berkeley.edu/languages/karkin.html",
        "description": "CLA Karkin language page",
        "formats": ["markdown", "links"],
    },
    "cla_ramaytush": {
        "url": "https://cla.berkeley.edu/languages/ramaytush.html",
        "description": "CLA Ramaytush language page",
        "formats": ["markdown", "links"],
    },
    "cla_tamyen": {
        "url": "https://cla.berkeley.edu/languages/tamyen.html",
        "description": "CLA Tamyen language page",
        "formats": ["markdown", "links"],
    },
}

# ---- DICTIONARIES & GRAMMARS (Published, freely available) ----
DICTIONARY_TARGETS = {
    "mutsun_dictionary_pdf": {
        "url": "https://scholarspace.manoa.hawaii.edu/bitstream/10125/24679/3/MutsunDictionary_WarnerButlerGeary.pdf",
        "description": "Full Mutsun-English Dictionary (677 pages, CC BY-NC 4.0)",
        "formats": ["markdown"],
        "parsers": [{"type": "pdf", "mode": "ocr"}],  # Force OCR for best extraction
    },
    "mutsun_dictionary_alt": {
        "url": "https://www.santacruzmuseum.org/wp-content/uploads/2020/10/MutsunDictionary_WarnerButlerGeary.pdf",
        "description": "Mutsun Dictionary — alternate host (Santa Cruz Museum)",
        "formats": ["markdown"],
        "parsers": [{"type": "pdf", "mode": "auto"}],
    },
    "okrand_mutsun_grammar": {
        "url": "https://escholarship.org/uc/item/1p59z6kq",
        "description": "Okrand (1977) Mutsun Grammar — UC Berkeley eScholarship",
        "formats": ["markdown", "links"],
    },
    "arroyo_1862_vocabulary": {
        "url": "https://archive.org/details/vocabularyorphra00arro",
        "description": "Arroyo de la Cuesta (1862) Mutsun vocabulary — public domain",
        "formats": ["markdown", "links"],
    },
    "arroyo_1861_grammar_google": {
        "url": "https://books.google.com/books?id=Z99EAAAAcAAJ",
        "description": "Arroyo de la Cuesta (1861) Mutsun Grammar — Google Books",
        "formats": ["markdown"],
    },
    "scu_mutsun_collection": {
        "url": "https://scholarcommons.scu.edu/mutsun/3/",
        "description": "SCU Mutsun Text Collection — dictionary + additional texts",
        "formats": ["markdown", "links"],
    },
    "mason_1916_mutsun": {
        "url": "https://dpg.lib.berkeley.edu/webdb/anthpubs/search?all=&volume=11&journal=1&item=6",
        "description": "Mason (1916) Mutsun dialect of Costanoan — UC Berkeley UCPAAE",
        "formats": ["markdown", "links"],
    },
}

# ---- COMMUNITY / TRIBAL SOURCES (public-facing materials only) ----
COMMUNITY_TARGETS = {
    "ocen_language": {
        "url": "https://ohlonecostanoanesselennation.org/Language.html",
        "description": "OCEN Rumsen language page — vocabulary, pronunciation guide",
        "formats": ["markdown", {"type": "screenshot", "fullPage": True}],
    },
    "amah_mutsun_language": {
        "url": "https://amahmutsun.org/language",
        "description": "Amah Mutsun Tribal Band — language revitalization program",
        "formats": ["markdown", "links"],
    },
    "muwekma_language": {
        "url": "https://www.muwekma.org/language-revitalization.html",
        "description": "Muwekma Ohlone Tribe — Chochenyo language revitalization",
        "formats": ["markdown", {"type": "screenshot", "fullPage": True}],
    },
    "sogoreate_language": {
        "url": "https://sogoreate-landtrust.org/mak-noono-tiirinikma/",
        "description": "Sogorea Te' Land Trust — Mak Noono Tiirinikma Chochenyo program",
        "formats": ["markdown"],
    },
    "scu_ohlone_glossary": {
        "url": "https://www.scu.edu/community-heritage-lab/ohlone-heritage-hub/glossary/",
        "description": "SCU Ohlone Heritage Hub — Chochenyo glossary",
        "formats": ["markdown"],
    },
    "kanyon_contemporary_ohlone": {
        "url": "https://kanyonkonsulting.com/contemporary-ohlone-history/",
        "description": "Kanyon Konsulting — contemporary Ohlone history with language resources links",
        "formats": ["markdown", "links"],
    },
    "ramaytush_ohlone_curriculum": {
        "url": "https://www.ramaytush.org/uploads/3/0/1/6/30165671/2_-_curriculum-student_resources_ohlone.pdf",
        "description": "Ramaytush Ohlone curriculum — includes Chochenyo pronunciation guide",
        "formats": ["markdown"],
        "parsers": ["pdf"],
    },
    "sfpuc_ohlone_language": {
        "url": "https://www.sfpuc.gov/construction-contracts/lands-rights-of-way/historical-discoveries/archaeological-discoveries-san-0",
        "description": "SFPUC Ohlone language page — Ramaytush vocabulary",
        "formats": ["markdown"],
    },
    "native_languages_ohlone": {
        "url": "https://www.native-languages.org/ohlone.htm",
        "description": "Native Languages of the Americas — Ohlone resource links",
        "formats": ["markdown", "links"],
    },
    "native_languages_ohlone_words": {
        "url": "http://www.native-languages.org/ohlone_words.htm",
        "description": "Ohlone vocabulary word list with Penutian comparisons",
        "formats": ["markdown"],
    },
}

# ---- UC DAVIS HARRINGTON DATABASE ----
HARRINGTON_DB_TARGETS = {
    "ucdavis_harrington_db": {
        "url": "https://nas.ucdavis.edu/jp-harrington-database-project",
        "description": "UC Davis Harrington Database Project — partial transcriptions index",
        "formats": ["markdown", "links"],
    },
    "nalc_harrington_db": {
        "url": "https://nalc.ucdavis.edu/project/jp-harrington-database-project",
        "description": "NALC Harrington Database — alternate page",
        "formats": ["markdown", "links"],
    },
}

# ---- ACADEMIC PAPERS ----
ACADEMIC_TARGETS = {
    "rumsen_grammar_academia": {
        "url": "https://www.academia.edu/903550/Some_Observations_of_Rumsen_Ohlone_Grammar",
        "description": "Kaufman — Some Observations of Rumsen Ohlone Grammar",
        "formats": ["markdown"],
    },
    "ohlone_wikipedia": {
        "url": "https://en.wikipedia.org/wiki/Ohlone_languages",
        "description": "Wikipedia — Ohlone languages (comprehensive overview)",
        "formats": ["markdown"],
    },
    "mutsun_wikipedia": {
        "url": "https://en.wikipedia.org/wiki/Mutsun_language",
        "description": "Wikipedia — Mutsun language (phonology, alphabet)",
        "formats": ["markdown"],
    },
    "chochenyo_wikipedia": {
        "url": "https://en.wikipedia.org/wiki/Chochenyo_language",
        "description": "Wikipedia — Chochenyo language",
        "formats": ["markdown"],
    },
}


ALL_TARGET_GROUPS = {
    "smithsonian": SMITHSONIAN_TARGETS,
    "berkeley": BERKELEY_TARGETS,
    "dictionaries": DICTIONARY_TARGETS,
    "community": COMMUNITY_TARGETS,
    "harrington_db": HARRINGTON_DB_TARGETS,
    "academic": ACADEMIC_TARGETS,
}


def setup_dirs():
    """Create output directories."""
    for d in [OUTPUT_DIR, SCREENSHOTS_DIR, MARKDOWN_DIR, PDF_DIR, RAW_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def scrape_target(app: Firecrawl, name: str, config: dict) -> dict:
    """Scrape a single target URL using Firecrawl."""
    url = config["url"]
    description = config.get("description", "")
    formats = config.get("formats", ["markdown"])
    
    print(f"\n{'='*60}")
    print(f"Scraping: {name}")
    print(f"URL: {url}")
    print(f"Description: {description}")
    print(f"{'='*60}")
    
    scrape_options = {"formats": formats}
    
    # Add PDF parser if specified
    if "parsers" in config:
        scrape_options["parsers"] = config["parsers"]
    
    # Add timeout for large PDFs
    scrape_options["timeout"] = 30000
    
    try:
        result = app.scrape(url, scrape_options)
        
        # Save markdown
        if hasattr(result, 'markdown') and result.markdown:
            md_path = MARKDOWN_DIR / f"{name}.md"
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(f"# {description}\n\n")
                f.write(f"**Source URL:** {url}\n")
                f.write(f"**Scraped:** {datetime.now().isoformat()}\n\n")
                f.write("---\n\n")
                f.write(result.markdown)
            print(f"  ✓ Markdown saved: {md_path} ({len(result.markdown)} chars)")
        
        # Save screenshot if present
        if hasattr(result, 'screenshot') and result.screenshot:
            import base64
            ss_path = SCREENSHOTS_DIR / f"{name}.png"
            with open(ss_path, "wb") as f:
                f.write(base64.b64decode(result.screenshot))
            print(f"  ✓ Screenshot saved: {ss_path}")
        
        # Save links if present
        if hasattr(result, 'links') and result.links:
            links_path = RAW_DIR / f"{name}_links.json"
            with open(links_path, "w") as f:
                json.dump(result.links, f, indent=2)
            print(f"  ✓ Links saved: {links_path} ({len(result.links)} links)")
        
        # Save raw metadata
        meta_path = RAW_DIR / f"{name}_meta.json"
        meta = {
            "name": name,
            "url": url,
            "description": description,
            "scraped_at": datetime.now().isoformat(),
            "success": True,
            "markdown_length": len(result.markdown) if hasattr(result, 'markdown') and result.markdown else 0,
            "has_screenshot": hasattr(result, 'screenshot') and bool(result.screenshot),
            "links_count": len(result.links) if hasattr(result, 'links') and result.links else 0,
        }
        if hasattr(result, 'metadata') and result.metadata:
            meta["page_metadata"] = dict(result.metadata) if not isinstance(result.metadata, dict) else result.metadata
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)
        
        return meta
        
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        error_meta = {
            "name": name,
            "url": url,
            "description": description,
            "scraped_at": datetime.now().isoformat(),
            "success": False,
            "error": str(e),
        }
        error_path = RAW_DIR / f"{name}_error.json"
        with open(error_path, "w") as f:
            json.dump(error_meta, f, indent=2)
        return error_meta


def crawl_smithsonian_surrogates(app: Firecrawl):
    """
    Use Firecrawl's crawl mode to discover and download all digital surrogate
    pages linked from the Harrington Costanoan finding aids.
    
    This attempts to follow links to the actual microfilm page images.
    """
    print("\n" + "="*60)
    print("CRAWLING: Smithsonian digital surrogates for Harrington Costanoan")
    print("="*60)
    
    # Map the Smithsonian SOVA site to find all Costanoan-related URLs
    try:
        map_result = app.map("https://sova.si.edu", {
            "search": "Harrington Costanoan",
            "limit": 100,
        })
        
        if hasattr(map_result, 'links') and map_result.links:
            links_path = RAW_DIR / "smithsonian_costanoan_map.json"
            with open(links_path, "w") as f:
                json.dump(map_result.links, f, indent=2)
            print(f"  ✓ Found {len(map_result.links)} related URLs")
            
            # Filter for microfilm/digital surrogate URLs
            surrogate_urls = [
                link for link in map_result.links
                if any(kw in link.lower() for kw in ["microfilm", "reel", "surrogate", "costanoan", "pdf"])
            ]
            print(f"  ✓ {len(surrogate_urls)} potential microfilm/surrogate URLs")
            
            surrogates_path = RAW_DIR / "smithsonian_surrogate_urls.json"
            with open(surrogates_path, "w") as f:
                json.dump(surrogate_urls, f, indent=2)
                
    except Exception as e:
        print(f"  ✗ Map failed: {e}")
    
    # Also try the Learning Lab which hosts digital surrogates
    try:
        ll_result = app.crawl(
            "https://learninglab.si.edu/resources/view/216584",
            limit=50,
            max_discovery_depth=2,
            scrape_options={
                "formats": ["markdown", "links", {"type": "screenshot", "fullPage": True}]
            }
        )
        
        if ll_result and hasattr(ll_result, 'data'):
            for i, page in enumerate(ll_result.data):
                page_path = MARKDOWN_DIR / f"smithsonian_ll_page_{i}.md"
                if hasattr(page, 'markdown') and page.markdown:
                    with open(page_path, "w", encoding="utf-8") as f:
                        f.write(page.markdown)
            print(f"  ✓ Crawled {len(ll_result.data)} Learning Lab pages")
            
    except Exception as e:
        print(f"  ✗ Learning Lab crawl failed: {e}")


def run_scrape(target_groups: list[str], api_key: str):
    """Run the scraping pipeline for specified target groups."""
    app = Firecrawl(api_key=api_key)
    setup_dirs()
    
    results = []
    total_targets = 0
    
    for group_name in target_groups:
        if group_name not in ALL_TARGET_GROUPS:
            print(f"Unknown target group: {group_name}")
            continue
            
        targets = ALL_TARGET_GROUPS[group_name]
        print(f"\n{'#'*60}")
        print(f"# TARGET GROUP: {group_name.upper()} ({len(targets)} targets)")
        print(f"{'#'*60}")
        
        for name, config in targets.items():
            result = scrape_target(app, name, config)
            results.append(result)
            total_targets += 1
            time.sleep(DELAY_BETWEEN_REQUESTS)
    
    # Special: crawl Smithsonian for digital surrogates
    if "smithsonian" in target_groups:
        crawl_smithsonian_surrogates(app)
    
    # Save summary report
    summary = {
        "run_timestamp": datetime.now().isoformat(),
        "target_groups": target_groups,
        "total_targets": total_targets,
        "successful": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success")),
        "total_markdown_chars": sum(r.get("markdown_length", 0) for r in results),
        "total_links_found": sum(r.get("links_count", 0) for r in results),
        "results": results,
    }
    
    summary_path = OUTPUT_DIR / "scrape_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"  Total targets: {total_targets}")
    print(f"  Successful:    {summary['successful']}")
    print(f"  Failed:        {summary['failed']}")
    print(f"  Total text:    {summary['total_markdown_chars']:,} characters")
    print(f"  Total links:   {summary['total_links_found']:,}")
    print(f"  Summary:       {summary_path}")
    print(f"  Output dir:    {OUTPUT_DIR}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape all known Ohlone language sources using Firecrawl."
    )
    parser.add_argument(
        "--target", "-t",
        choices=["all", "smithsonian", "berkeley", "dictionaries", "community", "harrington_db", "academic"],
        default="all",
        help="Which target group to scrape (default: all)",
    )
    parser.add_argument(
        "--api-key", "-k",
        default=os.environ.get("FIRECRAWL_API_KEY"),
        help="Firecrawl API key (or set FIRECRAWL_API_KEY env var)",
    )
    
    args = parser.parse_args()
    
    if not args.api_key:
        print("ERROR: No Firecrawl API key provided.")
        print("Set FIRECRAWL_API_KEY environment variable or pass --api-key")
        print("Get a key at: https://www.firecrawl.dev/")
        exit(1)
    
    if args.target == "all":
        groups = list(ALL_TARGET_GROUPS.keys())
    else:
        groups = [args.target]
    
    run_scrape(groups, args.api_key)


if __name__ == "__main__":
    main()

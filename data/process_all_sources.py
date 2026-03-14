#!/usr/bin/env python3
"""
process_all_sources.py — Process all Ohlone language data we've already fetched
and consolidate into the master database.

This processes the Mutsun dictionary content we extracted earlier via web_fetch,
plus all other data gathered during the research phase.
"""

import json
import sqlite3
import os
import re
from pathlib import Path

DB_PATH = "/home/claude/ohlone-unicode/data/ohlone_master.db"
JSON_PATH = "/home/claude/ohlone-unicode/data/ohlone_master.json"

def create_database():
    """Create the master Ohlone language database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Dictionary entries table
    c.execute("""CREATE TABLE IF NOT EXISTS dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        english TEXT NOT NULL,
        ipa TEXT,
        pos TEXT,
        variety TEXT NOT NULL,
        source TEXT,
        page_ref TEXT,
        from_lang TEXT,
        sci_name TEXT,
        cultural_info TEXT,
        other_pronunc TEXT,
        notes TEXT,
        example_mutsun TEXT,
        example_english TEXT
    )""")
    
    # Sources table
    c.execute("""CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        url TEXT,
        type TEXT,
        description TEXT,
        access_status TEXT,
        content_length INTEGER,
        scraped_date TEXT
    )""")
    
    # Phonology table (cross-variety)
    c.execute("""CREATE TABLE IF NOT EXISTS phonology (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        ipa TEXT,
        variety TEXT NOT NULL,
        description TEXT,
        type TEXT,
        place TEXT,
        voice TEXT,
        unicode_hex TEXT,
        is_case_phonemic BOOLEAN DEFAULT FALSE,
        is_digraph BOOLEAN DEFAULT FALSE,
        UNIQUE(symbol, variety)
    )""")
    
    # Phrases / sentences table
    c.execute("""CREATE TABLE IF NOT EXISTS phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phrase TEXT NOT NULL,
        english TEXT,
        ipa TEXT,
        variety TEXT NOT NULL,
        source TEXT,
        context TEXT
    )""")
    
    conn.commit()
    return conn


def mutsun_to_ipa(word):
    """Convert Mutsun orthography to IPA."""
    mapping = [
        ("tY", "tʲ"), ("ts", "ts"), ("L", "lʲ"), ("N", "ɲ"), ("S", "ʂ"), ("T", "ʈ"),
        ("c", "tʃ"), ("h", "h"), ("k", "k"), ("l", "l"), ("m", "m"), ("n", "n"),
        ("p", "p"), ("r", "ɾ"), ("s", "s"), ("t", "t"), ("w", "w"), ("y", "j"), ("d", "d"),
        ("ʼ", "ʔ"), ("'", "ʔ"),
        ("aa", "aː"), ("ee", "eː"), ("ii", "iː"), ("oo", "oː"), ("uu", "uː"),
        ("a", "a"), ("e", "e"), ("i", "i"), ("o", "o"), ("u", "u"),
    ]
    result, i = [], 0
    clean = word.lstrip("*-").rstrip("-")
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


def insert_mutsun_dictionary(conn):
    """Insert all Mutsun dictionary entries extracted from the PDF."""
    c = conn.cursor()
    
    # Complete vocabulary extracted from the dictionary PDF we fetched
    # This includes entries from the table of contents showing page ranges,
    # the pronunciation guide, and individual entries visible in the PDF text
    
    entries = [
        # ===== A section (pp. 1-9) =====
        ("aacic", "pipe", "N"), ("aamane", "truly, really, indeed", "Adv"),
        ("akku", "enter", "V"), ("akwaswas", "Akwaswas Tribe, Santa Cruz Indians", "Npersonal"),
        ("ara", "then, and, next", "Adv"), ("arkeh", "oak", "N"),
        ("arikkay", "valley oak tree/acorn", "N"), ("aruh'a", "morning", "N"),
        ("aruuta", "tomorrow", "Adv"), ("asa'a", "truly", "Adv"),
        ("accuSte", "finished, done", "Perf."), ("ahhes", "comb", "N"),
        ("atSa", "be a girl", "V"), ("atSakiSpu", "pretend to be a girl", "V"),
        ("amSi", "so that, in order to", "Conj."),
        
        # ===== C section (pp. 10-17) =====
        ("caahi", "barn owl", "N"), ("cipituk", "mallard duck", "N"),
        ("cit", "shout during gambling game", "Excl."), ("corko", "dry up", "V"),
        ("corkoSte", "dry", "Perf."), ("cunyu", "sing", "V"),
        ("ceeyes", "jackrabbit", "Nrevers"), ("ceyse", "hunt jackrabbits", "Vrevers"),
        
        # ===== D section (p. 18) =====
        ("diyos", "God", "N"),
        
        # ===== E section (pp. 18-22) =====
        ("eccer", "iron", "N"), ("ekwe", "not", "Adv"),
        ("emhe", "softly, quietly", "Adv"), ("enenum", "secretly", "Adv"),
        ("enne", "write, draw", "V"), ("ennes", "pen", "N"),
        ("ec", "shout from gambling game", "Excl."),
        
        # ===== H section (pp. 23-57) — LARGEST =====
        ("haahe", "run away", "V"), ("haayi", "come here!", "Command"),
        ("hassen", "get/be angry", "V"), ("hatte", "who; anyone, someone", "Q"),
        ("hatlu", "make cornmeal or acorn mush", "V"),
        ("heLekpu", "be happy", "V"), ("helwe", "strip the bark off", "V"),
        ("hemec'a", "one", "Num"), ("heSSem'a", "quickly", "Adv"),
        ("hiimi", "always", "Adv"), ("himah'a", "all, every", "Quant"),
        ("hinne", "walk", "V"), ("hinse", "wander", "V"),
        ("hiSSen", "work", "V"), ("hohe", "be late", "V"),
        ("huTel", "earring", "Nrevers"), ("huTle", "put on earrings", "Vrevers"),
        ("huusu", "eel", "N"), ("huyhuy", "cutgrass, bunchgrass", "N"),
        ("hulyaana", "Juliana", "Npersonal"),
        
        # ===== I section (pp. 58-63) =====
        ("icci", "bite", "V"), ("ice", "It's nothing!", "Excl."),
        ("inhan", "get/become sick", "V"), ("inhaSte", "sick", "Perf."),
        ("inahpu", "get sick oneself", "V"),
        ("inna", "fall", "V"), ("innaSte", "fallen", "Perf."),
        ("issu", "hand", "N"),
        
        # ===== K section (pp. 64-78) =====
        ("kaa", "daughter", "N"), ("kaayi", "ache, hurt, be spicy", "V"),
        ("kaamer", "dwarf sunflower", "Nrevers"), ("kamre", "gather dwarf sunflowers", "Vrevers"),
        ("kaatYul", "calf of the leg", "Nrevers"), ("katYlu", "be thick-legged", "Vrevers"),
        ("kaphan", "three", "Num"), ("kawra", "end", "V"),
        ("kawraSte", "ended", "Perf."), ("ke", "what?; yes?; Look! Listen!", "Q"),
        ("kicca", "lock", "V"), ("kicwa", "unlock", "V"),
        ("komme", "get tired", "V"), ("kommeSte", "tired", "Perf."),
        
        # ===== L section (pp. 79-86) =====
        ("laake", "rise", "V"), ("laalak", "goose", "N"),
        ("lalla", "knock over", "V"), ("lallawi", "knock outward", "V"),
        
        # ===== L (palatal) section (p. 87) =====
        ("Luohu", "yearling calf", "N"),
        
        # ===== M section (pp. 87-104) =====
        ("maahi", "close, cover", "V"), ("maayi", "laugh", "V"),
        ("moT", "question word", "Q"), ("mukurma", "woman", "N"),
        ("muuruS", "toothache", "N"),
        
        # ===== N section (pp. 105-109) =====
        ("naaru", "turnip", "N"), ("nenne", "miss (a person)", "V"),
        ("neppe", "this", "Pro"), ("nepkam", "these", "Pro"),
        ("nessepu", "ask permission", "V"),
        
        # ===== N (palatal) section (p. 110) =====
        ("Notko", "be short", "V"),
        
        # ===== O section (pp. 111-113) =====
        ("oce", "send", "V"), ("onespu", "fondle, caress, hold", "V"),
        ("ooso", "wake up", "V"), ("opanniS", "act of grinding acorns", "N"),
        
        # ===== P section (pp. 114-129) =====
        ("paaka", "shell", "V"), ("paTTi", "hold, catch, grasp", "V"),
        ("pelohte", "bald", "Perf."), ("pesyon", "thought", "N"),
        ("pire", "world, earth, land, ground, atmosphere", "N"),
        ("por", "flea", "N"), ("porpor", "Fremont cottonwood", "N"),
        ("pulmu", "make bread", "V"),
        
        # ===== R section (pp. 130-139) =====
        ("raakat", "name", "N"), ("rammay", "inside", "Adv"),
        ("ricca", "talk, speak", "V"), ("rini", "above", "Adv"),
        ("rorSo", "play", "V"),
        
        # ===== S section (pp. 140-154) =====
        ("saake", "gather pinenuts", "V"), ("santiya", "watermelon", "N"),
        ("sii", "water", "N"),
        
        # ===== S (retroflex) section (pp. 155-158) =====
        ("Saanay", "near, nearby", "Adv"), ("SaSran", "raccoon", "N"),
        ("Sokwe", "wow", "Excl."),
        
        # ===== T section (pp. 159-176) =====
        ("taa", "older sister", "N"), ("taacin", "kangaroo rat, river rat", "N"),
        ("tacci", "catch river/kangaroo rats", "V"),
        ("taprey", "above", "Adv"), ("tare", "kiddo, buddy", "N"),
        ("tawah", "work, employment", "N"), ("timren", "get a headache", "V"),
        
        # ===== T (retroflex) section (pp. 177-184) =====
        ("Taakampi", "bring, carry something", "V"),
        ("Taywe", "make acorn soup", "V"), ("TiiTin", "get well/better, recover", "V"),
        
        # ===== TS section (p. 185) =====
        ("tsayla", "lie face up", "V"),
        
        # ===== TY section (p. 186) =====
        ("tYottYoni", "holly berry", "N"), ("tYuuken", "jump", "V"),
        
        # ===== U section (pp. 186-191) =====
        ("ucirmin", "small needle", "N"), ("uuni", "answer", "V"),
        
        # ===== W section (pp. 192-203) =====
        ("waaha", "scratch, sing slowly", "V"), ("waate", "come", "V"),
        ("wacosta", "Carmel River", "Nplace"), ("wacruntak", "Castroville", "Nplace"),
        ("wak", "he/she/it", "Pro"),
        
        # ===== Y section (pp. 204-210) =====
        ("yaase", "eat", "V"), ("yasri", "be enough", "V"),
        ("yeeho", "be aged", "V"), ("yuksi", "gather acorns", "V"),
        ("yuukis", "acorn", "N"), ("yuu", "and", "Conj."),
        
        # ===== GRAMMATICAL MORPHEMES =====
        ("-Ste", "perfective suffix (completed action)", "Suff."),
        ("-hte", "perfective (variant)", "Suff."),
        ("-pu", "reflexive/middle voice", "Suff."),
        ("-mu", "variant of -pu", "Suff."),
        ("-mpi", "causative", "Suff."),
        ("-n", "intransitive suffix", "Suff."),
        ("-ni", "intransitive (before other suffixes)", "Suff."),
        ("-s", "instrument noun suffix", "Suff."),
        ("-kiSpu", "act like, pretend to", "Suff."),
        ("-yuT", "plural command", "Suff."),
        ("-ka", "I (tack-on pronoun)", "Pro"),
        ("-me", "you (tack-on pronoun)", "Pro"),
        ("-k", "he/she/it (tack-on pronoun)", "Pro"),
        ("kan-", "my (possessive prefix)", "Pro"),
    ]
    
    for word, english, pos in entries:
        ipa = mutsun_to_ipa(word)
        c.execute("""INSERT OR IGNORE INTO dictionary 
            (word, english, ipa, pos, variety, source)
            VALUES (?, ?, ?, ?, 'Mutsun', 'Warner, Butler & Geary 2016')""",
            (word, english, ipa, pos))
    
    conn.commit()
    print(f"  Inserted {len(entries)} Mutsun dictionary entries")


def insert_ocen_vocabulary(conn):
    """Insert OCEN Rumsen vocabulary from their website."""
    c = conn.cursor()
    
    entries = [
        # Greetings
        ("Saleki Asatsa", "Good Morning", "phrase"),
        ("Saleki Itsa", "Good Afternoon", "phrase"),
        ("Saleki Itsu", "Good Evening", "phrase"),
        ("Saleki Atsa", "Good Day", "phrase"),
        ("Saleki Tomanis", "Good Night", "phrase"),
        # Pronouns
        ("eni", "I", "Pro"), ("name", "you", "Pro"),
        ("let", "we", "Pro"), ("lechi", "us", "Pro"),
        ("lex", "our", "Pro"), ("nemmex", "your", "Pro"),
        ("lawis", "they", "Pro"), ("lax", "their", "Pro"),
        ("lachi", "them", "Pro"), ("huniki", "him/her", "Pro"),
        ("a'lam", "he/she/it", "Pro"),
        # Demonstratives
        ("akala", "that one", "Pro"), ("ahik", "that", "Pro"),
        ("aniki", "this", "Pro"), ("aneme", "those (far)", "Pro"),
        ("aniwa", "those (near)", "Pro"), ("iniwa", "these", "Pro"),
        ("nish", "my", "Pro"),
        # Basic words
        ("ike", "yes", "Adv"), ("ana", "no", "Adv"),
        ("cha'a", "exist/live", "V"), ("iwa", "house", "N"),
        # Family
        ("exe", "male/man", "N"), ("tanoch", "woman (adult female)", "N"),
        ("noch", "adult", "N"), ("exepana", "boy (male child)", "N"),
        ("pana", "child", "N"), ("panna", "children", "N"),
        ("Atsia", "mother", "N"), ("aha'ya", "father", "N"),
        ("sholeta", "daughter/girl", "N"),
        ("hepna", "younger brother", "N"), ("mi'its", "older brother", "N"),
        ("iwis", "brother-in-law", "N"), ("imis", "sister-in-law", "N"),
        ("tapna", "younger sister", "N"), ("ichi", "sister", "N"),
        ("Mechix", "aunt", "N"), ("tsa'a", "uncle", "N"),
        ("Iapa", "grandmother", "N"), ("Metx", "grandfather", "N"),
        ("Ewshai", "ancestors", "N"),
    ]
    
    for word, english, pos in entries:
        c.execute("""INSERT OR IGNORE INTO dictionary 
            (word, english, ipa, pos, variety, source)
            VALUES (?, ?, ?, ?, 'OCEN Rumsen', 'OCEN Official Website / David L. Shaul')""",
            (word, english, "", pos))
    
    # Also insert phrases
    phrases = [
        ("Saleki Asatsa", "Good Morning", "OCEN Rumsen"),
        ("Saleki Itsa", "Good Afternoon", "OCEN Rumsen"),
        ("Saleki Itsu", "Good Evening", "OCEN Rumsen"),
        ("Saleki Atsa", "Good Day", "OCEN Rumsen"),
        ("Saleki Tomanis", "Good Night", "OCEN Rumsen"),
        ("Lex Welel", "Our Language", "OCEN Rumsen"),
    ]
    for phrase, english, variety in phrases:
        c.execute("""INSERT OR IGNORE INTO phrases (phrase, english, variety, source)
            VALUES (?, ?, ?, 'OCEN Official Website')""", (phrase, english, variety))
    
    conn.commit()
    print(f"  Inserted {len(entries)} OCEN Rumsen entries + {len(phrases)} phrases")


def insert_chochenyo_vocabulary(conn):
    """Insert Chochenyo vocabulary from various public sources."""
    c = conn.cursor()
    
    entries = [
        # From Muwekma Ohlone Tribe / SCU glossary / public materials
        ("makkin", "we (inclusive)", "Pro"),
        ("mak", "we/our", "Pro"),
        ("muwekma", "the people", "N"),
        ("wolwoolum", "language, speech", "N"),
        ("noono", "language", "N"),
        ("xučyun", "Berkeley shoreline area (Huchiun)", "Nplace"),
        ("Tújŝtak", "Mount Diablo ('little hill')", "Nplace"),
        ("saleki", "good", "Adv"),
        ("suyykma", "family", "N"),
        ("siiniinikma", "children", "N"),
        ("hussistak", "future", "N"),
        ("hoise", "beautiful", "Adv"),
        ("non", "speak/talk", "V"),
        ("wente", "in/with", "Adv"),
        ("tiirinikma", "awakens", "V"),
    ]
    
    for word, english, pos in entries:
        c.execute("""INSERT OR IGNORE INTO dictionary 
            (word, english, ipa, pos, variety, source)
            VALUES (?, ?, ?, ?, 'Chochenyo', 'Muwekma Ohlone Tribe / SCU / public materials')""",
            (word, english, "", pos))
    
    phrases = [
        ("Makkin Mak Muwekma Wolwoolum", "We are Muwekma Ohlone (we speak our language)", "Chochenyo"),
        ("Makkin Mak Non wente Mak Hoise Muwekma Noono", "We speak in our beautiful Muwekma language", "Chochenyo"),
        ("Mak suyykma", "Our Family", "Chochenyo"),
        ("Mak siiniinikma, mak hussistak", "Our children, our future", "Chochenyo"),
        ("Mak Noono Tiirinikma", "Our language awakens", "Chochenyo"),
    ]
    for phrase, english, variety in phrases:
        c.execute("""INSERT OR IGNORE INTO phrases (phrase, english, variety, source)
            VALUES (?, ?, ?, 'Muwekma Ohlone Tribe')""", (phrase, english, variety))
    
    conn.commit()
    print(f"  Inserted {len(entries)} Chochenyo entries + {len(phrases)} phrases")


def insert_phonology(conn):
    """Insert cross-variety phonology data."""
    c = conn.cursor()
    
    # Mutsun phonology (complete from dictionary)
    mutsun_phon = [
        ("a", "a", "vowel", "Open front unrounded, as in 'father'", "", "", "U+0061", False, False),
        ("e", "e", "vowel", "Close-mid front unrounded, as in 'met'", "", "", "U+0065", False, False),
        ("i", "i", "vowel", "Close front unrounded, as in 'machine'", "", "", "U+0069", False, False),
        ("o", "o", "vowel", "Close-mid back rounded, as in 'wrote'", "", "", "U+006F", False, False),
        ("u", "u", "vowel", "Close back rounded, as in 'rule'", "", "", "U+0075", False, False),
        ("c", "tʃ", "affricate", "Like English 'ch' in 'chip'", "postalveolar", "voiceless", "U+0063", False, False),
        ("h", "h", "fricative", "Like English 'h'", "glottal", "voiceless", "U+0068", False, False),
        ("k", "k", "stop", "Like English 'k'", "velar", "voiceless", "U+006B", False, False),
        ("l", "l", "lateral", "Like English 'l'", "alveolar", "voiced", "U+006C", False, False),
        ("L", "lʲ", "lateral", "Like 'l'+'y' as in 'tell you'", "palatal", "voiced", "U+004C", True, False),
        ("m", "m", "nasal", "Like English 'm'", "bilabial", "voiced", "U+006D", False, False),
        ("n", "n", "nasal", "Like English 'n'", "alveolar", "voiced", "U+006E", False, False),
        ("N", "ɲ", "nasal", "Like Spanish 'ñ'", "palatal", "voiced", "U+004E", True, False),
        ("p", "p", "stop", "Like English 'p'", "bilabial", "voiceless", "U+0070", False, False),
        ("r", "ɾ", "tap", "Single tap like Spanish 'r'", "alveolar", "voiced", "U+0072", False, False),
        ("s", "s", "fricative", "Like English 's'", "alveolar", "voiceless", "U+0073", False, False),
        ("S", "ʂ", "fricative", "Like English 'sh' (retroflex)", "retroflex", "voiceless", "U+0053", True, False),
        ("t", "t", "stop", "Like English 't'", "alveolar", "voiceless", "U+0074", False, False),
        ("T", "ʈ", "stop", "Retroflex 't' — curl tongue back", "retroflex", "voiceless", "U+0054", True, False),
        ("ts", "ts", "affricate", "Like 'ts' in 'cats'", "alveolar", "voiceless", "U+0074+U+0073", False, True),
        ("tY", "tʲ", "stop", "Like British 'Tuesday'", "palatal", "voiceless", "U+0074+U+0059", False, True),
        ("w", "w", "approximant", "Like English 'w'", "labiovelar", "voiced", "U+0077", False, False),
        ("y", "j", "approximant", "Like English 'y' in 'yell'", "palatal", "voiced", "U+0079", False, False),
        ("ʼ", "ʔ", "stop", "Glottal stop — gap in 'uh-oh'", "glottal", "voiceless", "U+02BC", False, False),
    ]
    
    for sym, ipa, typ, desc, place, voice, uni, case_p, digraph in mutsun_phon:
        c.execute("""INSERT OR IGNORE INTO phonology 
            (symbol, ipa, variety, description, type, place, voice, unicode_hex, is_case_phonemic, is_digraph)
            VALUES (?, ?, 'Mutsun', ?, ?, ?, ?, ?, ?, ?)""",
            (sym, ipa, desc, typ, place, voice, uni, case_p, digraph))
    
    # Rumsen special characters
    rumsen_phon = [
        ("č", "tʃ", "affricate", "Voiceless postalveolar affricate", "postalveolar", "voiceless", "U+010D", False, False),
        ("ş", "ʃ", "fricative", "Voiceless postalveolar fricative", "postalveolar", "voiceless", "U+015F", False, False),
        ("ŝ", "ʃ", "fricative", "Alternative postalveolar fricative", "postalveolar", "voiceless", "U+015D", False, False),
        ("ţ", "ts", "affricate", "Voiceless alveolar affricate", "alveolar", "voiceless", "U+0163", False, False),
        ("x", "x", "fricative", "Voiceless velar fricative", "velar", "voiceless", "U+0078", False, False),
    ]
    for sym, ipa, typ, desc, place, voice, uni, case_p, digraph in rumsen_phon:
        c.execute("""INSERT OR IGNORE INTO phonology 
            (symbol, ipa, variety, description, type, place, voice, unicode_hex, is_case_phonemic, is_digraph)
            VALUES (?, ?, 'Rumsen', ?, ?, ?, ?, ?, ?, ?)""",
            (sym, ipa, desc, typ, place, voice, uni, case_p, digraph))
    
    conn.commit()
    print(f"  Inserted {len(mutsun_phon)} Mutsun + {len(rumsen_phon)} Rumsen phonology entries")


def insert_sources(conn):
    """Insert all known source metadata."""
    c = conn.cursor()
    
    sources = [
        ("Mutsun-English Dictionary", "https://scholarspace.manoa.hawaii.edu/handle/10125/24679", "dictionary", "677-page dictionary, ~4000 entries. CC BY-NC 4.0", "freely available", 0),
        ("Mutsun Grammar (Okrand 1977)", "https://escholarship.org/uc/item/1p59z6kq", "grammar", "Only complete grammar of any Ohlone language", "freely available", 0),
        ("Arroyo de la Cuesta (1862)", "https://archive.org/details/vocabularyorphra00arro", "vocabulary", "3000 Mutsun sentences, Spanish translations. Public domain", "freely available", 0),
        ("Arroyo de la Cuesta (1861)", "https://books.google.com/books?id=Z99EAAAAcAAJ", "grammar", "Mutsun grammar in Spanish. Public domain", "freely available", 0),
        ("Harrington Costanoan Papers (Smithsonian)", "https://sova.si.edu", "field_notes", "80 reels microfilm. Chochenyo, Mutsun, Rumsen. Digitized", "online with restrictions", 0),
        ("UC Berkeley CLA", "https://cla.berkeley.edu/", "archive", "California Language Archive — Ohlone materials catalog", "online catalog; physical visit for materials", 0),
        ("OCEN Language Page", "https://ohlonecostanoanesselennation.org/Language.html", "vocabulary", "Rumsen vocabulary and pronunciation guide", "freely available", 0),
        ("Muwekma Ohlone Language", "https://www.muwekma.org/language-revitalization.html", "community", "Chochenyo revitalization program", "freely available", 0),
        ("Amah Mutsun Language", "https://amahmutsun.org/language", "community", "Mutsun language classes and resources", "freely available", 0),
        ("Sogorea Te' / Mak Noono Tiirinikma", "https://sogoreate-landtrust.org/mak-noono-tiirinikma/", "community", "Chochenyo language awakening program", "freely available", 0),
        ("SCU Mutsun Collection", "https://scholarcommons.scu.edu/mutsun/3/", "dictionary", "Mutsun dictionary hosted by Santa Clara University", "freely available", 0),
        ("SCU Ohlone Glossary", "https://www.scu.edu/community-heritage-lab/ohlone-heritage-hub/glossary/", "glossary", "Chochenyo glossary terms", "freely available", 0),
        ("UC Davis Harrington Database", "https://nalc.ucdavis.edu/project/jp-harrington-database-project", "database", "Partial transcriptions of Harrington notes", "online", 0),
        ("Kroeber 1902 Rumsen Songs", "cla.berkeley.edu catalog 24-517 to 24-520", "audio", "María Viviena Soto songs", "UC Berkeley Hearst Museum", 0),
        ("Harrington Wax Cylinders", "Smithsonian NAA / Library of Congress", "audio", "26 Costanoan cylinders at Library of Congress", "institutional access", 0),
    ]
    
    for name, url, typ, desc, status, length in sources:
        c.execute("""INSERT OR IGNORE INTO sources (name, url, type, description, access_status, content_length, scraped_date)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))""",
            (name, url, typ, desc, status, length))
    
    conn.commit()
    print(f"  Inserted {len(sources)} source records")


def export_json(conn):
    """Export entire database to JSON."""
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    data = {
        "metadata": {
            "title": "Ohlone Language Master Database",
            "description": "Consolidated database of all Ohlone language varieties",
            "varieties": ["Mutsun", "Chochenyo", "Rumsen (OCEN)", "Rumsen (academic)", "Ramaytush", "Tamyen", "Awaswas", "Chalon", "Karkin"],
            "generated": "2026-03-08",
            "license": "Database code: MIT. Dictionary content: CC BY-NC 4.0 (Warner et al.). Community content: respect tribal sovereignty.",
        },
        "statistics": {},
        "dictionary": [],
        "phrases": [],
        "phonology": [],
        "sources": [],
    }
    
    c.execute("SELECT * FROM dictionary ORDER BY variety, word")
    data["dictionary"] = [dict(r) for r in c.fetchall()]
    
    c.execute("SELECT * FROM phrases ORDER BY variety, phrase")
    data["phrases"] = [dict(r) for r in c.fetchall()]
    
    c.execute("SELECT * FROM phonology ORDER BY variety, symbol")
    data["phonology"] = [dict(r) for r in c.fetchall()]
    
    c.execute("SELECT * FROM sources ORDER BY name")
    data["sources"] = [dict(r) for r in c.fetchall()]
    
    # Stats
    c.execute("SELECT variety, COUNT(*) FROM dictionary GROUP BY variety")
    data["statistics"]["entries_by_variety"] = {r[0]: r[1] for r in c.fetchall()}
    c.execute("SELECT COUNT(*) FROM dictionary")
    data["statistics"]["total_entries"] = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM phrases")
    data["statistics"]["total_phrases"] = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM sources")
    data["statistics"]["total_sources"] = c.fetchone()[0]
    
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nJSON exported: {JSON_PATH}")
    print(f"  Dictionary entries: {data['statistics']['total_entries']}")
    print(f"  Phrases: {data['statistics']['total_phrases']}")
    print(f"  Sources: {data['statistics']['total_sources']}")
    print(f"  By variety: {data['statistics']['entries_by_variety']}")


def main():
    print("="*60)
    print("BUILDING OHLONE MASTER DATABASE")
    print("="*60)
    
    conn = create_database()
    
    print("\n1. Inserting Mutsun dictionary entries...")
    insert_mutsun_dictionary(conn)
    
    print("\n2. Inserting OCEN Rumsen vocabulary...")
    insert_ocen_vocabulary(conn)
    
    print("\n3. Inserting Chochenyo vocabulary...")
    insert_chochenyo_vocabulary(conn)
    
    print("\n4. Inserting phonology data...")
    insert_phonology(conn)
    
    print("\n5. Inserting source metadata...")
    insert_sources(conn)
    
    print("\n6. Exporting to JSON...")
    export_json(conn)
    
    conn.close()
    print(f"\nDatabase saved: {DB_PATH}")
    print("DONE.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
- Scans ./input for PDFs

- For each date with >= 
    * Computes word-level diffs (add/remove/replace)
    * Reports numeric changes (e.g., page numbers, ages, dates
    ./output/date_diffs/index.html
    ./output/date_diffs/changes
Usage:
"""

import csv
import has
import json
import re
from collections import defaultdict


INPUT_DIR = Path("input")
CAC
OUTPUT_DIR.mkdir(parents=True, exi

    r"\b(0?[1-9
    r"\b(J
    r"\b(20\d{2}|19\d
FILENAME_DATE_
    r"\b(0?
    r"\b(20

def sha25
    with p
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

# --- Config defaults ---
INPUT_DIR = Path("input")
OUTPUT_DIR = Path("output/date_diffs")
CACHE_DIR = Path("cache/text")
CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DATE_PATTERNS = [
    # MM/DD/YYYY or M/D/YYYY
    r"\b(0?[1-9]|1[0-2])[/\-](0?[1-9]|[12][0-9]|3[01])[/\-](20\d{2}|19\d{2})\b",
    # Month DD, YYYY
    r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([12]?\d|3[01]),\s*(20\d{2}|19\d{2})\b",
    # YYYY-MM-DD
    r"\b(20\d{2}|19\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b",
]
FILENAME_DATE_PATTERNS = [
    # 12.10.20 or 1.5.2016
    r"\b(0?[1-9]|1[0-2])[.\-](0?[1-9]|[12]\d|3[01])[.\-]((?:20)?\d{2})\b",
    # 2020-02-26
    r"\b(20\d{2}|19\d{2})[-_](0?[1-9]|1[0-2])[-_](0?[1-9]|[12]\d|3[01])\b",
]

# --- Utilities ---
def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
    cache_path.write_text(t
    return h.hexdigest()[:16]

def safe_read_pdf(path: Path) -> str:
    """Extract text with pdfplumber; cache .txt by hash to speed re-runs."""
    try:
        import pdfplumber  # type: ignore
    except ImportError as e:
        print("ERROR: pdfplumber is required. pip install pdfplumber", file=sys.stderr)
        raise

    key = f"{path.stem}.{sha256(path)}.txt"
    cache_path = CACHE_DIR / key
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8", errors="ignore")

    if pattern == F
    try:
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                # Extract words->text to keep reasonable spacing
                txt = page.extract_text(x_tolerance=2, y_tolerance=2) or ""
                text_parts.append(txt)
    except Exception as e:
        print(f"Warning: Could not extract text from {path}: {e}", file=sys.stderr)
        return ""
    
    text = "\n".join(text_parts)
                pass
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
                return to_iso_from_filename(m, pat)
    return text

def to_iso_date(mo: re.Match, pattern_idx: int) -> str:
    """Return ISO YYYY-MM-DD from regex match groups depending on pattern."""
    if pattern_idx == 0:
        # MM/DD/YYYY
        m, d, y = mo.group(1), mo.group(2), mo.group(3)
        return dt.date(int(y), int(m), int(d)).isoformat()
    if pattern_idx == 1:
    try:
        month_name, d, y = mo.group(1), mo.group(2), mo.group(3)
        info = reader
            "January":1,"February":2,"March":3,"April":4,"May":5,"June":6,
            "July":7,"August":8,"September":9,"October":10,"November":11,"December":12
        }[month_name]

    if pattern_idx == 2:
        # YYYY-MM-DD
    mtime: float
        return dt.date(int(y), int(m), int(d)).isoformat()
    raise ValueError("Unknown pattern index")

def to_iso_from_filename(mo: re.Match, pattern: str) -> str:
    if pattern == FILENAME_DATE_PATTERNS[0]:
        m, d, y = mo.group(1), mo.group(2), mo.group(3)
        if len(y) == 2:  # assume 20yy
            y = "20" + y
        return dt.date(int(y), int(m), int(d)).isoformat()
    if pattern == FILENAME_DATE_PATTERNS[1]:
        y, m, d = mo.group(1), mo.group(2), mo.group(3)
        return dt.date(int(y), int(m), int(d)).isoformat()
    ap = argparse.ArgumentParser()

    ap.add_argument("--pairwise", action="store_true",
    args = ap.parse_arg
    names = [n.strip() for n in args.names.sp
    out_dir = Path(args.out)

    if not pdfs:
        return
    docs: List[Doc] = []
        try:
        except Excepti
            continue
        d = extract_date(text, p.nam

    unknowns: Li
        if d.date:
        else:

    csv_rows: List[Dict[str, str | int]] = []

    index_body = [f"<h1>Date-based Diff Index</h1>",

        index_body.append("<p><strong>No documents with detected dates f

    duplicate_groups = 0
        if len(ds) < 2:
        
        ds_sort

        index_body.append(f"<h2>{date} <span cla
        

        if args.pairwise:
                for j in range
        else:
            for j in range(1, len(ds_sorted))

            
            dif

            b_counts = name_counts(b.
            for n in names:
                db = b_counts.get(n, 0)

          
          
            b_
            #
            nums_b =
            remo

            pair_path = date_dir / pair_name
            body.append(f"<h1>D
            body.ap
            body.append(f"<div class='kv'><b>Tokens Added
            body.append(f"<div class='kv'><b>N
            body.


                body.append("
                body.append("<div class='kv'><b>A</b><pre>" + html.escape("\n\
             
            body.append("<h2>Inline 


            csv_rows.append({
                "doc_a": str(a.path),
                "tokens_added": adds,
                "name_counts_a":
               


        if pairs:

    # Summary stats
       
    # Unknowns list
        index_body.append("<h2>Docs with Unknow
       

    csv_path = out_dir / "changes_summary.csv"
        with
                "da
            ])
            writer.writer
    else:

    write_file(out_dir / "index.html", make

    main()


























































































































































































































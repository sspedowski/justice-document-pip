#!/usr/bin/env python3
"""
Compare documents that share the same date and show EXACT wording changes.

- Scans ./input for PDFs
- Extracts text via pdfplumber (no OCR; add OCR upstream if needed)
- Detects doc date from text, then filename, then PDF metadata
- Groups docs by ISO date (YYYY-MM-DD)
- For each date with >= 2 docs:
    * Picks a baseline (earliest mtime) and compares pairwise or baseline->others
    * Computes word-level diffs (add/remove/replace)
    * Counts and highlights mentions for target names
    * Reports numeric changes (e.g., page numbers, ages, dates, counts)
- Outputs:
    ./output/date_diffs/index.html
    ./output/date_diffs/<date>/diff_*.html
    ./output/date_diffs/changes_summary.csv

Usage:
  python scripts/compare_by_date.py --names "Noel,Andy Maki,Banister,Russell,Verde"
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
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
            h.update(chunk)
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

    text_parts = []
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
    # Normalize whitespace
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    cache_path.write_text(text, encoding="utf-8", errors="ignore")
    return text

def to_iso_date(mo: re.Match, pattern_idx: int) -> str:
    """Return ISO YYYY-MM-DD from regex match groups depending on pattern."""
    if pattern_idx == 0:
        # MM/DD/YYYY
        m, d, y = mo.group(1), mo.group(2), mo.group(3)
        return dt.date(int(y), int(m), int(d)).isoformat()
    if pattern_idx == 1:
        # Month DD, YYYY
        month_name, d, y = mo.group(1), mo.group(2), mo.group(3)
        month_num = {
            "January":1,"February":2,"March":3,"April":4,"May":5,"June":6,
            "July":7,"August":8,"September":9,"October":10,"November":11,"December":12
        }[month_name]
        return dt.date(int(y), month_num, int(d)).isoformat()
    if pattern_idx == 2:
        # YYYY-MM-DD
        y, m, d = mo.group(1), mo.group(2), mo.group(3)
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
    raise ValueError("Unknown filename pattern")

def extract_date(text: str, filename: str, pdf_meta_date: str | None) -> str | None:
    # 1) from body text
    for idx, pat in enumerate(DATE_PATTERNS):
        m = re.search(pat, text)
        if m:
            try:
                return to_iso_date(m, idx)
            except Exception:
                pass
    # 2) from filename
    for pat in FILENAME_DATE_PATTERNS:
        m = re.search(pat, filename)
        if m:
            try:
                return to_iso_from_filename(m, pat)
            except Exception:
                pass
    # 3) from metadata: CreationDate like D:20200226...
    if pdf_meta_date:
        m = re.search(r"(\d{4})(\d{2})(\d{2})", pdf_meta_date)
        if m:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
            try:
                return dt.date(y, mo, d).isoformat()
            except Exception:
                pass
    return None

def pdf_creation_date(path: Path) -> str | None:
    try:
        from PyPDF2 import PdfReader  # type: ignore
        reader = PdfReader(str(path))
        info = reader.metadata
        if info and "/CreationDate" in info:
            return str(info["/CreationDate"])
    except Exception:
        pass
    return None

def tokenize(text: str) -> List[str]:
    # Tokenize into words but keep punctuation as separate tokens for useful diffs
    return re.findall(r"\w+|[^\w\s]", text, flags=re.UNICODE)

@dataclass
class Doc:
    path: Path
    text: str
    date: str | None
    mtime: float

def name_counts(text: str, names: List[str]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for n in names:
        pattern = re.compile(re.escape(n), re.IGNORECASE)
        counts[n] = len(pattern.findall(text))
    return counts

def extract_lines_with_names(text: str, names: List[str]) -> List[str]:
    lines = text.splitlines()
    name_re = re.compile("|".join(re.escape(n) for n in names), re.IGNORECASE)
    hits = []
    for i, line in enumerate(lines):
        if name_re.search(line):
            # include a bit of context
            pre = lines[i-1] if i-1 >= 0 else ""
            nxt = lines[i+1] if i+1 < len(lines) else ""
            snippet = "\n".join([pre, line, nxt]).strip()
            hits.append(snippet)
    return hits

def numbers_in(text: str) -> List[str]:
    return re.findall(r"\b\d+(?:\.\d+)?\b", text)

def inline_diff_html(a_tokens: List[str], b_tokens: List[str]) -> Tuple[str, int, int]:
    """
    Render inline diff as HTML with <span class='add'> and <span class='del'>.
    Returns (html, added_count, removed_count).
    """
    from difflib import SequenceMatcher
    sm = SequenceMatcher(a=a_tokens, b=b_tokens)
    out = []
    adds = rems = 0
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op == "equal":
            out.append(html.escape("".join(a_tokens[a0:a1])))
        elif op == "insert":
            frag = "".join(b_tokens[b0:b1])
            out.append(f"<span class='add'>{html.escape(frag)}</span>")
            adds += len(b_tokens[b0:b1])
        elif op == "delete":
            frag = "".join(a_tokens[a0:a1])
            out.append(f"<span class='del'>{html.escape(frag)}</span>")
            rems += len(a_tokens[a0:a1])
        elif op == "replace":
            del_frag = "".join(a_tokens[a0:a1])
            add_frag = "".join(b_tokens[b0:b1])
            out.append(f"<span class='del'>{html.escape(del_frag)}</span><span class='add'>{html.escape(add_frag)}</span>")
            adds += len(b_tokens[b0:b1])
            rems += len(a_tokens[a0:a1])
    return "".join(out), adds, rems

def make_html_page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>
body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;line-height:1.4}}
h1,h2,h3{{margin:0 0 12px}}
code,pre{{background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:8px;white-space:pre-wrap}}
.summary{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}}
.kv{{background:#fafafa;border:1px solid #eee;padding:8px 10px;border-radius:8px}}
.add{{background:#e6ffed;border:1px solid #b7ebc6;border-radius:3px;padding:0 2px;margin:0 1px}}
.del{{background:#ffebe9;border:1px solid #ffcecb;border-radius:3px;padding:0 2px;margin:0 1px;text-decoration:line-through}}
small.mono{{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}}
a{{text-decoration:none;color:#0969da}}
table{{border-collapse:collapse;width:100%}}
td,th{{border-top:1px solid #eee;padding:6px 8px;text-align:left;vertical-align:top}}
.badge{{display:inline-block;background:#eef;border-radius:999px;padding:2px 8px;margin-left:6px;font-size:12px}}
</style></head><body>
{body}
</body></html>"""

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", errors="ignore")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default=str(INPUT_DIR))
    ap.add_argument("--out", default=str(OUTPUT_DIR))
    ap.add_argument("--names", default="Noel,Andy Maki,Banister,Russell,Verde")
    ap.add_argument("--pairwise", action="store_true",
                    help="Compare every pair; default compares baseline->others")
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",") if n.strip()]
    in_dir = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(in_dir.glob("**/*.pdf"))
    if not pdfs:
        print(f"No PDF files found in {in_dir}", file=sys.stderr)
        return

    docs: List[Doc] = []
    for p in pdfs:
        try:
            text = safe_read_pdf(p)
        except Exception as e:
            print(f"[warn] could not read {p}: {e}", file=sys.stderr)
            continue
        meta_date = pdf_creation_date(p)
        d = extract_date(text, p.name, meta_date)
        docs.append(Doc(path=p, text=text, date=d, mtime=p.stat().st_mtime))

    groups: Dict[str, List[Doc]] = defaultdict(list)
    unknowns: List[Doc] = []
    for d in docs:
        if d.date:
            groups[d.date].append(d)
        else:
            unknowns.append(d)

    # CSV summary header
    csv_rows: List[Dict[str, str | int]] = []
    index_items: List[str] = []

    # Index heading
    index_body = [f"<h1>Date-based Diff Index</h1>",
                  f"<p>Total PDFs scanned: <b>{len(pdfs)}</b>. Dated groups: <b>{len(groups)}</b>. Unknown date: <b>{len(unknowns)}</b>.</p>"]

    if not groups:
        index_body.append("<p><strong>No documents with detected dates found.</strong></p>")
        index_body.append("<p>Date detection looks for patterns like MM/DD/YYYY, Month DD, YYYY, and YYYY-MM-DD in document text and filenames.</p>")

    # Process each date with 2+ documents
    duplicate_groups = 0
    for date, ds in sorted(groups.items()):
        if len(ds) < 2:
            continue
        
        duplicate_groups += 1
        ds_sorted = sorted(ds, key=lambda d: d.mtime)
        date_dir = out_dir / date
        date_dir.mkdir(parents=True, exist_ok=True)

        index_body.append(f"<h2>{date} <span class='badge'>{len(ds)} docs</span></h2><ul>")
        for d in ds_sorted:
            index_body.append(f"<li><small class='mono'>{html.escape(str(d.path))}</small></li>")
        index_body.append("</ul>")

        pairs: List[Tuple[Doc, Doc]] = []
        if args.pairwise:
            for i in range(len(ds_sorted)):
                for j in range(i+1, len(ds_sorted)):
                    pairs.append((ds_sorted[i], ds_sorted[j]))
        else:
            base = ds_sorted[0]
            for j in range(1, len(ds_sorted)):
                pairs.append((base, ds_sorted[j]))

        for a, b in pairs:
            a_tokens = tokenize(a.text)
            b_tokens = tokenize(b.text)
            diff_html, adds, rems = inline_diff_html(a_tokens, b_tokens)

            # Name analysis
            a_counts = name_counts(a.text, names)
            b_counts = name_counts(b.text, names)
            names_table = ["<table><tr><th>Name</th><th>A Mentions</th><th>B Mentions</th><th>Δ</th></tr>"]
            for n in names:
                da = a_counts.get(n, 0)
                db = b_counts.get(n, 0)
                delta = db - da
                delta_str = f"{delta:+d}" if delta != 0 else "0"
                names_table.append(f"<tr><td>{html.escape(n)}</td><td>{da}</td><td>{db}</td><td>{delta_str}</td></tr>")
            names_table.append("</table>")

            # Lines near names
            a_lines = extract_lines_with_names(a.text, names)
            b_lines = extract_lines_with_names(b.text, names)

            # Numbers changed
            nums_a = set(numbers_in(a.text))
            nums_b = set(numbers_in(b.text))
            added_nums = sorted(nums_b - nums_a, key=lambda x: (len(x), x))
            removed_nums = sorted(nums_a - nums_b, key=lambda x: (len(x), x))

            # Write pair page
            pair_name = f"diff_{a.path.stem[:40]}__VS__{b.path.stem[:40]}.html"
            pair_path = date_dir / pair_name
            body = []
            body.append(f"<h1>Diff for {date}</h1>")
            body.append("<div class='summary'>")
            body.append(f"<div class='kv'><b>Doc A</b><br><small class='mono'>{html.escape(str(a.path))}</small></div>")
            body.append(f"<div class='kv'><b>Doc B</b><br><small class='mono'>{html.escape(str(b.path))}</small></div>")
            body.append(f"<div class='kv'><b>Tokens Added</b><br>{adds}</div>")
            body.append(f"<div class='kv'><b>Tokens Removed</b><br>{rems}</div>")
            body.append(f"<div class='kv'><b>Numbers Added</b><br>{', '.join(added_nums) or '—'}</div>")
            body.append(f"<div class='kv'><b>Numbers Removed</b><br>{', '.join(removed_nums) or '—'}</div>")
            body.append("</div>")

            body.append("<h2>Name Mentions</h2>")
            body.append("".join(names_table))

            if a_lines or b_lines:
                body.append("<h2>Lines Near Names (A vs B)</h2>")
                body.append("<div class='summary'>")
                body.append("<div class='kv'><b>A</b><pre>" + html.escape("\n\n---\n\n".join(a_lines) or "—") + "</pre></div>")
                body.append("<div class='kv'><b>B</b><pre>" + html.escape("\n\n---\n\n".join(b_lines) or "—") + "</pre></div>")
                body.append("</div>")

            body.append("<h2>Inline Word Diff</h2>")
            body.append("<pre>" + diff_html + "</pre>")

            write_file(pair_path, make_html_page(f"Diff {date}", "\n".join(body)))

            # CSV row
            csv_rows.append({
                "date": date,
                "doc_a": str(a.path),
                "doc_b": str(b.path),
                "tokens_added": adds,
                "tokens_removed": rems,
                "name_counts_a": json.dumps(a_counts),
                "name_counts_b": json.dumps(b_counts),
                "numbers_added": ",".join(added_nums),
                "numbers_removed": ",".join(removed_nums),
                "pair_report": str(pair_path.relative_to(out_dir)),
            })

        # link the first pair for quick access
        if pairs:
            first_pair_rel = str((date_dir / f"diff_{ds_sorted[0].path.stem[:40]}__VS__{ds_sorted[1].path.stem[:40]}.html").relative_to(out_dir))
            index_body.append(f"<p><a href='{html.escape(first_pair_rel)}'>Open first diff for {date} →</a></p>")

    # Summary stats
    if duplicate_groups > 0:
        index_body.insert(1, f"<p><strong>Found {duplicate_groups} dates with potential duplicate documents!</strong></p>")
    
    # Unknowns list
    if unknowns:
        index_body.append("<h2>Docs with Unknown Date</h2><ul>")
        for d in unknowns:
            index_body.append(f"<li><small class='mono'>{html.escape(str(d.path))}</small></li>")
        index_body.append("</ul>")

    # Write CSV
    csv_path = out_dir / "changes_summary.csv"
    if csv_rows:
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "date","doc_a","doc_b","tokens_added","tokens_removed",
                "name_counts_a","name_counts_b","numbers_added","numbers_removed","pair_report"
            ])
            writer.writeheader()
            writer.writerows(csv_rows)
        print(f"[ok] Wrote {csv_path} with {len(csv_rows)} comparisons")
    else:
        print("[info] No date-based duplicates found - no CSV generated")

    # Write index
    write_file(out_dir / "index.html", make_html_page("Date-based Diff Index", "\n".join(index_body)))
    print(f"[ok] Open {out_dir / 'index.html'} in your browser.")

if __name__ == "__main__":
    main()
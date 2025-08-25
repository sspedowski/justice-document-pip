#!/usr/bin/env python3
Com
- Scans ./input for PDFs

- Scans ./input for PDFs
- Extracts text via pdfplumber (no OCR; add OCR upstream if needed)
- Detects doc date from text, then filename, then PDF metadata
- Groups docs by ISO date (YYYY-MM-DD)
- For each date with >= 2 docs:
    * Picks a baseline (earliest mtime) and compares pairwise or baseline->others
    ./output/date_diffs/<date>/diff_*.html
    * Counts and highlights mentions for target names
    * Reports numeric changes (e.g., page numbers, ages, dates, counts)
- Outputs:
from __future__ import annotations
    ./output/date_diffs/<date>/diff_*.html
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
        m = re.search(pat, 
            try:

    # 2) from filename
        m = re.search(pat, filename)
        
            except Exception:
    # 3) from metadata: Cr
        m = re.search(r"(\d{4})(\d{2})(\d{2})", pdf_meta_date)
            y

                pass

    try:
        reader = PdfReader(str(path))

    except Exceptio
    return None
def tokenize(text: str) -> Lis
    return re.findall(r"\w+|[^\w\s]", text, flags=re.UNICODE
@dataclass
    path: Path
    date: str | None

    counts: Dict[str, int] = {}
        pattern = re.compile(re.escape(
    return counts
def extract_lines_with_names(text: str, names: List[str]) -> List[
    name_re = r

            # include a bit of context
            nxt = lines[i+1] if i+1 < len(lines) else ""
            hits.append(

    return re.findall(r"\b\d+(?:\.\d+)?\b", text)
def inline_diff_html(a_tokens: List[str], b_tokens: List[s
    Render inline diff a
    """
    sm = SequenceMatcher(a=a_tokens, b=b_tokens)
    adds = rems = 0
        if op == "equal":
        elif op == "insert":
            out.appen
        elif op == "delete":
            out.append(f
        elif op == "
            add_frag = "".join(b_tokens[b0:b1])
            adds += len(b_tokens[b0:b1])
    return "".join(out), adds, rems

<html><head><meta charset="utf-8"><title>{html.escape(title)
body{{font-family:system-ui,-apple-system,Se
code,pre{{background:#f6f8fa;border:1px solid #e1e4e8;b
.kv{{background:#fafafa;border:1px sol
.del{{background:#ffebe9
a{{text-decoration:none;color:#0969da}}
td,th{{border-top:1px solid #eee;padding:6px
</style></head><body>
</body></html>"""
def write_file(path: Path, content: str):

def main():
    ap.add_argument("--
    ap.add_argument("--names", default="Noel,
                    help="Compar

    in_dir = Pat
    out_dir.mkdir(parents=True, exist_ok=T
    pdfs = sorted(in_dir.glob
    for p in pdfs:
            text = saf
            print(f"[warn] could not r
        meta_date = pdf_creation_dat
        docs.
    groups: Dict
    for d in docs:
            groups[d.date].ap
            unknowns
    # CSV summary header
    index_items: List
    # Index heading
             
    # Process each date with 2+ documents
        if len(d
        ds_sorted = sorted(ds, key=lambda d: d.mtime
        date_dir.mkdir(parent
        index_body.a
            ind

        if args.pairwise:
        
        else:
            for j in range(1, len(ds_

            a_tokens = tokenize(a.text)
            diff_html, adds, rems = inline_di
            # Name an
            
            for

            names_table.append("</tab
            # Lines near names
            b_lines = extract_lines_with_names(b.text, names)

          
          
            # 
            p
            body.app
            body

            body.append(f"<div class='kv'><b>Numbers Added</b><
            body.append("</div>
            body.ap

                body.append("<h2>Lines Near Na
                b

            body.append("<h2>Inline Word Diff</h2>")


            c
                "doc_a": str(a.path)
                "tokens_added": 
                "name_counts_a": json.
                "numbers_added": ",".join(added_
                "pair_report": str(pair_path.relative_to

        if pairs:
            ind

        index_body.append("<h2>Docs wit
            index_body.append(f"<li><small class=

    csv_path = out_dir / "changes_summary.csv"
       
            "name_counts_a","name_counts_b","numbers_added","numbers_removed",
        writer.writeheader()

    write_file(out_dir / "index.html", 
    print(f"[ok] Open {out_dir / 'index.html'} i
if __name__ 


















































                    help="Compare every pair; default compares baseline->others")
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",") if n.strip()]
    in_dir = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(in_dir.glob("**/*.pdf"))
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

    # Process each date with 2+ documents
    for date, ds in sorted(groups.items()):
        if len(ds) < 2:
            continue
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
                names_table.append(f"<tr><td>{html.escape(n)}</td><td>{da}</td><td>{db}</td><td>{db-da:+d}</td></tr>")
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










































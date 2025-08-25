import os, json, subprocess, sys
from pathlib import Path
from datetime import datetime
import yaml
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

THIS = Path(__file__).resolve().parent
ROOT = THIS.parent

def load_cfg(cfg_path=None):
    p = Path(cfg_path) if cfg_path else ROOT/"config.ci.yaml"
    with open(p, "r", encoding="utf-8") as f:
        return yaml.safe_load(f), p

def printable_index(json_files, out_pdf):
    c = canvas.Canvas(out_pdf, pagesize=LETTER)
    w, h = LETTER
    margin = 54
    y = h - margin
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y, "PRINTABLE INDEX — Master Review")
    y -= 18
    c.setFont("Helvetica", 9)
    c.drawString(margin, y, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 24
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, "File Name")
    c.drawString(margin+260, y, "Category / Include")
    c.drawString(margin+380, y, "Children / Laws")
    y -= 12
    c.setFont("Helvetica", 9)

    for jf in json_files:
        with open(jf, "r", encoding="utf-8") as f:
            j = json.load(f)
        line1 = j.get("file_name","")[:48]
        line2 = f"{j.get('category','')} / {j.get('include','')}"
        kids = ", ".join(j.get("children",[]))
        laws = ", ".join(j.get("laws",[]))
        line3 = (kids or "—") + (" | " if (kids and laws) else "") + (laws or "—")

        if y < 72:
            c.showPage()
            y = h - margin
            c.setFont("Helvetica-Bold", 10)
            c.drawString(margin, y, "File Name")
            c.drawString(margin+260, y, "Category / Include")
            c.drawString(margin+380, y, "Children / Laws")
            y -= 12
            c.setFont("Helvetica", 9)

        c.drawString(margin, y, line1)
        c.drawString(margin+260, y, line2[:28])
        for chunk in [line3[i:i+60] for i in range(0, len(line3), 60)] or ["—"]:
            c.drawString(margin+380, y, chunk)
            y -= 12
        y -= 4

    c.showPage()
    c.save()

def run_enhancement_pipeline(cfg_path):
    """Run OCR, deduplication, and auto-tagging enhancements"""
    print("Running enhancement pipeline...")
    
    # Check for duplicates
    try:
        subprocess.run([
            sys.executable, (THIS/"enhance_pdfs.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--check-duplicates"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Duplicate check failed: {e}")
    
    # Run OCR enhancement
    try:
        subprocess.run([
            sys.executable, (THIS/"enhance_pdfs.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--ocr-enhance"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: OCR enhancement failed: {e}")
    
    # Run auto-tagging
    try:
        subprocess.run([
            sys.executable, (THIS/"auto_tag.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--create-review-queue"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Auto-tagging failed: {e}")
    
    # Assign exhibit numbers
    try:
        subprocess.run([
            sys.executable, (THIS/"enhance_pdfs.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--assign-exhibits"
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Warning: Exhibit assignment failed: {e}")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Path to YAML config", default=None)
    parser.add_argument("--skip-enhancements", action="store_true", help="Skip OCR and auto-tagging")
    args = parser.parse_args()

    cfg, cfg_path = load_cfg(args.config)
    input_dir = ROOT / cfg["paths"]["input_dir"]
    out_dir = ROOT / cfg["paths"]["output_dir"]
    meta_dir = ROOT / cfg["paths"]["metadata_dir"]
    packets_dir = ROOT / cfg["paths"]["packets_dir"]

    out_dir.mkdir(parents=True, exist_ok=True)
    meta_dir.mkdir(parents=True, exist_ok=True)
    packets_dir.mkdir(parents=True, exist_ok=True)

    # 1) Summarize each PDF -> metadata JSON
    pdfs = sorted([p for p in input_dir.glob("*.pdf")])
    json_files = []
    for pdf in pdfs:
        out_json = subprocess.check_output([
            sys.executable, (THIS/"summarize_pdf.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--pdf", pdf.as_posix(),
            "--out", meta_dir.as_posix()
        ], text=True).strip()
        json_files.append(Path(out_json))

    # 1.5) Run enhancement pipeline (OCR, auto-tagging, deduplication)
    if not args.skip_enhancements and json_files:
        run_enhancement_pipeline(cfg_path)
        # Refresh json_files list after enhancements
        json_files = sorted([p for p in meta_dir.glob("*.json") 
                           if not p.name.startswith(('duplicates', 'review_queue', 'exhibit_mapping'))])

    # 2) Export Master CSV
    csv_path = out_dir / "MasterReview_INDEX.csv"
    subprocess.check_call([
        sys.executable, (THIS/"export_master_to_csv.py").as_posix(),
        "--metadata_dir", meta_dir.as_posix(),
        "--out_csv", csv_path.as_posix()
    ])

    # 3) Generate packets (cover + original)
    for pdf in pdfs:
        meta_json = meta_dir / (pdf.stem + ".json")
        out_pdf = packets_dir / f"PACKET_{pdf.stem}.pdf"
        subprocess.check_call([
            sys.executable, (THIS/"generate_packet.py").as_posix(),
            "--config", cfg_path.as_posix(),
            "--pdf", pdf.as_posix(),
            "--meta", meta_json.as_posix(),
            "--out", out_pdf.as_posix()
        ])

    # 4) Printable index PDF
    printable_index(json_files, (out_dir / "PRINTABLE_Index.pdf").as_posix())

    print("DONE:")
    print(f"- CSV: {csv_path}")
    print(f"- Printable Index: {out_dir / 'PRINTABLE_Index.pdf'}")
    print(f"- Packets: {packets_dir}")

if __name__ == "__main__":
    main()
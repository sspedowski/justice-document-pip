import os, json
from pathlib import Path
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from PyPDF2 import PdfWriter, PdfReader

def draw_cover(pdf_path, meta, cfg, tmp_cover_path):
    c = canvas.Canvas(tmp_cover_path, pagesize=LETTER)
    w, h = LETTER

    header = cfg["packet_header"]
    y = h - 72
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, header.get("project_name", "Justice Packet"))
    y -= 22
    c.setFont("Helvetica", 11)
    c.drawString(72, y, f"Recipient(s): {', '.join(cfg.get('recipients', []))}")
    y -= 18
    c.drawString(72, y, f"File: {meta['file_name']}")
    y -= 14
    c.drawString(72, y, f"Title: {meta['title']}")
    y -= 14
    c.drawString(72, y, f"Category: {meta.get('category','')}; Include: {meta.get('include','')}")
    y -= 14
    c.drawString(72, y, f"Children: {', '.join(meta.get('children', [])) or '—'}")
    y -= 14
    c.drawString(72, y, f"Laws: {', '.join(meta.get('laws', [])) or '—'}")

    y -= 24
    c.setFont("Helvetica-Bold", 11)
    c.drawString(72, y, "Summary:")
    y -= 14
    c.setFont("Helvetica", 10)
    summary = meta.get("description","")
    # wrap manually
    import textwrap
    for line in textwrap.wrap(summary, width=95):
        c.drawString(72, y, line)
        y -= 12
        if y < 96:
            c.showPage(); y = h - 72

    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.drawString(72, y, "Submitter:")
    y -= 14
    c.setFont("Helvetica", 10)
    c.drawString(72, y, f"{header.get('submitter_name','')} — {header.get('submitter_phone','')} — {header.get('submitter_email','')}")

    y -= 24
    c.setFont("Helvetica-Bold", 11)
    c.drawString(72, y, "Call to Action:")
    y -= 14
    c.setFont("Helvetica", 10)
    for line in textwrap.wrap(header.get("call_to_action",""), width=95):
        c.drawString(72, y, line)
        y -= 12
        if y < 96:
            c.showPage(); y = h - 72

    c.showPage()
    c.save()

def make_packet(original_pdf, metadata_json, cfg, out_pdf):
    import yaml
    with open(metadata_json, "r", encoding="utf-8") as f:
        meta = json.load(f)

    tmp_cover = Path(out_pdf).with_suffix(".cover.tmp.pdf")
    draw_cover(out_pdf, meta, cfg, tmp_cover)

    writer = PdfWriter()
    # add cover
    writer.append(tmp_cover.as_posix())
    # add original
    writer.append(original_pdf)

    with open(out_pdf, "wb") as fh:
        writer.write(fh)

    try:
        os.remove(tmp_cover)
    except OSError:
        pass

def main():
    import argparse, yaml
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--meta", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    make_packet(args.pdf, args.meta, cfg, args.out)
    print(args.out)

if __name__ == "__main__":
    main()
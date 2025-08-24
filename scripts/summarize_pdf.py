import os, json, re, pdfplumber
from pathlib import Path
from datetime import datetime

def read_yaml(fp):
    import yaml
    with open(fp, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def safe_text(s): return re.sub(r"\s+", " ", (s or "")).strip()

def extract_text(pdf_path, max_chars=120000):
    chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            chunks.append(t)
            if sum(len(c) for c in chunks) >= max_chars:
                break
    return "\n".join(chunks)

def detect_tags(text, cfg):
    text_l = text.lower()
    laws = []
    for law in cfg.get("laws", []):
        if any(k.lower() in text_l for k in law.get("keywords", [])):
            laws.append(law["name"])
    children_found = []
    for child in cfg.get("children", []):
        # simple token match
        if re.search(rf"\b{re.escape(child)}\b", text, flags=re.IGNORECASE):
            children_found.append(child)
    return sorted(set(laws)), sorted(set(children_found))

def guess_category(text):
    # very light heuristic; you can override by hand later in the CSV
    t = text.lower()
    if "nurse exam" in t or "forensic" in t or "police report" in t or "investigation" in t:
        return "Primary"
    if "notice of hearing" in t or "scheduling" in t:
        return "No"
    return "Supporting"

def make_summary(text, max_len=900):
    t = safe_text(text)
    return (t[:max_len] + "…") if len(t) > max_len else t

def process_one(pdf_path, cfg, out_dir):
    name = os.path.basename(pdf_path)
    text = extract_text(pdf_path)
    laws, kids = detect_tags(text, cfg)
    category = guess_category(text)

    data = {
        "file_name": name,
        "title": Path(name).stem,
        "description": make_summary(text),
        "category": category,  # Primary / Supporting / External / No
        "children": kids,
        "laws": laws,
        "misconduct": [{"law": l, "page": "", "paragraph": "", "notes": ""} for l in laws],
        "include": "YES" if category in ("Primary", "Supporting", "External") else "NO",
        "placement": {
            "master_file": category != "No",
            "exhibit_bundle": category in ("Primary", "Supporting"),
            "oversight_packet": category in ("Primary", "Supporting"),
        },
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

    out_path = os.path.join(out_dir, Path(name).with_suffix(".json").name)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return out_path

def main():
    import argparse, yaml
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    cfg = read_yaml(args.config)
    os.makedirs(args.out, exist_ok=True)
    out_json = process_one(args.pdf, cfg, args.out)
    print(out_json)

if __name__ == "__main__":
    main()
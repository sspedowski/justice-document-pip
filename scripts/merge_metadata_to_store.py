import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "output" / "metadata"
STORE = ROOT / "app" / "data" / "justice-documents.json"

def main():
    STORE.parent.mkdir(parents=True, exist_ok=True)
    docs = []
    for p in sorted(META.glob("*.json")):
        with open(p, "r", encoding="utf-8") as f:
            j = json.load(f)
        # Transform for UI compatibility
        docs.append({
            "id": j.get("file_name", "").replace(".pdf", "").replace(" ", "_"),
            "fileName": j.get("file_name",""),
            "title": j.get("title",""),
            "description": j.get("description",""),
            "category": j.get("category",""),
            "children": j.get("children",[]),
            "laws": j.get("laws",[]),
            "misconduct": j.get("misconduct",[]),
            "include": j.get("include",""),
            "placement": {
                "masterFile": j.get("placement",{}).get("master_file", False),
                "exhibitBundle": j.get("placement",{}).get("exhibit_bundle", False),
                "oversightPacket": j.get("placement",{}).get("oversight_packet", False)
            },
            "uploadedAt": j.get("generated_at", ""),
            "textContent": j.get("description", "")[:10000]  # Use description as text content preview
        })
    
    with open(STORE, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)
    print(f"Wrote {STORE} ({len(docs)} items)")

if __name__ == "__main__":
    main()
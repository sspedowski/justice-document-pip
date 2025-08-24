import os, json, csv
from pathlib import Path

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata_dir", required=True)
    parser.add_argument("--out_csv", required=True)
    args = parser.parse_args()

    rows = []
    for p in Path(args.metadata_dir).glob("*.json"):
        with open(p, "r", encoding="utf-8") as f:
            j = json.load(f)
        rows.append({
            "File Name": j.get("file_name",""),
            "Category": j.get("category",""),
            "Children": ", ".join(j.get("children",[])),
            "Laws": ", ".join(j.get("laws",[])),
            "Misconduct (law/page/para)": "; ".join(
                f"{m.get('law','')} p{m.get('page','')}/{m.get('paragraph','')}".strip()
                for m in j.get("misconduct",[])
            ),
            "Include": j.get("include",""),
            "Placement: Master File": str(j.get("placement",{}).get("master_file", False)),
            "Placement: Exhibit Bundle": str(j.get("placement",{}).get("exhibit_bundle", False)),
            "Placement: Oversight Packet": str(j.get("placement",{}).get("oversight_packet", False)),
            "Title": j.get("title",""),
            "Description": j.get("description","")
        })

    os.makedirs(os.path.dirname(args.out_csv), exist_ok=True)
    with open(args.out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else [])
        if rows: w.writeheader()
        w.writerows(rows)

    print(args.out_csv)

if __name__ == "__main__":
    main()
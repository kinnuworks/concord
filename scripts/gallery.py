# Builds the picture wall for the site: a small copy of every picture drawn in the evaluation,
# with what each reader said it shows and whether the read-back kept it.
# Run: python3 scripts/gallery.py   (needs Pillow; reads training/eval, writes public/gallery)
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/gallery"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 168
HERO = 320

MANY = {"tablet": "tablets", "capsule": "capsules", "spoon": "spoonfuls", "drops": "drops", "puff": "puffs"}
ONE = {"tablet": "tablet", "capsule": "capsule", "spoon": "spoonful", "drops": "drop", "puff": "puff"}


def amount(form, count):
    if count is None or form is None:
        return "could not tell"
    return f"{count} {ONE.get(form, form) if count == 1 else MANY.get(form, form)}"


def asked(row):
    e = row["expected"]
    if row["kind"] in ("dose", "unit"):
        return amount(e["form"], e["count"])
    if row["kind"] == "exercise":
        _, move, angle = row["key"].split("-")
        return f"a figure doing a {move.replace('_', ' ')} at {angle} degrees"
    return e["meaning"]


def saw(row, reading):
    if reading is None:
        return "no answer"
    if row["kind"] in ("dose", "unit"):
        return amount(reading.get("form"), reading.get("count"))
    if row["kind"] == "exercise":
        if not reading.get("person"):
            return "no clear person"
        return "a person, limbs clear" if reading.get("limbs_ok") else "a person, limbs tangled or missing"
    return str(reading.get("shows", "")).rstrip(".")


def why(row):
    """Why the read-back stopped a picture, in a few words."""
    if row["pass"]:
        return ""
    if row["kind"] in ("dose", "unit"):
        return "wrong count"
    if row["kind"] == "exercise":
        return "figure unclear"
    understood = [bool(r.get("reading") and r["reading"].get("understood")) for r in row["readings"]]
    return "the readers disagreed" if any(understood) else "neither reader saw it"


index = []
for arm, code in (("base", "b"), ("adapter", "a")):
    rows = [json.loads(line) for line in (ROOT / f"training/eval/{arm}.jsonl").read_text().splitlines() if line.strip()]
    for n, row in enumerate(rows):
        name = f"{code}{n:03d}"
        picture = Image.open(ROOT / f"training/eval/{arm}/{row['file']}").convert("RGB")
        picture.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"{name}.webp", "WEBP", quality=72, method=6)
        index.append({
            "f": name,
            "adapter": arm == "adapter",
            "kind": row["kind"],
            "asked": asked(row),
            "saw": [[r["reader"], saw(row, r.get("reading"))] for r in row["readings"]],
            "kept": bool(row["pass"]),
            "why": why(row),
        })

(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n")
print(len(index), "pictures,", sum(1 for i in index if not i["kept"]), "stopped by the read-back")

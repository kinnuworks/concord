# Crops each unit picture to its drawing, with a small even margin, so that when a card
# repeats it the pills are large enough to count at a glance.
# Run: uv run --with pillow python3 scripts/trim_units.py
import glob
from PIL import Image, ImageChops

for path in sorted(glob.glob("public/tiles/unit-*.png")):
    im = Image.open(path).convert("RGB")
    diff = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).convert("L")
    box = diff.point(lambda v: 255 if v > 18 else 0).getbbox()
    if not box:
        continue
    w, h = box[2] - box[0], box[3] - box[1]
    side = int(max(w, h) * 1.3)
    cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(im.crop(box), (side // 2 - (cx - box[0]), side // 2 - (cy - box[1])))
    canvas.resize((512, 512), Image.LANCZOS).save(path)
    print(path, "drawing was", f"{max(w, h) / im.size[0]:.0%}", "of the frame")

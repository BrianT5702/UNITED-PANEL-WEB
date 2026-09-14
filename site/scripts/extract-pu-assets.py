"""Extract PU catalogue images into site/public/uploads/pu."""
from pathlib import Path
import fitz
from PIL import Image

ROOT = Path(r"C:\Users\brian\OneDrive\Desktop\United Panel\Webpage for RockWool")
PDF = ROOT / r"PUR\UR PUR Catalogue.pdf"
PIC = ROOT / r"PUR\UR-PUR Catalogue\a.i working file\pic to link"
JPG = ROOT / r"PUR\UR-PUR Catalogue\a.i working file\JPG for preview only"
OUT = ROOT / r"site\public\uploads\pu"

(OUT / "joints").mkdir(parents=True, exist_ok=True)
(OUT / "certs").mkdir(parents=True, exist_ok=True)
(OUT / "apps").mkdir(parents=True, exist_ok=True)


def save_jpeg(img: Image.Image, dest: Path, quality=88):
    rgb = img.convert("RGB")
    rgb.save(dest, "JPEG", quality=quality, optimize=True)
    print("wrote", dest.name, rgb.size)


def tif_to_png(src: Path, dest: Path, max_w=1600):
    img = Image.open(src)
    img.load()
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    if img.width > max_w:
        h = int(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.Resampling.LANCZOS)
    img.save(dest, "PNG", optimize=True)
    print("wrote", dest.name, img.size)


# Clip-lock / cam-lock diagrams
tif_map = {
    "Polyurethane panel clip joint 01.tif": "clip-joint-01.png",
    "Polyurethane panel clip joint 02.tif": "clip-joint-02.png",
    "Polyurethane panel clip joint 03.tif": "clip-joint-03.png",
    "Polyurethane ceiling panel large suspension joint detail.tif": "ceiling-large-suspension.png",
    "Polyurethane ceiling panel nylon hanger joint detail.tif": "ceiling-nylon-hanger.png",
}
for src_name, dest_name in tif_map.items():
    tif_to_png(PIC / src_name, OUT / "joints" / dest_name)

# Warranty badge
tif_to_png(PIC / "warranty-logo.tif", OUT / "certs" / "warranty-10-year.png", max_w=800)
tif_to_png(PIC / "warranty-logo 2.tif", OUT / "certs" / "warranty-10-year-alt.png", max_w=800)

# High-res PDF page renders (1-based page numbers)
doc = fitz.open(PDF)
pages = {
    8: ("apps", "applications-page.jpg"),
    9: ("certs", "characteristics-page.jpg"),
    10: ("certs", "equivalent-thickness.jpg"),
    11: ("certs", "catalogue-page-09.jpg"),
    12: ("certs", "catalogue-page-10.jpg"),
    14: ("joints", "product-range-page.jpg"),
    15: ("joints", "installation-details-1.jpg"),
    16: ("joints", "installation-details-2.jpg"),
}
matrix = fitz.Matrix(2.2, 2.2)
for page_no, (folder, name) in pages.items():
    pix = doc[page_no - 1].get_pixmap(matrix=matrix)
    dest = OUT / folder / name
    pix.save(str(dest))
    print("pdf page", page_no, "->", dest.relative_to(OUT), pix.width, pix.height)

# Application photos from catalogue artwork
app_copies = {
    "page 5-a.JPG": "install-blue-warehouse.jpg",
    "page 5-b.JPG": "app-5b.jpg",
    "page 5-c.JPG": "app-5c.jpg",
    "page 6-a.JPG": "app-plant-room.jpg",
    "page 6-b.JPG": "app-6b.jpg",
    "page 6-c.jpg": "app-6c.jpg",
    "page 11-a.jpg": "warehouse-stacks.jpg",
    "page 11-b.JPG": "warehouse-11b.jpg",
    "page 12-a.jpg": "app-12a.jpg",
    "page 12-b.jpg": "app-12b.jpg",
}
for src_name, dest_name in app_copies.items():
    src = PIC / src_name
    if not src.exists():
        print("MISSING", src_name)
        continue
    img = Image.open(src)
    img.load()
    # Keep large photos usable on the web
    max_w = 2000
    if img.width > max_w:
        h = int(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.Resampling.LANCZOS)
    save_jpeg(img, OUT / "apps" / dest_name)

# Joint-page site photos
joint_photos = PIC / "joint pic for pg14"
if joint_photos.exists():
    for i, f in enumerate(sorted(joint_photos.glob("*.*")), start=1):
        if f.suffix.lower() not in {".jpg", ".jpeg"}:
            continue
        img = Image.open(f)
        img.load()
        save_jpeg(img, OUT / "apps" / f"site-{i:02d}{f.suffix.lower()}")

print("done")

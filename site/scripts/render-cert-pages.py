import fitz
from pathlib import Path
from PIL import Image

doc = fitz.open(
    r"C:\Users\brian\OneDrive\Desktop\United Panel\Webpage for RockWool\UR PIR Catalogue.pdf"
)
out = Path(
    r"C:\Users\brian\OneDrive\Desktop\United Panel\Webpage for RockWool\site\public\uploads\pir\certs"
)
out.mkdir(parents=True, exist_ok=True)

# High-res render of certification wall page (page 18 = index 17)
pix = doc[17].get_pixmap(matrix=fitz.Matrix(2.5, 2.5))
page_path = out / "page18-hires.jpg"
pix.save(str(page_path))
print("saved", page_path.name, pix.width, pix.height)

# Also page 17 (index 16) FM frame page and page 22 TUV
for i, name in [(16, "page17-hires.jpg"), (21, "page22-hires.jpg"), (19, "page20-hires.jpg")]:
    p = doc[i].get_pixmap(matrix=fitz.Matrix(2.2, 2.2))
    path = out / name
    p.save(str(path))
    print("saved", name, p.width, p.height)

# Extract ALL page 18 images including small ones
page = doc[17]
for j, img in enumerate(page.get_images(full=True)):
    raw = doc.extract_image(img[0])
    path = out / f"p18-all-{j+1}.{raw['ext']}"
    path.write_bytes(raw["image"])
    print(path.name, raw["width"], raw["height"], len(raw["image"]))

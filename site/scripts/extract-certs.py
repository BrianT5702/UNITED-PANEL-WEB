import fitz
from pathlib import Path

doc = fitz.open(
    r"C:\Users\brian\OneDrive\Desktop\United Panel\Webpage for RockWool\UR PIR Catalogue.pdf"
)
out = Path(
    r"C:\Users\brian\OneDrive\Desktop\United Panel\Webpage for RockWool\site\public\uploads\pir\certs"
)
out.mkdir(parents=True, exist_ok=True)

for page_i in [16, 17, 18, 19, 20, 21, 22, 23]:
    page = doc[page_i]
    print(f"=== page {page_i + 1} ===")
    for j, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        try:
            raw = doc.extract_image(xref)
        except Exception as e:
            print(" err", e)
            continue
        w, h = raw["width"], raw["height"]
        size = len(raw["image"])
        ext = raw["ext"]
        print(f"  img{j+1}: {w}x{h} {size} {ext}")
        if size > 4000:
            path = out / f"p{page_i+1}-img{j+1}.{ext}"
            path.write_bytes(raw["image"])
            print("  saved", path.name)

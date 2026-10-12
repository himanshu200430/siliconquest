import os
import pymupdf

PDF_PATH = "C:/Users/DELL/Downloads/ALL CARDS FINAL.pdf"
OUTPUT_DIR = "client/public/cards"

os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
print(f"Loaded PDF: {PDF_PATH} ({len(doc)} pages)")

card_index = 0
results = []

for page_num in range(len(doc)):
    page = doc[page_num]
    imgs = page.get_image_info()
    
    # Sort by row (y), then col (x)
    # Using threshold 50 to bucket into 3 rows
    sorted_imgs = sorted(imgs, key=lambda x: (round(x['bbox'][1] / 60), x['bbox'][0]))
    
    for idx_on_page, img in enumerate(sorted_imgs):
        bbox = img['bbox']
        # 300 DPI clip
        rect = pymupdf.Rect(bbox)
        pix = page.get_pixmap(dpi=300, clip=rect)
        
        card_index += 1
        filename = f"card_{card_index:02d}_p{page_num+1}_{idx_on_page+1}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        pix.save(filepath)
        
        results.append({
            "index": card_index,
            "page": page_num + 1,
            "pos": idx_on_page + 1,
            "file": filename,
            "width": pix.width,
            "height": pix.height
        })

print(f"Successfully extracted {len(results)} cards into {OUTPUT_DIR}")

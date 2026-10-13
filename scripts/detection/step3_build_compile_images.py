"""
Step 3: Build Compile Images (client/public/cards-compile/<slug>.png)
1. Crops tightly to the inner artwork rectangle only (excluding outer fringed borders,
   white margins, bottom name/series labels, and tier labels).
2. Inpaints the identical ACM diamond logo in the top-left corner so that it does not
   generate identical false-matching feature points across all 99 targets.
3. Preserves original artwork aspect ratio and resolution without stretching.
4. Outputs all 99 processed target images to client/public/cards-compile/<slug>.png.
"""

import os
import cv2
import json
import numpy as np

CARDS_INPUT_DIR = "client/public/cards"
OUTPUT_DIR = "client/public/cards-compile"
MASK_TEMPLATE_PATH = "scripts/detection/crops_test/exact_logo_mask.png"

def build_compile_images():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load cards.json
    with open("scripts/cards.json", "r", encoding="utf-8") as f:
        cards_data = json.load(f)
    print(f"Building compile images for {len(cards_data)} cards...")
    
    # Load exact logo mask template
    mask_160 = cv2.imread(MASK_TEMPLATE_PATH, cv2.IMREAD_GRAYSCALE)
    if mask_160 is None:
        raise FileNotFoundError(f"Missing mask template at {MASK_TEMPLATE_PATH}")
        
    pts = np.array([[78, 18], [142, 82], [78, 146], [14, 82]], np.int32)
    poly_mask = np.zeros((160, 160), dtype=np.uint8)
    cv2.fillPoly(poly_mask, [pts], 255)
    
    results = []
    
    for card in cards_data:
        slug = os.path.basename(card["image"])
        src_path = os.path.join(CARDS_INPUT_DIR, slug)
        dest_path = os.path.join(OUTPUT_DIR, slug)
        
        if not os.path.exists(src_path):
            print(f"WARNING: Source image missing: {src_path}")
            continue
            
        im = cv2.imread(src_path)
        h, w = im.shape[:2]
        
        # 1. Crop tightly to artwork rectangle only:
        # Excludes outer fringed border (~10%), margins, and bottom text banner (>59%)
        x1 = int(round(w * 0.101))
        x2 = int(round(w * 0.897))
        y1 = int(round(h * 0.0773))
        y2 = int(round(h * 0.590))
        
        crop = im[y1:y2, x1:x2].copy()
        ch, cw = crop.shape[:2]
        
        # 2. Inpaint diamond logo in top-left
        patch = crop[2:162, 0:160]
        patch_mask = mask_160.copy()
        
        # Color adaptive thresholding for blue/colored strokes
        hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        blue_stroke = cv2.inRange(hsv, np.array([90, 60, 40]), np.array([135, 255, 255]))
        kernel = np.ones((3, 3), np.uint8)
        blue_dilated = cv2.dilate(blue_stroke, kernel, iterations=1)
        
        combined_patch_mask = np.maximum(patch_mask, cv2.bitwise_and(blue_dilated, poly_mask))
        
        full_mask = np.zeros((ch, cw), dtype=np.uint8)
        full_mask[2:162, 0:160] = combined_patch_mask
        
        inpainted = cv2.inpaint(crop, full_mask, 3, cv2.INPAINT_TELEA)
        
        # Save compile image
        cv2.imwrite(dest_path, inpainted)
        
        ar = round(cw / ch, 4)
        results.append({
            "id": card["id"],
            "name": card["name"],
            "slug": slug,
            "width": cw,
            "height": ch,
            "aspect_ratio": ar,
            "path": dest_path
        })
        
    print(f"\n================== STEP 3 RESULTS ==================")
    print(f"Processed compile images: {len(results)} / 99 saved to {OUTPUT_DIR}")
    print(f"Compiled image dimensions: {results[0]['width']}x{results[0]['height']} (Aspect ratio: {results[0]['aspect_ratio']})")
    print(f"Sample generated cards: {[r['slug'] for r in results[:5]]}")
    print("====================================================\n")
    return results

if __name__ == "__main__":
    build_compile_images()

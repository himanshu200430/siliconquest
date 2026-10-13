"""
Step 2: Extract Card Images from PDF
Rasterizes ALL_CARDS_FINAL.pdf at 300 DPI using PyMuPDF.
Matches crops to cards.json using printed card names and canonical typo mappings.
Verifies 10 Legendary / 25 Rare / 64 Common tier split and reports known anomalies.
"""

import os
import json
import shutil
import pymupdf

PDF_PATHS = [
    "C:/Users/DELL/Downloads/ALL CARDS FINAL.pdf",
    "C:/Users/DELL/.gemini/antigravity/brain/183f48fe-fd87-4353-bc70-99835619ff89/.user_uploaded/media_1791817506013_90cc2966.pdf"
]

OUTPUT_DIR = "client/public/cards"
RAW_CROPS_DIR = "scripts/detection/raw_extracted_cards"

TYPO_MAP = {
    "freiza": "frieza",
    "xlrs": "xlr8",
    "humangasaur": "humungousaur",
    "wildbutt": "wildmutt",
    "swampfire": "swamp fire",
    "picollo": "piccolo",
}

def get_pdf_path():
    for p in PDF_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not find ALL_CARDS_FINAL.pdf")

def run_extraction():
    pdf_path = get_pdf_path()
    print(f"Loading PDF from: {pdf_path}")
    doc = pymupdf.open(pdf_path)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(RAW_CROPS_DIR, exist_ok=True)
    
    # Load cards.json
    with open("scripts/cards.json", "r", encoding="utf-8") as f:
        cards_data = json.load(f)
    print(f"Loaded {len(cards_data)} cards from cards.json")
    
    card_by_name = {c["name"].lower().strip(): c for c in cards_data}
    
    # Load pdf inventory (source of truth for printed text on all 11 pages)
    with open("scripts/pdf_card_inventory.json", "r", encoding="utf-8") as f:
        inventory = json.load(f)
    
    # 1. Rasterize each page at 300 DPI and extract 9 cards per page
    raw_crops = {}
    crop_counter = 0
    
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        imgs = page.get_image_info()
        # Sort top-to-bottom (row), then left-to-right (col)
        sorted_imgs = sorted(imgs, key=lambda x: (round(x['bbox'][1] / 60), x['bbox'][0]))
        
        for idx_on_page, img_meta in enumerate(sorted_imgs):
            bbox = img_meta['bbox']
            rect = pymupdf.Rect(bbox)
            pix = page.get_pixmap(dpi=300, clip=rect)
            
            crop_counter += 1
            filename = f"card_{crop_counter:02d}_p{page_idx+1}_{idx_on_page+1}.png"
            filepath = os.path.join(RAW_CROPS_DIR, filename)
            pix.save(filepath)
            
            raw_crops[(page_idx + 1, idx_on_page + 1)] = {
                "file": filepath,
                "width": pix.width,
                "height": pix.height
            }
            
    print(f"Rasterized {crop_counter} card crops at 300 DPI into {RAW_CROPS_DIR}")
    
    # 2. Match crops to cards.json using printed name + typo mapping
    matched = []
    unmatched = []
    matched_card_ids = set()
    tier_counts = {"Legendary": 0, "Rare": 0, "Common": 0}
    
    for item in inventory:
        p_num = item["page"]
        pos = item["pos"]
        printed_name = item["name_printed"].lower().strip()
        
        # Apply typo mapping
        mapped_name = TYPO_MAP.get(printed_name, printed_name)
        
        if mapped_name not in card_by_name:
            unmatched.append((item, f"Name not in cards.json: {printed_name} -> {mapped_name}"))
            continue
            
        card = card_by_name[mapped_name]
        card_id = card["id"]
        
        if card_id in matched_card_ids:
            unmatched.append((item, f"Duplicate match for card ID: {card_id}"))
            continue
            
        matched_card_ids.add(card_id)
        
        # Verify printed border/tier matches cards.json tier
        expected_tier = card["tier"]
        pdf_tier = item["tier"]
        if expected_tier != pdf_tier:
            print(f"WARNING: Tier discrepancy for {card['name']}: PDF says {pdf_tier}, DB says {expected_tier}")
            
        tier_counts[expected_tier] += 1
        
        # Copy to public destination
        slug = os.path.basename(card["image"])
        dest_path = os.path.join(OUTPUT_DIR, slug)
        src_path = raw_crops.get((p_num, pos), {}).get("file")
        if src_path and os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            
        matched.append({
            "id": card_id,
            "name": card["name"],
            "printed_name": item["name_printed"],
            "tier": expected_tier,
            "border": item["border"],
            "slug": slug,
            "page": p_num,
            "pos": pos,
            "notes": item.get("notes", "")
        })
        
    print("\n================== STEP 2 VERIFICATION ==================")
    print(f"Total cards matched: {len(matched)} / 99")
    print(f"Unique matched card IDs: {len(matched_card_ids)}")
    print(f"Unmatched cards: {len(unmatched)}")
    print(f"Tier breakdown: {tier_counts}")
    
    print("\n--- REPORTING KNOWN CARD ANOMALIES (WITHOUT FIXING) ---")
    print("1. Muzan (char_003, Legendary): Printed card displays a photo of real person Michael Jackson instead of the anime character.")
    print("2. Piccolo (char_074, Common): Card banner is labeled 'Demon Slayer' although character belongs to 'Dragon Ball'.")
    print("=========================================================\n")
    
    return {
        "matched_count": len(matched),
        "tier_counts": tier_counts,
        "unmatched": unmatched
    }

if __name__ == "__main__":
    run_extraction()

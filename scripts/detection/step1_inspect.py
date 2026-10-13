"""
Step 1: Inspect Current Setup
Reports MindARScene target loading, mindar-image attributes, target counts,
source images, dimensions, aspect ratios, and architectural issues affecting detection quality.
"""

import os
import json
from PIL import Image

def inspect_current_setup():
    report = {}
    
    # 1. Inspect MindARScene.tsx
    scene_file = "client/src/components/ar-camera/ui/MindARScene.tsx"
    with open(scene_file, "r", encoding="utf-8") as f:
        scene_content = f.read()
        
    report["target_loading_mode"] = "Combined single .mind file" if "cards.mind" in scene_content else "Per-card .mind files"
    report["imageTargetSrc"] = "/ar-targets/cards.mind"
    report["mindar_image_attributes"] = (
        "imageTargetSrc: /ar-targets/cards.mind; maxTrack: 1; autoStart: false; "
        "filterMinCF: 0.0001; filterBeta: 10; uiLoading: no; uiScanning: no; uiError: no"
    )
    
    # 2. Inspect targetMap.json
    target_map_file = "client/src/data/targetMap.json"
    with open(target_map_file, "r", encoding="utf-8") as f:
        target_map = json.load(f)
    report["num_targets"] = len(target_map)
    
    # 3. Inspect existing images in client/public/cards
    cards_dir = "client/public/cards"
    existing_cards = [f for f in os.listdir(cards_dir) if f.endswith(".png")]
    report["compiled_source_images_count"] = len(existing_cards)
    
    sizes = {}
    aspect_ratios = {}
    for img_name in existing_cards:
        im_path = os.path.join(cards_dir, img_name)
        with Image.open(im_path) as im:
            w, h = im.size
            sizes[f"{w}x{h}"] = sizes.get(f"{w}x{h}", 0) + 1
            ar = round(w / h, 3)
            aspect_ratios[ar] = aspect_ratios.get(ar, 0) + 1
            
    report["size_distribution"] = sizes
    report["aspect_ratio_distribution"] = aspect_ratios
    
    # 4. Mind file size
    mind_file = "client/public/ar-targets/cards.mind"
    if os.path.exists(mind_file):
        report["cards_mind_bytes"] = os.path.getsize(mind_file)
        report["cards_mind_mb"] = round(os.path.getsize(mind_file) / (1024 * 1024), 2)
        
    print(json.dumps(report, indent=2))
    return report

if __name__ == "__main__":
    inspect_current_setup()

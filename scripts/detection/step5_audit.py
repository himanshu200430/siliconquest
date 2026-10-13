"""
Step 5: Feature Audit
Analyzes feature-point counts and 4x4 grid spatial coverage for all 99 targets.
Flags the lowest 15% by count and targets with poor spatial coverage (< 75%).
"""

import json
import os

AUDIT_STATS_PATH = "scripts/detection/feature_audit_v1.json"
CARDS_JSON_PATH = "scripts/cards.json"
OUTPUT_REPORT_PATH = "scripts/detection/audit_report_v1.json"

def run_feature_audit():
    with open(AUDIT_STATS_PATH, "r", encoding="utf-8") as f:
        stats = json.load(f)
        
    with open(CARDS_JSON_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)
        
    card_by_id = {c["id"]: c for c in cards}
    
    audit_results = []
    
    for item in stats:
        cid = item["cardId"]
        card = card_by_id.get(cid, {})
        tw = item["targetWidth"]
        th = item["targetHeight"]
        
        pts = item.get("points", [])
        total_pts = item["totalFeaturePoints"]
        
        # 4x4 Grid Spatial Coverage
        # Cell row in 0..3, col in 0..3
        grid = [[0 for _ in range(4)] for _ in range(4)]
        
        for pt in pts:
            scale = pt.get("scale", 1.0)
            layer_w = tw * scale if scale > 0 else tw
            layer_h = th * scale if scale > 0 else th
            
            # Normalize x and y to [0, 1] across the image
            nx = pt["x"] / layer_w if layer_w > 0 else 0
            ny = pt["y"] / layer_h if layer_h > 0 else 0
            
            c = min(3, max(0, int(nx * 4)))
            r = min(3, max(0, int(ny * 4)))
            grid[r][c] += 1
            
        occupied_cells = sum(1 for r in range(4) for c in range(4) if grid[r][c] > 0)
        coverage_pct = round((occupied_cells / 16.0) * 100, 1)
        
        audit_results.append({
            "cardId": cid,
            "name": card.get("name", "Unknown"),
            "series": card.get("series", "Unknown"),
            "tier": card.get("tier", "Unknown"),
            "image": item["image"],
            "totalFeaturePoints": total_pts,
            "matchingPoints": item["matchingPoints"],
            "occupiedCells": occupied_cells,
            "totalCells": 16,
            "coveragePct": coverage_pct,
            "gridDistribution": grid
        })
        
    # Sort by total feature points ascending
    audit_results.sort(key=lambda x: x["totalFeaturePoints"])
    
    avg_pts = sum(x["totalFeaturePoints"] for x in audit_results) / len(audit_results)
    avg_coverage = sum(x["coveragePct"] for x in audit_results) / len(audit_results)
    
    # Lowest 15% by count (15 cards)
    cutoff_15pct = audit_results[:15]
    
    # Cards with poor spatial coverage (< 75% or < 12/16 cells)
    poor_coverage = [x for x in audit_results if x["occupiedCells"] < 12]
    
    print("\n================== STEP 5: FEATURE AUDIT SUMMARY ==================")
    print(f"Total targets analyzed: {len(audit_results)}")
    print(f"Average feature points per target: {avg_pts:.1f}")
    print(f"Average 4x4 spatial coverage: {avg_coverage:.1f}%")
    print(f"Min feature points: {audit_results[0]['name']} ({audit_results[0]['totalFeaturePoints']} pts, {audit_results[0]['coveragePct']}% coverage)")
    print(f"Max feature points: {audit_results[-1]['name']} ({audit_results[-1]['totalFeaturePoints']} pts, {audit_results[-1]['coveragePct']}% coverage)")
    
    print("\n--- LOWEST 15% BY FEATURE COUNT (15 WEAKEST CARDS) ---")
    for idx, card in enumerate(cutoff_15pct, 1):
        print(f"{idx:2d}. {card['name']} ({card['cardId']}, {card['series']}, {card['tier']}): "
              f"{card['totalFeaturePoints']} pts | Coverage: {card['occupiedCells']}/16 ({card['coveragePct']}%)")
              
    print("\n--- TARGETS WITH POOR SPATIAL COVERAGE (< 75%) ---")
    if poor_coverage:
        for card in poor_coverage:
            print(f"- {card['name']} ({card['cardId']}): {card['occupiedCells']}/16 cells ({card['coveragePct']}%)")
    else:
        print("None! All 99 cards achieved >= 75% spatial coverage.")
        
    print("===================================================================\n")
    
    report = {
        "totalTargets": len(audit_results),
        "avgFeaturePoints": round(avg_pts, 1),
        "avgCoveragePct": round(avg_coverage, 1),
        "lowest15Percent": cutoff_15pct,
        "poorCoverage": poor_coverage,
        "allTargets": audit_results
    }
    
    with open(OUTPUT_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"Detailed audit saved to {OUTPUT_REPORT_PATH}")
    return report

if __name__ == "__main__":
    run_feature_audit()

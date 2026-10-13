import json
import os

with open("scripts/compiler_stats.json", "r", encoding="utf-8") as f:
    stats = json.load(f)

with open("scripts/cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

card_by_id = {c["id"]: c for c in cards}

enriched = []
for s in stats:
    cid = s["cardId"]
    c = card_by_id.get(cid, {})
    enriched.append({
        "id": cid,
        "name": c.get("name", "Unknown"),
        "tier": c.get("tier", "Unknown"),
        "series": c.get("series", "Unknown"),
        "totalFeaturePoints": s["totalFeaturePoints"],
        "matchingPoints": s["matchingPoints"]
    })

# Sort by feature points ascending
enriched.sort(key=lambda x: x["totalFeaturePoints"])

print(f"Total targets analyzed: {len(enriched)}")
print(f"Average feature points: {sum(x['totalFeaturePoints'] for x in enriched) / len(enriched):.1f}")
print(f"Min feature points: {enriched[0]['name']} ({enriched[0]['totalFeaturePoints']})")
print(f"Max feature points: {enriched[-1]['name']} ({enriched[-1]['totalFeaturePoints']})")

print("\n--- LOWEST 10 FEATURE COUNT CARDS (Weakest Tracking) ---")
for x in enriched[:10]:
    print(f"- {x['name']} ({x['id']}, {x['series']}, {x['tier']}): {x['totalFeaturePoints']} feature points, {x['matchingPoints']} matching points")

print("\n--- HIGHEST 5 FEATURE COUNT CARDS ---")
for x in enriched[-5:]:
    print(f"- {x['name']} ({x['id']}, {x['series']}, {x['tier']}): {x['totalFeaturePoints']} feature points, {x['matchingPoints']} matching points")

# Check for potential visual confusions
# Group cards by series and look for similar compositions
series_map = {}
for x in enriched:
    series_map.setdefault(x["series"], []).append(x)

print("\n--- POTENTIALLY SIMILAR CARD PAIRS (Check Phone Test Checklist) ---")
print("1. Ben 10 Aliens with dark green/black textures: Cannonbolt, Upgrade, Grey Matter")
print("2. Pokemon with round pink silhouettes: Jigglypuff vs Ditto")
print("3. Dragon Ball characters with orange Gi: Goku vs Krillin")
print("4. Attack on Titan survey corps uniforms: Jean vs Connie vs Sasha (similar uniform and posture)")

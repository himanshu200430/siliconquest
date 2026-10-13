import json
import os
import shutil

# Load cards.json
with open("scripts/cards.json", "r", encoding="utf-8") as f:
    cards_data = json.load(f)

# Load pdf inventory
with open("scripts/pdf_card_inventory.json", "r", encoding="utf-8") as f:
    pdf_inventory = json.load(f)

print(f"Cards in cards.json: {len(cards_data)}")
print(f"Cards in PDF inventory: {len(pdf_inventory)}")

# Map from PDF printed/canonical name to cards.json card
name_to_card = {}
slug_to_card = {}
for c in cards_data:
    name_to_card[c["name"].lower().strip()] = c
    slug = os.path.basename(c["image"])
    slug_to_card[slug] = c

# Typo and variant mapping from PDF to cards.json name
PDF_NAME_MAP = {
    "mewtwo": "mewtwo",
    "alien x": "alien x",
    "muzan": "muzan",
    "beerus": "beerus",
    "goku": "goku",
    "satoru gojo": "satoru gojo",
    "eren": "eren",
    "hornet": "hornet",
    "madara": "madara",
    "erwin": "erwin",
    "broly": "broly",
    "charizard": "charizard",
    "reiner": "reiner",
    "itadori": "itadori",
    "gohan": "gohan",
    "rengoku": "rengoku",
    "whis": "whis",
    "yuta": "yuta",
    "sukuna": "sukuna",
    "giyu": "giyu",
    "freiza": "frieza",
    "gengar": "gengar",
    "vegeta": "vegeta",
    "mikasa": "mikasa",
    "four arms": "four arms",
    "xlrs": "xlr8",
    "armin": "armin",
    "diamondhead": "diamondhead",
    "megumi": "megumi",
    "heatblast": "heatblast",
    "snorlax": "snorlax",
    "tanjiro": "tanjiro",
    "pikachu": "pikachu",
    "nobara": "nobara",
    "nezuko": "nezuko",
    "falco": "falco",
    "machamp": "machamp",
    "alakazam": "alakazam",
    "bulbasaur": "bulbasaur",
    "geodude": "geodude",
    "porygon": "porygon",
    "ditto": "ditto",
    "stinkfly": "stinkfly",
    "ghostfreak": "ghostfreak",
    "wildbutt": "wildmutt",
    "zenitsu": "zenitsu",
    "inosuke": "inosuke",
    "gyutaro": "gyutaro",
    "android 18": "android 18",
    "cell": "cell",
    "majin buu": "majin buu",
    "todo": "todo",
    "geto": "geto",
    "mahito": "mahito",
    "squirtle": "squirtle",
    "eevee": "eevee",
    "magikarp": "magikarp",
    "grey matter": "grey matter",
    "upgrade": "upgrade",
    "way big": "way big",
    "cannonbolt": "cannonbolt",
    "echo": "echo",
    "shinobu": "shinobu",
    "jigglypuff": "jigglypuff",
    "meowth": "meowth",
    "psyduck": "psyduck",
    "swampfire": "swamp fire",
    "humangasaur": "humungousaur",
    "ripjaws": "ripjaws",
    "uzui": "uzui",
    "akaza": "akaza",
    "doma": "doma",
    "haganezuka": "haganezuka",
    "picollo": "piccolo",
    "trunks": "trunks",
    "satan": "satan",
    "shenron": "shenron",
    "nanami": "nanami",
    "jogo": "jogo",
    "hanami": "hanami",
    "choso": "choso",
    "daki": "daki",
    "kanao": "kanao",
    "genya": "genya",
    "krillin": "krillin",
    "roshi": "roshi",
    "bulma": "bulma",
    "panda": "panda",
    "toge": "toge",
    "maki": "maki",
    "hange": "hange",
    "zeke": "zeke",
    "annie": "annie",
    "gabi": "gabi",
    "reiss": "reiss",
    "pieck": "pieck",
    "sasha": "sasha",
    "jean": "jean",
    "connie": "connie",
}

matched_count = 0
tier_matches = {"Legendary": 0, "Rare": 0, "Common": 0}
mismatches = []
copied_files = []

for pdf_card in pdf_inventory:
    printed_name = pdf_card["name_printed"].lower().strip()
    target_name = PDF_NAME_MAP.get(printed_name, printed_name)
    
    if target_name not in name_to_card:
        mismatches.append(f"Unmatched: {pdf_card['name_printed']} -> {target_name}")
        continue
        
    db_card = name_to_card[target_name]
    
    # Check tier match
    if pdf_card["tier"] != db_card["tier"]:
        mismatches.append(f"Tier mismatch for {target_name}: PDF has {pdf_card['tier']}, DB has {db_card['tier']}")
    else:
        tier_matches[pdf_card["tier"]] += 1
        
    # Copy cropped card to slug path
    slug = os.path.basename(db_card["image"])
    src_path = os.path.join("client/public/cards", pdf_card["crop_file"])
    dst_path = os.path.join("client/public/cards", slug)
    
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        copied_files.append((slug, db_card["id"], db_card["tier"]))
        matched_count += 1
    else:
        mismatches.append(f"Source file missing: {src_path}")

print(f"\n--- MATCH RESULTS ---")
print(f"Matched: {matched_count} / {len(cards_data)}")
print(f"Tier counts: {tier_matches}")
if mismatches:
    print(f"Mismatches found ({len(mismatches)}):")
    for m in mismatches:
        print(f"  - {m}")
else:
    print("ALL 99 CARDS MATCHED PERFECTLY WITH 0 MISMATCHES!")

print(f"Sample copied files: {copied_files[:5]}")

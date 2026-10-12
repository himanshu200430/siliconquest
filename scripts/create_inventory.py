import json

CARDS_INVENTORY = [
    # Page 1 (All Legendary)
    {"page": 1, "pos": 1, "name_printed": "Mewtwo", "series_printed": "Pokemon", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 2, "name_printed": "Alien X", "series_printed": "Ben 10", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 3, "name_printed": "Muzan", "series_printed": "Demon Slayer", "tier": "Legendary", "border": "orange", "notes": "Shows real person photo (Michael Jackson) instead of anime character"},
    {"page": 1, "pos": 4, "name_printed": "Beerus", "series_printed": "Dragon Ball Z", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 5, "name_printed": "Goku", "series_printed": "Dragon Ball Z", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 6, "name_printed": "Satoru Gojo", "series_printed": "Jujutsu Kaisen", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 7, "name_printed": "Eren", "series_printed": "Attack on Titan", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 8, "name_printed": "Hornet", "series_printed": "Hollow Knight", "tier": "Legendary", "border": "orange"},
    {"page": 1, "pos": 9, "name_printed": "Madara", "series_printed": "Naruto", "tier": "Legendary", "border": "orange"},

    # Page 2 (All Rare)
    {"page": 2, "pos": 1, "name_printed": "Erwin", "series_printed": "Attack on Titan", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 2, "name_printed": "Broly", "series_printed": "DB", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 3, "name_printed": "Charizard", "series_printed": "Pokemon", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 4, "name_printed": "Reiner", "series_printed": "Attack on Titan", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 5, "name_printed": "Itadori", "series_printed": "JJK", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 6, "name_printed": "Gohan", "series_printed": "DB", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 7, "name_printed": "Rengoku", "series_printed": "Demon Slayer", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 8, "name_printed": "Whis", "series_printed": "DB", "tier": "Rare", "border": "silver"},
    {"page": 2, "pos": 9, "name_printed": "Yuta", "series_printed": "JJK", "tier": "Rare", "border": "silver"},

    # Page 3 (1 Legendary + 8 Rare)
    {"page": 3, "pos": 1, "name_printed": "Sukuna", "series_printed": "Jujutsu Kaisen", "tier": "Legendary", "border": "orange", "notes": "Legendary sitting among Rares on page 3"},
    {"page": 3, "pos": 2, "name_printed": "Giyu", "series_printed": "Demon Slayer", "tier": "Rare", "border": "silver"},
    {"page": 3, "pos": 3, "name_printed": "Freiza", "canonical_name": "Frieza", "series_printed": "DB", "tier": "Rare", "border": "silver", "typo": "Freiza -> Frieza"},
    {"page": 3, "pos": 4, "name_printed": "Gengar", "series_printed": "Pokemon", "tier": "Rare", "border": "silver"},
    {"page": 3, "pos": 5, "name_printed": "Vegeta", "series_printed": "DB", "tier": "Rare", "border": "silver"},
    {"page": 3, "pos": 6, "name_printed": "Mikasa", "series_printed": "Attack on Titan", "tier": "Rare", "border": "silver"},
    {"page": 3, "pos": 7, "name_printed": "Four Arms", "series_printed": "Ben 10", "tier": "Rare", "border": "silver"},
    {"page": 3, "pos": 8, "name_printed": "XLRS", "canonical_name": "XLR8", "series_printed": "Ben 10", "tier": "Rare", "border": "silver", "typo": "XLRS -> XLR8"},
    {"page": 3, "pos": 9, "name_printed": "Armin", "series_printed": "Attack on Titan", "tier": "Rare", "border": "silver"},

    # Page 4 (8 Rare + 1 Common)
    {"page": 4, "pos": 1, "name_printed": "Diamondhead", "series_printed": "Ben 10", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 2, "name_printed": "Megumi", "series_printed": "JJK", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 3, "name_printed": "Heatblast", "series_printed": "Ben 10", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 4, "name_printed": "Snorlax", "series_printed": "Pokemon", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 5, "name_printed": "Tanjiro", "series_printed": "Demon Slayer", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 6, "name_printed": "Pikachu", "series_printed": "Pokemon", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 7, "name_printed": "Nobara", "series_printed": "JJK", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 8, "name_printed": "Nezuko", "series_printed": "Demon Slayer", "tier": "Rare", "border": "silver"},
    {"page": 4, "pos": 9, "name_printed": "Falco", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},

    # Page 5 (All Common)
    {"page": 5, "pos": 1, "name_printed": "Machamp", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 2, "name_printed": "Alakazam", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 3, "name_printed": "Bulbasaur", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 4, "name_printed": "Geodude", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 5, "name_printed": "Porygon", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 6, "name_printed": "Ditto", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 7, "name_printed": "Stinkfly", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 8, "name_printed": "Ghostfreak", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 5, "pos": 9, "name_printed": "Wildbutt", "canonical_name": "Wildmutt", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple", "typo": "Wildbutt -> Wildmutt"},

    # Page 6 (All Common)
    {"page": 6, "pos": 1, "name_printed": "Zenitsu", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 2, "name_printed": "Inosuke", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 3, "name_printed": "Gyutaro", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 4, "name_printed": "Android 18", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 5, "name_printed": "Cell", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 6, "name_printed": "Majin Buu", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 7, "name_printed": "Todo", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 8, "name_printed": "Geto", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 6, "pos": 9, "name_printed": "Mahito", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},

    # Page 7 (All Common)
    {"page": 7, "pos": 1, "name_printed": "Squirtle", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 2, "name_printed": "Eevee", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 3, "name_printed": "Magikarp", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 4, "name_printed": "Grey Matter", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 5, "name_printed": "Upgrade", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 6, "name_printed": "Way Big", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 7, "name_printed": "Cannonbolt", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 8, "name_printed": "Echo", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 7, "pos": 9, "name_printed": "Shinobu", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},

    # Page 8 (All Common)
    {"page": 8, "pos": 1, "name_printed": "Jigglypuff", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 2, "name_printed": "Meowth", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 3, "name_printed": "Psyduck", "series_printed": "Pokemon", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 4, "name_printed": "Swampfire", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 5, "name_printed": "Humangasaur", "canonical_name": "Humungousaur", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple", "typo": "Humangasaur -> Humungousaur"},
    {"page": 8, "pos": 6, "name_printed": "Ripjaws", "series_printed": "Ben 10", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 7, "name_printed": "Uzui", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 8, "name_printed": "Akaza", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 8, "pos": 9, "name_printed": "Doma", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},

    # Page 9 (All Common)
    {"page": 9, "pos": 1, "name_printed": "Haganezuka", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 2, "name_printed": "Picollo", "canonical_name": "Piccolo", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple", "notes": "Labeled 'Demon Slayer' although it belongs to Dragon Ball", "typo": "Picollo -> Piccolo"},
    {"page": 9, "pos": 3, "name_printed": "Trunks", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 4, "name_printed": "Satan", "canonical_name": "Mr. Satan", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 5, "name_printed": "Shenron", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 6, "name_printed": "Nanami", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 7, "name_printed": "Jogo", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 8, "name_printed": "Hanami", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 9, "pos": 9, "name_printed": "Choso", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},

    # Page 10 (All Common)
    {"page": 10, "pos": 1, "name_printed": "Daki", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 2, "name_printed": "Kanao", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 3, "name_printed": "Genya", "series_printed": "Demon Slayer", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 4, "name_printed": "Krillin", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 5, "name_printed": "Roshi", "canonical_name": "Master Roshi", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 6, "name_printed": "Bulma", "series_printed": "DB", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 7, "name_printed": "Panda", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 8, "name_printed": "Toge", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},
    {"page": 10, "pos": 9, "name_printed": "Maki", "series_printed": "JJK", "tier": "Common", "border": "pink/purple"},

    # Page 11 (All Common)
    {"page": 11, "pos": 1, "name_printed": "Hange", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 2, "name_printed": "Zeke", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 3, "name_printed": "Annie", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 4, "name_printed": "Gabi", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 5, "name_printed": "Reiss", "canonical_name": "Historia Reiss", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 6, "name_printed": "Pieck", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 7, "name_printed": "Sasha", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 8, "name_printed": "Jean", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
    {"page": 11, "pos": 9, "name_printed": "Connie", "series_printed": "AOT", "tier": "Common", "border": "pink/purple"},
]

for idx, c in enumerate(CARDS_INVENTORY):
    c["card_number"] = idx + 1
    c["crop_file"] = f"card_{idx+1:02d}_p{c['page']}_{c['pos']}.png"

with open("scripts/pdf_card_inventory.json", "w", encoding="utf-8") as f:
    json.dump(CARDS_INVENTORY, f, indent=2)

legendary_count = sum(1 for c in CARDS_INVENTORY if c["tier"] == "Legendary")
rare_count = sum(1 for c in CARDS_INVENTORY if c["tier"] == "Rare")
common_count = sum(1 for c in CARDS_INVENTORY if c["tier"] == "Common")
total = len(CARDS_INVENTORY)

print(f"Total cards: {total}")
print(f"Legendary (orange border): {legendary_count}")
print(f"Rare (silver border): {rare_count}")
print(f"Common (pink/purple border): {common_count}")

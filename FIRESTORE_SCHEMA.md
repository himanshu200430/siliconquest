# Firestore Schema for AR Characters

## Required Fields for Each Character Document

Each document in the `cards` collection needs these fields:

### Core Fields (Already Present)
- `name`: string - Character name (e.g., "MewTwo", "Eren Yeager")
- `value`: number - Points awarded when caught
  - **50+ = Legendary** tier (gold/purple styling)
  - **20-49 = Rare** tier (pink styling)
  - **8-19 = Common** tier (blue styling)
- `isCaught`: boolean - Whether caught (default: `false`)
- `caughtByTeam`: string - Team ID or empty string `""`

### AR Detection Fields
- `mindFile`: string - **Just the filename** of the .mind file
  - Example: `"mewtwo.mind"` (NOT "/ar-targets/mewtwo.mind")
  - System automatically prepends `/ar-targets/` path
  - Each character should have its own unique .mind file

### Display Fields
- `tier`: string - Visual rarity tier: `"Common"`, `"Rare"`, or `"Legendary"`
  - **Can be auto-calculated from value**, but include it for consistency
  
- `image`: string - Emoji or icon for the character
  - Examples: `"⚔️"`, `"🔥"`, `"🦊"`, `"⚡"`

### Quiz Fields (for catching the character)
- `question`: string - Quiz question shown after detection
  - Example: `"What is 2 + 2?"`

- `options`: array of 4 strings - Answer choices
  - Example: `["1", "0", "3", "4"]`

- `correctAnswer`: number - Index of correct answer (0-3)
  - Example: `3` (for "4" in the above options)

### Optional Fields
- `modelUrl`: string (optional) - Path to 3D model file
  - Example: `"/ar-models/mewtwo.glb"` or empty string `""`

## Example Complete Document (char_004 - MewTwo)

```json
{
  "name": "MewTwo",
  "value": 50,
  "isCaught": false,
  "caughtByTeam": "",
  "mindFile": "mewtwo.mind",
  "tier": "Legendary",
  "image": "🦊",
  "question": "What is 2 + 2?",
  "options": ["1", "0", "3", "4"],
  "correctAnswer": 3,
  "modelUrl": ""
}
```

## Important Notes

### Mind File Storage
- Store all `.mind` files in: `client/public/ar-targets/`
- In Firestore, only store the filename: `"mewtwo.mind"`
- System automatically prepends `/ar-targets/` when loading

### One Character Per .mind File
- Each character needs its **own unique .mind file**
- Create .mind files at: https://hiukim.github.io/mind-ar-js-doc/tools/compile
- Upload the poster image for each character
- Download and save in `public/ar-targets/`

### Tier Calculation
Tier is auto-calculated from `value`:
- `value >= 50` → Legendary (gold/purple glow)
- `value >= 20` → Rare (pink glow)  
- `value < 20` → Common (blue glow)

## Setup Checklist

For each character:
1. ✅ Create poster image
2. ✅ Generate .mind file from poster
3. ✅ Save .mind file in `client/public/ar-targets/[name].mind`
4. ✅ Add Firestore document with all required fields
5. ✅ Test scanning in the app

## Testing

After setting up:
1. Select a team
2. Click pokeball to start AR camera
3. Point at poster
4. Character should be detected
5. Answer quiz to catch!

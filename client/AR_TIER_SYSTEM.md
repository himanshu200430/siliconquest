# AR Tier-Based Detection System

## Overview
The AR camera has been refactored from character-specific `.mind` files to a tier-based system that supports multiple characters per .mind file.

## Architecture

### Tier Configuration
Three tiers are now supported, each with its own `.mind` file:
- **Common** (`common.mind`) → Characters with ID prefix `c3` (value: 8)
- **Rare** (`rare.mind`) → Characters with ID prefix `c2` (value: 20)
- **Legendary** (`legendary.mind`) → Characters with ID prefix `c1` (value: 50)

### File Structure
```
public/ar-targets/
├── common.mind      # Multiple Common characters
├── rare.mind        # Multiple Rare characters
└── legendary.mind   # Multiple Legendary characters
```

### Character ID Mapping
Each character's Firestore ID determines its position in the .mind file:
- `c101`, `c102`, `c103` → Legendary targets (targetIndex 0, 1, 2)
- `c201`, `c202`, `c203` → Rare targets (targetIndex 0, 1, 2)
- `c301`, `c302`, `c303` → Common targets (targetIndex 0, 1, 2)

The targetIndex is **0-based** and sequential within each tier.

## Key Components

### 1. Types & Constants (`types.ts`)
```typescript
export const TIER_CONFIG = {
  Common: { mindFile: "common.mind", prefix: "c3", color: "#94a3b8" },
  Rare: { mindFile: "rare.mind", prefix: "c2", color: "#3b82f6" },
  Legendary: { mindFile: "legendary.mind", prefix: "c1", color: "#facc15" },
} as const;
```

**Helper Functions:**
- `getTargetIndexFromId(characterId)` – Extracts target index from ID (e.g., `"c205"` → `4`)
- `getCharacterIdFromTierAndIndex(tier, targetIndex)` – Builds ID from tier + index

### 2. Data Hook (`useARCharacters.ts`)
- Fetches all characters from Firestore
- Groups them by tier (`CharactersByTier`)
- Sorts each tier by ID to ensure correct targetIndex mapping

### 3. Scene Component (`MindARScene.tsx`)
- Receives `selectedTier` and `characters` for that tier
- Dynamically loads the tier's `.mind` file
- Creates `<a-entity mindar-image-target>` for each character with correct `targetIndex`

### 4. Camera Component (`ARCamera.tsx`)
- Provides tier selector dropdown (Common/Rare/Legendary)
- Maps detected `targetIndex` to correct character via `charactersMapRef`
- Registers target listeners with `registerTargetRef(characterId, targetIndex)`

## How Detection Works

1. **User selects tier** (e.g., "Rare")
2. **Scene loads** `rare.mind` with all Rare characters
3. **Target entities created** for `c201`, `c202`, `c203`, etc. with `targetIndex: 0`, `1`, `2`...
4. **When MindAR detects** target at index `1`:
   - Event fires: `targetFound` on entity with `targetIndex: 1`
   - ARCamera looks up character at `charactersByTier.Rare[1]` → `c202`
   - Displays overlay for `c202` character

## Creating New .mind Files

### Using MindAR Compiler
```bash
# Install MindAR CLI
npm install -g mind-ar

# Compile multiple images into one .mind file
mindar-image-target compile \
  --input c301.jpg c302.jpg c303.jpg \
  --output public/ar-targets/common.mind
```

**Important:** The order of input images determines the targetIndex:
- `c301.jpg` (first) → targetIndex 0
- `c302.jpg` (second) → targetIndex 1
- `c303.jpg` (third) → targetIndex 2

### Image Requirements
- **Size:** 480x640px or similar aspect ratio
- **Format:** JPG or PNG
- **Quality:** Clear, high-contrast features work best
- **Unique:** Each image should be visually distinct

## Firestore Schema Updates

### Cards Collection
- Remove `mindFile` field (no longer needed)
- Ensure `value` field is set to `8`, `20`, or `50`
- Characters are automatically grouped by tier based on `value`

### Example Character Document
```javascript
{
  id: "c201",           // Auto-generated based on value
  name: "Dragonite",
  value: 20,            // Determines tier (Rare)
  question: "What is 2 + 2?",
  options: ["3", "4", "5", "6"],
  correctAnswer: 1,
  image: "🐉",
  isCaught: false,
  caughtByTeam: "",
  modelUrl: ""          // Optional 3D model
}
```

## Testing Checklist

- [ ] Three `.mind` files exist in `public/ar-targets/`
- [ ] Each `.mind` file contains multiple targets
- [ ] Character IDs match tier prefixes (`c1xx`, `c2xx`, `c3xx`)
- [ ] Character IDs are sequential within each tier
- [ ] Tier selector switches between Common/Rare/Legendary
- [ ] Each target in a .mind file triggers detection
- [ ] Correct character overlay appears for each target
- [ ] Quiz appears and updates Firestore on correct answer

## Troubleshooting

### Character not detected
- Check `.mind` file exists for that tier
- Verify character ID follows prefix convention
- Ensure targetIndex matches character's position in sorted ID list
- Use good lighting and hold image steady

### Wrong character detected
- Characters must be sorted by ID within each tier
- Check character `value` matches expected tier (8/20/50)
- Verify `.mind` file was compiled in correct order

### Scene doesn't load
- Check browser console for MindAR errors
- Ensure `.mind` file path is correct
- Verify tier has at least one character in Firestore

export type Tier = "Common" | "Rare" | "Legendary";

export interface Character {
  id: string;
  name: string;
  image?: string;
  tier?: Tier; // Optional - calculated from value
  question: string;
  options: string[];
  correctAnswer: number;
  value: number;
  isCaught: boolean;
  caughtByTeam: string;
  modelUrl?: string;
}

// Helper to calculate tier from value
export const getTierFromValue = (value: number): Tier => {
  if (value >= 50) return "Legendary";
  if (value >= 20) return "Rare";
  return "Common";
};

// Tier configuration for AR detection
export const TIER_CONFIG = {
  Common: { mindFile: "common.mind", prefix: "c3", color: "#94a3b8" },
  Rare: { mindFile: "rare.mind", prefix: "c2", color: "#3b82f6" },
  Legendary: { mindFile: "legendary.mind", prefix: "c1", color: "#facc15" },
} as const;

// Extract target index from character ID (e.g., "c101" -> 1, "c205" -> 5)
export const getTargetIndexFromId = (characterId: string): number => {
  const numericPart = characterId.replace(/^c[123]0?/, "");
  return parseInt(numericPart, 10) - 1; // MindAR uses 0-based indexing
};

// Get character ID from tier and target index (e.g., Legendary + 0 -> "c101")
export const getCharacterIdFromTierAndIndex = (
  tier: Tier,
  targetIndex: number
): string => {
  const prefix = TIER_CONFIG[tier].prefix;
  const sequence = String(targetIndex + 1).padStart(2, "0");
  return `${prefix}${sequence}`;
};

export interface ARCameraProps {
  teamName: string;
  teamId: string;
  onClose: () => void;
  onCharacterCollected: (
    character: Pick<Character, "id" | "name" | "value"> & {
      image?: string;
      tier?: Tier;
    }
  ) => void;
}

export interface CharactersByTier {
  Common: Character[];
  Rare: Character[];
  Legendary: Character[];
}

export type ScriptResource = {
  src: string;
  fallbacks?: string[];
  optional?: boolean;
  key?: "animation-mixer" | string;
};

export type MindARSceneElement = HTMLElement & {
  components?: Record<string, { stop?: () => void }>;
};

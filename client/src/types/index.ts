export interface Team {
  id: string;
  teamName: string;
  score: number;
  cardsCaught: string[]; // Array of card IDs
}

export interface Card {
  id: string;
  name: string;
  value: number;
  tier?: 'Common' | 'Rare' | 'Legendary';
  image?: string;
  isCaught: boolean;
  caughtByTeam: string | null; // Team ID that caught this card
}

export interface Character {
  id: string;
  name: string;
  tier?: 'Common' | 'Rare' | 'Legendary'; // Optional - will be calculated from value if missing
  image?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  value: number; // Points awarded for catching
  isCaught: boolean;
  caughtByTeam: string; // Empty string if not caught, team ID if caught
  mindFile: string; // Just filename (e.g., "mewtwo.mind")
  modelUrl?: string; // Optional 3D model path
}

// Helper to calculate tier from value
export const getTierFromValue = (value: number): 'Common' | 'Rare' | 'Legendary' => {
  if (value >= 50) return 'Legendary';
  if (value >= 20) return 'Rare';
  return 'Common';
};

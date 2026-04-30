import { useEffect, useState } from "react";

import { getARCharacters } from "@/services/firestore";
import { Character, CharactersByTier, getTierFromValue } from "../types";

interface UseARCharactersResult {
  charactersByTier: CharactersByTier;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const loggedMissingCharacterIds = new Set<string>();

const validateCharacter = (char: unknown): char is Character => {
  if (!char || typeof char !== "object") {
    return false;
  }

  const requiredFields: Array<keyof Character> = [
    "id",
    "name",
    "question",
    "options",
    "correctAnswer",
    "value",
    "isCaught",
    "caughtByTeam",
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = (char as Record<string, unknown>)[field as string];
    if (field === "options") {
      return !Array.isArray(value) || (value as unknown[]).length === 0;
    }
    return value === undefined || value === null;
  });

  if (missingFields.length > 0) {
    const charObj = char as Record<string, unknown>;
    const identifier = String(charObj.id ?? charObj.name ?? JSON.stringify(char));
    if (!loggedMissingCharacterIds.has(identifier)) {
      loggedMissingCharacterIds.add(identifier);
      console.warn(
        `Character ${charObj.name || charObj.id || "(unknown)"} is missing required fields:`,
        missingFields.join(", ")
      );
    }
    return false;
  }

  return true;
};

export const useARCharacters = (): UseARCharactersResult => {
  const [charactersByTier, setCharactersByTier] = useState<CharactersByTier>({
    Common: [],
    Rare: [],
    Legendary: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getARCharacters();

      // Filter out invalid characters
      const validCharacters = data.filter(validateCharacter);

      if (validCharacters.length === 0 && data.length > 0) {
        setError(
          "No valid AR characters found. Please check Firestore schema. " +
            "See FIRESTORE_SCHEMA.md for required fields."
        );
      } else if (validCharacters.length < data.length) {
        console.warn(
          `${data.length - validCharacters.length} character(s) skipped due to missing fields`
        );
      }

      // Group characters by tier
      const grouped: CharactersByTier = {
        Common: [],
        Rare: [],
        Legendary: [],
      };

      validCharacters.forEach((char) => {
        const tier = char.tier || getTierFromValue(char.value);
        if (tier in grouped) {
          grouped[tier].push(char);
        }
      });

      // Sort each tier by ID to ensure correct target mapping
      Object.keys(grouped).forEach((tier) => {
        grouped[tier as keyof CharactersByTier].sort((a, b) =>
          a.id.localeCompare(b.id)
        );
      });

      setCharactersByTier(grouped);
    } catch (err) {
      console.error("Error fetching AR characters:", err);
      setError("Failed to load characters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  return {
    charactersByTier,
    loading,
    error,
    refetch: fetchCharacters,
  };
};

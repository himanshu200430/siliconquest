import { createElement, MutableRefObject, useMemo } from "react";
import { Character, MindARSceneElement, Tier } from "../types";
import targetMapData from "@/data/targetMap.json";

interface TargetMapEntry {
  id: string;
  name: string;
  series: string;
  tier: string;
  value: number;
  image: string;
}

const targetEntries: [string, TargetMapEntry][] = Object.entries(
  targetMapData as Record<string, TargetMapEntry>
);

interface MindARSceneProps {
  sceneRef: MutableRefObject<MindARSceneElement | null>;
  characters: Character[];
  animationMixerAvailable: boolean;
  registerTargetRef: (
    characterId: string,
    targetIndex: number
  ) => (el: Element | null) => void;
  selectedTier?: Tier;
}

export const MindARScene = ({
  sceneRef,
  characters,
  // animationMixerAvailable,
  registerTargetRef,
}: MindARSceneProps) => {
  // Option A: Single combined target file containing all 99 scannable cards
  const targetSrc = useMemo(() => "/ar-targets/cards.mind", []);

  // Map of 3D models if provided
  const modelMap = useMemo(() => {
    const map = new Map<string, string>();
    characters.forEach((char) => {
      if (char.modelUrl) {
        map.set(char.id, char.modelUrl);
      }
    });
    return map;
  }, [characters]);

  return createElement(
    "a-scene",
    {
      id: "mindar-scene-all",
      ref: sceneRef,
      // MindAR configured with maxTrack: 1 and cards.mind
      "mindar-image": `imageTargetSrc: ${targetSrc}; maxTrack: 1; autoStart: false; filterMinCF: 0.0001; filterBeta: 10; uiLoading: no; uiScanning: no; uiError: no`,
      "color-space": "sRGB",
      renderer:
        "colorManagement: true, physicallyCorrectLights: true, legacyLights: false",
      "vr-mode-ui": "enabled: false",
      "device-orientation-permission-ui": "enabled: false",
      embedded: true,
      className: "mindar-scene w-[100vw] h-[100vh]",
    },

    createElement(
      "a-assets",
      { timeout: 2000 },
      characters
        .filter((character) => !!character.modelUrl)
        .map(
          (character) =>
            character.modelUrl &&
            createElement("a-asset-item", {
              key: `asset-${character.id}`,
              id: `character-model-${character.id}`,
              src: character.modelUrl,
            })
        )
    ),

    // Camera element
    createElement("a-camera", {
      position: "0 0 0",
    }),
    createElement("a-entity", {
      light: "type: ambient; intensity: 1",
    }),
    createElement("a-entity", {
      light: "type: directional; intensity: 0.8",
      position: "0 1 0",
    }),

    // Dynamically render a target entity for all 99 cards from targetMap.json
    targetEntries.map(([indexStr, entry]) => {
      const targetIndex = parseInt(indexStr, 10);
      const modelUrl = modelMap.get(entry.id);

      return createElement(
        "a-entity",
        {
          key: entry.id,
          ref: registerTargetRef(entry.id, targetIndex),
          "mindar-image-target": `targetIndex: ${targetIndex}`,
        },
        modelUrl &&
          createElement("a-gltf-model", {
            src: `#character-model-${entry.id}`,
            position: "0 0 0",
            rotation: "60 0 0",
            scale: "1 1 1",
            "animation-mixer":
              "clip: pm0149_00_00_20001_battlewait01_loop; loop: repeat",
          })
      );
    })
  );
};

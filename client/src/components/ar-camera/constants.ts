import { ScriptResource } from "./types";

// AR_CHARACTERS are now fetched from Firestore via useARCharacters hook
// This ensures real-time sync with database for isCaught status

export const SCRIPT_RESOURCES: ScriptResource[] = [
  {
    src: "https://aframe.io/releases/1.5.0/aframe.min.js",
  },
  {
    src: "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
  },
];

// Dynamic TARGET_SRC - will be selected based on detected character's mindFile
// Each character in Firestore has a mindFile field (e.g., "/ar-targets/mewtwo.mind")

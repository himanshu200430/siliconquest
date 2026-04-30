import { useEffect, useState } from "react";

import { SCRIPT_RESOURCES } from "../constants";
import { loadScriptResource } from "../utils/scriptLoader";

interface MindARWindow extends Window {
  __mindarScriptsLoaded?: boolean;
  __mindarScriptsPromise?: Promise<void>;
  __mindarAnimationMixerAvailable?: boolean;
}

interface UseMindARScriptsResult {
  scriptsLoaded: boolean;
  animationMixerAvailable: boolean;
  arError: string | null;
  setARError: (value: string | null) => void;
}

export const useMindARScripts = (): UseMindARScriptsResult => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [animationMixerAvailable, setAnimationMixerAvailable] = useState(true);
  const [arError, setARError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isActive = true;

    const loadMindAR = async () => {
      try {
        const mindarWindow = window as MindARWindow;
        if (mindarWindow.__mindarScriptsLoaded) {
          if (isActive) setScriptsLoaded(true);
          return;
        }

        if (!mindarWindow.__mindarScriptsPromise) {
          mindarWindow.__mindarScriptsPromise = (async () => {
            let animationMixerSuccess = true;
            for (const resource of SCRIPT_RESOURCES) {
              const success = await loadScriptResource(resource);
              if (resource.key === "animation-mixer") {
                animationMixerSuccess = success;
              }
            }
            mindarWindow.__mindarAnimationMixerAvailable = animationMixerSuccess;
            mindarWindow.__mindarScriptsLoaded = true;
          })();
        }

        await mindarWindow.__mindarScriptsPromise;

        if (isActive) {
          const mixerAvailable =
            mindarWindow.__mindarAnimationMixerAvailable !== false;
          setAnimationMixerAvailable(mixerAvailable);
          setScriptsLoaded(true);
          setARError(null);
        }
      } catch (error) {
        console.error("Failed to load MindAR scripts", error);
        if (isActive) {
          setARError(
            "Unable to load AR libraries. Please refresh and try again."
          );
        }
      }
    };

    loadMindAR();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    scriptsLoaded,
    animationMixerAvailable,
    arError,
    setARError,
  };
};

import { ScriptResource } from "../types";

const loadedScripts = new Set<string>();

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }

    if (loadedScripts.has(src)) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        loadedScripts.add(src);
        resolve();
      } else {
        existing.addEventListener(
          "load",
          () => {
            loadedScripts.add(src);
            resolve();
          },
          { once: true }
        );
        existing.addEventListener(
          "error",
          () => reject(new Error(`Failed loading script ${src}`)),
          { once: true }
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed loading script ${src}`));
    document.head.appendChild(script);
  });

export const loadScriptResource = async (
  resource: ScriptResource
): Promise<boolean> => {
  const attempts = [resource.src, ...(resource.fallbacks ?? [])];
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      await loadScript(attempt);
      if (attempt !== resource.src) {
        console.warn(
          `[MindAR] Loaded fallback script for ${resource.src} from ${attempt}`
        );
      }
      return true;
    } catch (error) {
      lastError = error;
      console.error(`[MindAR] Failed loading script ${attempt}`, error);
    }
  }

  if (resource.optional) {
    console.warn(
      `[MindAR] Optional script ${resource.src} could not be loaded. Continuing without it.`
    );
    return false;
  }

  throw lastError ?? new Error(`Failed loading script ${resource.src}`);
};

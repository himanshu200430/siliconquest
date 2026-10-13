/**
 * Target Files Pre-Warmer for MindAR (.mind)
 * Preloads target files into browser HTTP cache so switching between tiers
 * resolves instantly from local cache without network delays.
 */

export const TARGET_FILES = [
  "/ar-targets/common.mind",
  "/ar-targets/rare.mind",
  "/ar-targets/legendary.mind",
];

let isPreloaded = false;

export const initTargetCache = () => {
  if (typeof window === "undefined" || isPreloaded) return;
  isPreloaded = true;

  const preloadTargets = () => {
    TARGET_FILES.forEach((targetPath) => {
      fetch(targetPath, { cache: "force-cache" }).catch(() => {});
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadTargets);
  } else {
    setTimeout(preloadTargets, 200);
  }
};

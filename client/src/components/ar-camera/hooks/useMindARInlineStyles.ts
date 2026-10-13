import { useEffect } from "react";

export const useMindARInlineStyles = (scriptsLoaded: boolean) => {
  useEffect(() => {
    if (!scriptsLoaded || typeof document === "undefined") return;

    let style = document.getElementById("mindar-inline-style") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mindar-inline-style";
      document.head.appendChild(style);
    }

    style.innerHTML = `
      .mindar-ui-overlay {
        display: none !important;
      }

      video {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        object-fit: cover !important;
        z-index: 42 !important;
      }

      .mindar-scene, a-scene {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 44 !important;
        background: transparent !important;
      }

      .a-canvas {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 44 !important;
        background: transparent !important;
      }
    `;
  }, [scriptsLoaded]);
};

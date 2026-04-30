import { useEffect } from "react";

export const useMindARInlineStyles = (scriptsLoaded: boolean) => {
  useEffect(() => {
    if (!scriptsLoaded || typeof document === "undefined") return;

    if (document.getElementById("mindar-inline-style")) return;

    const style = document.createElement("style");
    style.id = "mindar-inline-style";
    style.innerHTML = `
      .mindar-scene {
        width: 100%;
        height: 100%;
      }

      .mindar-ui-overlay {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }, [scriptsLoaded]);
};

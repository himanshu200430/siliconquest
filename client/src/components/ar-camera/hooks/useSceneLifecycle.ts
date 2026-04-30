import { MutableRefObject, useEffect } from "react";

import { MindARSceneElement } from "../types";

export const useSceneLifecycle = (
  sceneRef: MutableRefObject<MindARSceneElement | null>,
  scriptsLoaded: boolean,
  onReady: () => void,
  onError: (message: string) => void
) => {
  useEffect(() => {
    if (!scriptsLoaded) return;

    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    const disableInteractionComponents = () => {
      if (!sceneEl) return;
      sceneEl.removeAttribute("xr-mode-ui");
      const cameraEl = sceneEl.querySelector("[camera]");
      cameraEl?.removeAttribute("look-controls");
      cameraEl?.removeAttribute("wasd-controls");
    };

    const assignCamera = (cameraEl: Element | null | undefined) => {
      if (!cameraEl) return;
      const objectCamera = (cameraEl as { getObject3D?: (type: string) => unknown })?.getObject3D?.("camera");
      if (objectCamera) {
        (sceneEl as MindARSceneElement & { camera?: unknown }).camera = objectCamera;
      }
    };

    const handleLoaded = () => {
      disableInteractionComponents();
      assignCamera(sceneEl.querySelector("[camera]"));
      onReady();
    };

    const handleArReady = () => {
      disableInteractionComponents();
      assignCamera(sceneEl.querySelector("[camera]"));
      onReady();
    };

    const handleArError = (event: Event) => {
      console.error("MindAR arError", event);
      onError(
        "AR session couldn't start. Please check camera permissions and try again."
      );
    };

    const handleCameraSetActive = (event: Event) => {
      const detail = (event as CustomEvent<{ cameraEl?: Element }>).detail;
      if (detail?.cameraEl) {
        assignCamera(detail.cameraEl);
        disableInteractionComponents();
      }
    };

    sceneEl.addEventListener("loaded", handleLoaded);
    sceneEl.addEventListener("arReady", handleArReady);
    sceneEl.addEventListener("arError", handleArError);
    sceneEl.addEventListener("camera-set-active", handleCameraSetActive);

    return () => {
      sceneEl.removeEventListener("loaded", handleLoaded);
      sceneEl.removeEventListener("arReady", handleArReady);
      sceneEl.removeEventListener("arError", handleArError);
      sceneEl.removeEventListener("camera-set-active", handleCameraSetActive);
    };
  }, [scriptsLoaded, sceneRef, onReady, onError]);
};

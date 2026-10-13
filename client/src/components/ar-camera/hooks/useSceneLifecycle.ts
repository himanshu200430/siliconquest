import { MutableRefObject, useEffect } from "react";

import { MindARSceneElement, Tier } from "../types";
import { stopAllCameraStreams } from "../utils/cameraStreamHelper";

export const useSceneLifecycle = (
  sceneRef: MutableRefObject<MindARSceneElement | null>,
  scriptsLoaded: boolean,
  onReady: () => void,
  onError: (message: string) => void,
  selectedTier?: Tier,
  onCameraLive?: () => void,
  retryTrigger?: number
) => {
  useEffect(() => {
    if (!scriptsLoaded || typeof document === "undefined") return;

    let isMounted = true;
    let cleanupListeners: (() => void) | null = null;
    let readyCheckInterval: NodeJS.Timeout | null = null;
    let startArTimeout: NodeJS.Timeout | null = null;
    let isStarting = false;
    let arStarted = false;

    const setupScene = () => {
      const sceneEl =
        (document.getElementById("mindar-scene-all") as MindARSceneElement | null) ||
        (selectedTier ? (document.getElementById(`mindar-scene-${selectedTier}`) as MindARSceneElement | null) : null) ||
        sceneRef.current ||
        (document.querySelector("a-scene") as MindARSceneElement | null);

      if (!sceneEl) return false;

      const disableInteractionComponents = () => {
        try {
          sceneEl.removeAttribute("xr-mode-ui");
          const cameraEl = sceneEl.querySelector("[camera]");
          cameraEl?.removeAttribute("look-controls");
          cameraEl?.removeAttribute("wasd-controls");
        } catch (e) {
          console.warn("Could not disable interaction components", e);
        }
      };

      const assignCamera = (cameraEl: Element | null | undefined) => {
        if (!cameraEl) return;
        const objectCamera = (
          cameraEl as { getObject3D?: (type: string) => unknown }
        )?.getObject3D?.("camera");
        if (objectCamera) {
          (sceneEl as MindARSceneElement & { camera?: unknown }).camera =
            objectCamera;
        }
      };

      let startAttempts = 0;

      const startAR = async () => {
        // Atomic gate: prevent multiple concurrent start attempts
        if (arStarted || isStarting || !isMounted) return;
        isStarting = true;

        const tryStart = async () => {
          if (!isMounted) {
            isStarting = false;
            return;
          }

          const systems = (sceneEl as unknown as {
            systems?: Record<
              string,
              { start?: () => Promise<void>; video?: HTMLVideoElement }
            >;
          }).systems;
          const arSystem = systems?.["mindar-image-system"];

          if (arSystem && typeof arSystem.start === "function") {
            if (arSystem.video) {
              // Video already spawned by MindAR system
              arStarted = true;
              isStarting = false;
              return;
            }

            arStarted = true;
            isStarting = false;
            try {
              await arSystem.start();
            } catch (err: unknown) {
              console.error("MindAR start error:", err);
              arStarted = false;
              const e = err as { message?: string };
              if (isMounted) {
                onError(
                  e?.message ||
                    "Failed to start camera feed. Please ensure camera permissions are granted."
                );
              }
            }
          } else if (startAttempts < 50) {
            startAttempts++;
            startArTimeout = setTimeout(tryStart, 100);
          } else {
            isStarting = false;
            console.warn("MindAR system not ready after retries");
          }
        };

        await tryStart();
      };

      const handleArReady = () => {
        disableInteractionComponents();
        assignCamera(sceneEl.querySelector("[camera]"));
        if (isMounted) {
          onReady();
        }
      };

      const handleLoaded = () => {
        disableInteractionComponents();
        assignCamera(sceneEl.querySelector("[camera]"));
        startAR();
      };

      const handleArError = (event: Event) => {
        if (!isMounted) return;
        isStarting = false;
        arStarted = false;
        console.error("MindAR arError event:", event);
        const customEvent = event as CustomEvent<{ error?: unknown }>;
        const detailError =
          customEvent?.detail?.error || (customEvent?.detail as unknown);
        let errorMsg =
          "Camera access denied or unavailable. Please enable camera permissions in your browser.";

        if (window.isSecureContext === false) {
          errorMsg =
            "Camera requires HTTPS or localhost. Browsers block camera access over insecure HTTP.";
        } else if (
          detailError === "VIDEO_FAIL" ||
          (typeof detailError === "object" && (detailError as Record<string, unknown>)?.error === "VIDEO_FAIL")
        ) {
          errorMsg =
            "Camera video source could not be opened. Please ensure camera permission is allowed and no other app is using your webcam.";
        } else if (detailError && typeof detailError === "object") {
          const errObj = detailError as { name?: string; message?: string };
          if (
            errObj.name === "NotAllowedError" ||
            errObj.name === "PermissionDeniedError"
          ) {
            errorMsg =
              "Camera permission was denied. Please allow camera access in your browser settings and try again.";
          } else if (
            errObj.name === "NotFoundError" ||
            errObj.name === "DevicesNotFoundError"
          ) {
            errorMsg = "No camera found on this device.";
          } else if (
            errObj.name === "NotReadableError" ||
            errObj.name === "TrackStartError"
          ) {
            errorMsg =
              "Camera is already in use by another app or tab. Please close other camera apps.";
          } else if (errObj.name === "AbortError") {
            errorMsg =
              "Camera initialization timed out. Please click Retry to reconnect.";
          } else if (errObj.message) {
            errorMsg = `Camera error: ${errObj.message}`;
          }
        }

        if (isMounted) {
          onError(errorMsg);
        }
      };

      const handleCameraSetActive = (event: Event) => {
        const detail = (event as CustomEvent<{ cameraEl?: Element }>).detail;
        if (detail?.cameraEl) {
          assignCamera(detail.cameraEl);
          disableInteractionComponents();
        }
      };

      sceneEl.addEventListener("arReady", handleArReady);
      sceneEl.addEventListener("arError", handleArError);
      sceneEl.addEventListener("camera-set-active", handleCameraSetActive);
      sceneEl.addEventListener("renderstart", startAR, { once: true });

      // Check if scene has already loaded
      if ((sceneEl as unknown as { hasLoaded?: boolean }).hasLoaded) {
        handleLoaded();
      } else {
        sceneEl.addEventListener("loaded", handleLoaded, { once: true });
      }

      // Video monitoring: Detect when camera frames arrive and ensure active playback
      let cameraLiveDispatched = false;
      readyCheckInterval = setInterval(() => {
        if (!isMounted) return;
        const videoEl =
          (sceneEl.parentNode as HTMLElement | null)?.querySelector("video") ||
          document.querySelector("video");

        if (videoEl) {
          // If video element exists but paused, trigger play
          if (videoEl.paused && videoEl.readyState >= 1) {
            videoEl.play().catch(() => {});
          }

          if (videoEl.readyState >= 2) {
            if (!cameraLiveDispatched) {
              cameraLiveDispatched = true;
              onCameraLive?.();
            }
            if (!videoEl.paused) {
              handleArReady();
              if (readyCheckInterval) {
                clearInterval(readyCheckInterval);
                readyCheckInterval = null;
              }
            }
          }
        }
      }, 200);

      cleanupListeners = () => {
        isMounted = false;
        isStarting = false;
        arStarted = false;
        if (startArTimeout) {
          clearTimeout(startArTimeout);
          startArTimeout = null;
        }
        if (readyCheckInterval) {
          clearInterval(readyCheckInterval);
          readyCheckInterval = null;
        }
        sceneEl.removeEventListener("loaded", handleLoaded);
        sceneEl.removeEventListener("renderstart", startAR);
        sceneEl.removeEventListener("arReady", handleArReady);
        sceneEl.removeEventListener("arError", handleArError);
        sceneEl.removeEventListener("camera-set-active", handleCameraSetActive);

        // Safely stop MindAR system without null-dereference
        try {
          const systems = (sceneEl as unknown as {
            systems?: Record<
              string,
              { stop?: () => void; video?: HTMLVideoElement }
            >;
          }).systems;
          const arSystem = systems?.["mindar-image-system"];
          if (arSystem && typeof arSystem.stop === "function") {
            if (arSystem.video && !arSystem.video.srcObject) {
              arSystem.video.srcObject = new MediaStream();
            }
            arSystem.stop();
          }
        } catch (e) {
          console.warn("Error stopping AR system", e);
        }

        // Cleanly stop any orphaned media tracks and enforce driver release buffer
        stopAllCameraStreams();
      };

      return true;
    };

    // If sceneEl is not in DOM immediately, retry briefly until mounted
    if (!setupScene()) {
      const interval = setInterval(() => {
        if (setupScene()) {
          clearInterval(interval);
        }
      }, 100);
      return () => {
        isMounted = false;
        clearInterval(interval);
        if (readyCheckInterval) clearInterval(readyCheckInterval);
        if (startArTimeout) clearTimeout(startArTimeout);
        if (cleanupListeners) cleanupListeners();
      };
    }

    return () => {
      isMounted = false;
      if (readyCheckInterval) clearInterval(readyCheckInterval);
      if (startArTimeout) clearTimeout(startArTimeout);
      if (cleanupListeners) cleanupListeners();
    };
  }, [scriptsLoaded, sceneRef, onReady, onError, selectedTier, onCameraLive, retryTrigger]);
};

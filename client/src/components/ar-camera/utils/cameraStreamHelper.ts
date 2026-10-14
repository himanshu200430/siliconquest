/**
 * cameraStreamHelper.ts
 *
 * Robust camera stream management for MindAR across mobile devices,
 * laptops, and Windows OS webcam drivers.
 *
 * Fixes:
 * 1. Mutual exclusion: ensures only one getUserMedia request is in flight at a time.
 * 2. Hardware cooldown buffer: enforces a minimum 350ms delay between stopping a camera track
 *    and requesting a new one, preventing Windows Media Foundation TrackStartError / NotReadableError.
 * 3. Graceful constraints fallback:
 *    Attempt 1: facingMode: { ideal: "environment" } (mobile rear camera preferred, laptop webcam accepted)
 *    Attempt 2: { video: true, audio: false } (fallback for browsers/drivers rejecting facingMode)
 *    Attempt 3: retry with delay (for transient driver locks)
 * 4. Immediate error propagation for permission denial (NotAllowedError / PermissionDeniedError).
 * 5. Clean teardown and video element cleanup.
 */

interface WrappedMediaDevices extends MediaDevices {
  __siliconQuestWrapped?: boolean;
}

let activeTracks: MediaStreamTrack[] = [];
let lastHardwareReleaseTime = 0;
let acquisitionLock: Promise<MediaStream> | null = null;
const HARDWARE_COOLDOWN_MS = 350;

const isMobileDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const hasTouch = (navigator.maxTouchPoints || 0) > 1;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return isMobileUA || (hasTouch && !("MSStream" in (window as unknown as Record<string, unknown>)));
};

export function initCameraStreamNormalizer() {
  if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
    return;
  }

  const mediaDevices = navigator.mediaDevices as WrappedMediaDevices;
  if (mediaDevices.__siliconQuestWrapped) {
    return;
  }

  // Ensure webcam tracks are immediately freed on tab close or page navigation
  window.addEventListener("beforeunload", () => {
    stopAllCameraStreams();
  });
  window.addEventListener("pagehide", () => {
    stopAllCameraStreams();
  });

  const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);

  mediaDevices.getUserMedia = async function (
    _constraints?: MediaStreamConstraints
  ): Promise<MediaStream> {
    // If another acquisition is currently running, wait for it
    while (acquisitionLock) {
      try {
        await acquisitionLock;
      } catch {
        // previous acquisition finished (even with error), proceed to our turn
      }
    }

    const runAcquisition = async (): Promise<MediaStream> => {
      // 1. If any previous stream tracks are still active, stop them cleanly
      if (activeTracks.length > 0) {
        activeTracks.forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        activeTracks = [];
        lastHardwareReleaseTime = Date.now();
      }

      // 2. Enforce hardware cooldown to prevent Windows driver mutex collision
      const elapsedSinceRelease = Date.now() - lastHardwareReleaseTime;
      if (elapsedSinceRelease < HARDWARE_COOLDOWN_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, HARDWARE_COOLDOWN_MS - elapsedSinceRelease)
        );
      }

      // 3. Normalize constraints:
      // MindAR requests { audio: false, video: { facingMode: "environment" } }
      // On laptops / PCs, requesting facingMode: "environment" triggers Chrome on Windows
      // to look for an auxiliary/rear camera, frequently grabbing the Windows Hello IR camera
      // which produces no RGB frames and causes "AbortError: Timeout starting video source".
      // Therefore, on desktop/laptops, we normalize to generic video without facingMode or resolution locks.
      const isMobile = isMobileDevice();

      let targetConstraints: MediaStreamConstraints;
      if (isMobile) {
        targetConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
      } else {
        // On desktop / laptop, request standard video without facingMode or resolution constraints
        targetConstraints = {
          audio: false,
          video: true,
        };
      }

      const invokeGetUserMediaWithTimeout = (
        c: MediaStreamConstraints,
        timeoutMs = 5000
      ): Promise<MediaStream> => {
        return new Promise<MediaStream>((resolve, reject) => {
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              const timeoutErr = new Error(
                "Timeout starting video source (hardware took too long to deliver frames)"
              );
              timeoutErr.name = "AbortError";
              reject(timeoutErr);
            }
          }, timeoutMs);

          originalGetUserMedia(c)
            .then((stream) => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                resolve(stream);
              } else {
                // If timed out previously, release tracks immediately
                stream.getTracks().forEach((t) => {
                  try {
                    t.stop();
                  } catch {}
                });
              }
            })
            .catch((err) => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                reject(err);
              }
            });
        });
      };

      // Attempt 1: Requested or normalized constraints
      try {
        const stream = await invokeGetUserMediaWithTimeout(targetConstraints, 5000);
        registerStreamTracks(stream);
        return stream;
      } catch (err: unknown) {
        const errObj = err as { name?: string; message?: string };

        // If user actively denied permission, rethrow immediately
        if (
          errObj?.name === "NotAllowedError" ||
          errObj?.name === "PermissionDeniedError"
        ) {
          throw err;
        }

        console.warn(
          "Primary getUserMedia failed (" +
            (errObj?.name || "Unknown") +
            "), attempting generic video fallback..."
        );

        // Hardware driver cooldown before retry
        lastHardwareReleaseTime = Date.now();
        await new Promise((resolve) =>
          setTimeout(resolve, HARDWARE_COOLDOWN_MS)
        );

        // Attempt 2: Minimal fallback without any constraints
        try {
          const fallbackStream = await invokeGetUserMediaWithTimeout(
            { video: true, audio: false },
            5000
          );
          registerStreamTracks(fallbackStream);
          return fallbackStream;
        } catch (fallbackErr: unknown) {
          const fbErrObj = fallbackErr as { name?: string };
          if (
            fbErrObj?.name === "NotAllowedError" ||
            fbErrObj?.name === "PermissionDeniedError"
          ) {
            throw fallbackErr;
          }

          console.warn("Secondary getUserMedia failed, making final retry after cooldown...");
          // Attempt 3: Final retry after cooldown (for laggy Windows webcam drivers)
          await new Promise((resolve) => setTimeout(resolve, 500));
          try {
            const finalStream = await invokeGetUserMediaWithTimeout(
              { video: true, audio: false },
              6000
            );
            registerStreamTracks(finalStream);
            return finalStream;
          } catch (finalErr) {
            console.error("All getUserMedia attempts failed:", finalErr);
            throw finalErr;
          }
        }
      }
    };

    acquisitionLock = runAcquisition();
    try {
      const result = await acquisitionLock;
      return result;
    } finally {
      acquisitionLock = null;
    }
  };

  mediaDevices.__siliconQuestWrapped = true;
}

function registerStreamTracks(stream: MediaStream) {
  const tracks = stream.getVideoTracks();
  activeTracks = [...tracks];

  tracks.forEach((track) => {
    track.addEventListener("ended", () => {
      activeTracks = activeTracks.filter((t) => t !== track);
      lastHardwareReleaseTime = Date.now();
    });
  });
}

/**
 * Cleanly stops all webcam tracks and detaches video elements.
 */
export function stopAllCameraStreams() {
  if (typeof window === "undefined") return;

  activeTracks.forEach((track) => {
    try {
      track.stop();
    } catch {}
  });
  activeTracks = [];
  lastHardwareReleaseTime = Date.now();

  if (typeof document !== "undefined") {
    document.querySelectorAll("video").forEach((video) => {
      const stream = video.srcObject as MediaStream | null;
      if (stream && typeof stream.getTracks === "function") {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        video.srcObject = null;
      }
      try {
        video.remove();
      } catch {}
    });
  }
}

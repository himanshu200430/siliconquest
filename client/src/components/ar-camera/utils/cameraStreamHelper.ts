/**
 * cameraStreamHelper.ts
 *
 * Robust camera stream management for MindAR across mobile devices,
 * laptops, and Windows OS webcam drivers.
 *
 * Fixes:
 * 1. OverconstrainedError / NotFoundError on laptops/desktops lacking rear camera (facingMode: "environment").
 * 2. Windows TrackStartError / NotReadableError hardware mutex collision when switching scenes or reopening.
 * 3. Clean teardown and hardware release.
 */

interface WrappedMediaDevices extends MediaDevices {
  __siliconQuestWrapped?: boolean;
}

let activeTracks: MediaStreamTrack[] = [];

export function initCameraStreamNormalizer() {
  if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
    return;
  }

  const mediaDevices = navigator.mediaDevices as WrappedMediaDevices;
  if (mediaDevices.__siliconQuestWrapped) {
    return;
  }

  const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);

  mediaDevices.getUserMedia = async function (
    constraints?: MediaStreamConstraints
  ): Promise<MediaStream> {
    // 1. If any previous stream tracks are still active, stop them cleanly first
    if (activeTracks.length > 0) {
      activeTracks.forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      activeTracks = [];
      // 150ms buffer for Windows / OS webcam driver to release hardware lock
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // 2. Check available video devices
    // On laptops/desktops with a single camera, requesting facingMode: "environment"
    // causes Windows driver searching hangs resulting in "Timeout starting video source" (AbortError).
    let targetConstraints = constraints;
    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        if (videoInputs.length <= 1) {
          targetConstraints = { video: true, audio: false };
        }
      }
    } catch {
      // Continue with original constraints if enumeration fails
    }

    const fetchStream = (c?: MediaStreamConstraints, timeoutMs = 3000) => {
      return new Promise<MediaStream>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Timeout starting video source"));
          }
        }, timeoutMs);

        originalGetUserMedia(c)
          .then((stream) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(stream);
            } else {
              stream.getTracks().forEach((t) => t.stop());
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

    try {
      // 3. Attempt primary target constraints with 3s timeout
      const stream = await fetchStream(targetConstraints, 3000);
      registerStreamTracks(stream);
      return stream;
    } catch (err: unknown) {
      console.warn("Primary getUserMedia failed, attempting fallback:", err);

      // Buffer to release hardware lock if driver was busy
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 4. Fallback: Request generic video stream without constraints
      try {
        const fallbackStream = await originalGetUserMedia({
          video: true,
          audio: false,
        });
        registerStreamTracks(fallbackStream);
        return fallbackStream;
      } catch (fallbackErr) {
        console.error("Fallback getUserMedia also failed:", fallbackErr);
        throw fallbackErr;
      }
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
    });
  });
}

/**
 * Cleanly stops all webcam tracks and detaches video elements.
 */
export function stopAllCameraStreams() {
  if (typeof window === "undefined") return;

  // Stop tracked tracks
  activeTracks.forEach((track) => {
    try {
      track.stop();
    } catch {}
  });
  activeTracks = [];

  // Stop any video element tracks on page
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

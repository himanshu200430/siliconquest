import { useEffect, useRef } from "react";

interface UsePollingOptions {
  intervalMs?: number; // base interval in ms (default: 10000)
  jitterMs?: number;   // random jitter range in ms (default: 2000, i.e. ±1000ms)
  enabled?: boolean;   // only poll when screen/component is active
}

/**
 * usePolling hook: runs a callback repeatedly with random jitter.
 * Stops immediately when enabled is false or on component unmount.
 */
export function usePolling(
  callback: () => Promise<void> | void,
  options: UsePollingOptions = {}
) {
  const { intervalMs = 10000, jitterMs = 2000, enabled = true } = options;
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const scheduleNext = () => {
      if (!isSubscribed) return;
      // Add random jitter: intervalMs + [-jitterMs/2, +jitterMs/2]
      const jitter = (Math.random() - 0.5) * jitterMs;
      const delay = Math.max(1000, intervalMs + jitter);

      timeoutRef.current = setTimeout(async () => {
        try {
          await savedCallback.current();
        } catch (err) {
          console.error("Polling error:", err);
        }
        if (isSubscribed) {
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();

    return () => {
      isSubscribed = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [intervalMs, jitterMs, enabled]);
}

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Per-instance file-system cache with single-flight dedup.
 *
 * How it works:
 * 1. CDN (Cache-Control headers) → absorbs identical requests globally.
 * 2. This cache (JSON files in os.tmpdir()) → one DB query per TTL window
 *    per Vercel instance (or per server when self-hosted).
 * 3. Single-flight map → concurrent requests for the same key share one
 *    in-flight Promise so the DB sees at most 1 query per key at a time.
 *
 * Writes are atomic: write to a temp file, then rename.  This avoids
 * readers seeing a partially-written file.
 *
 * ⚠️  Use ONLY for read-only data (cards list, leaderboard).
 *     NEVER cache writes (catch, cooldown, score mutations).
 */

const CACHE_DIR = path.join(os.tmpdir(), "siliconquest-cache");
const inflight = new Map<string, Promise<unknown>>();

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // epoch ms
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cachePath(key: string): string {
  // Replace any characters that are problematic in filenames
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safeKey}.json`);
}

/**
 * Read `key` from the file cache.  If the entry is missing or expired,
 * call `load()` to fetch fresh data, write it atomically, and return it.
 *
 * Concurrent callers for the same `key` share a single `load()` call
 * (single-flight / request coalescing).
 *
 * @param key   Unique cache key, e.g. "cards" or "leaderboard".
 * @param ttlMs Time-to-live in milliseconds.
 * @param load  Async function that fetches the fresh data.
 */
export async function fileCache<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  // 1. Try reading from disk
  const filePath = cachePath(key);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() < entry.expiresAt) {
      return entry.data;
    }
  } catch {
    // File doesn't exist or is corrupt — fall through to load
  }

  // 2. Single-flight: if another request is already loading this key, wait for it
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // 3. Load fresh data, write atomically, then clear the in-flight entry
  const promise = (async (): Promise<T> => {
    const data = await load();

    // Atomic write: temp file → rename
    ensureCacheDir();
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    const tmpFile = filePath + `.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(entry), "utf-8");
    fs.renameSync(tmpFile, filePath);

    return data;
  })();

  inflight.set(key, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

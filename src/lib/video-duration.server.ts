import { Input, MP4, UrlSource } from "mediabunny";
import { presignR2Get } from "./r2.server";

/** Read only MP4 metadata/sample tables via bounded private range requests, never decode/download the movie. */
export async function readVideoDuration(key: string): Promise<number> {
  const input = new Input({
    formats: [MP4],
    source: new UrlSource(await presignR2Get(key, 120), {
      maxCacheSize: 8 * 1024 * 1024,
      parallelism: 1,
      getRetryDelay: () => null,
      fetchFn: async (url, init) => {
        const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
        if (response.status !== 206) {
          await response.body?.cancel();
          throw new Error("Video metadata could not be read safely.");
        }
        return response;
      },
    }),
  });
  const timeout = setTimeout(() => input.dispose(), 30_000);
  try {
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("The video has no valid duration.");
    return Math.max(1, Math.floor(duration));
  } finally {
    clearTimeout(timeout);
    input.dispose();
  }
}
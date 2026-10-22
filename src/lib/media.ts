/** Image keys in R2 (images/…) are served through the app's media route. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `/api/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Absolute public URL for share previews (crawlers need a full address). */
export function absoluteMediaUrl(path: string | null | undefined): string | null {
  const url = mediaUrl(path);
  if (!url) return null;
  return url.startsWith("http") ? url : `https://films.brantatech.com${url}`;
}

/** Only the images/ folder is public through the media route; videos/ never is. */
export const ALLOWED_MEDIA_PREFIXES = ["images/series/", "images/episodes/", "images/avatars/", "images/popups/"] as const;

export function isAllowedMediaPath(path: string): boolean {
  if (!path || path.includes("..") || path.includes("\\") || path.startsWith("/")) return false;
  return (
    ALLOWED_MEDIA_PREFIXES.some((p) => path.startsWith(p)) &&
    /^[\w\-./]+$/.test(path) &&
    /\.(webp|png|jpe?g|avif)$/i.test(path)
  );
}

export const AVATAR_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

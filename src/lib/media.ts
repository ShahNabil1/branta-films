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

/** Fixed width families bound the number of billable transformation variants. */
export const IMAGE_WIDTHS = {
  poster: [240, 480, 720],
  backdrop: [640, 960, 1280, 1920],
  thumbnail: [320, 640, 960],
} as const;
export type ImageVariant = keyof typeof IMAGE_WIDTHS;

/** Shared by image markup and preload hints so the browser reuses one request. */
export function artworkSources(path: string, variant: ImageVariant) {
  const widths = IMAGE_WIDTHS[variant];
  const transformed = transformedMediaUrl(path, widths[1]);
  return {
    src: transformed ?? mediaUrl(path) ?? undefined,
    srcSet: transformed ? widths.map(width => `${transformedMediaUrl(path, width)} ${width}w`).join(", ") : undefined,
  };
}

/** Only public catalogue artwork; never transform video keys or external avatars. */
export function transformedMediaUrl(path: string, width: number): string | null {
  if (!isAllowedMediaPath(path) || path.startsWith("images/avatars/")) return null;
  const allowed = Object.values(IMAGE_WIDTHS).some(widths => (widths as readonly number[]).includes(width));
  if (!allowed) return null;
  const source = mediaUrl(path);
  return source ? `https://films.brantatech.com/cdn-cgi/image/width=${width},fit=scale-down,quality=80,format=auto${source}` : null;
}

export function mediaCacheControl(path: string): string {
  return isAllowedMediaPath(path) && !path.startsWith("images/avatars/")
    ? "public, max-age=31536000, immutable"
    : "public, max-age=86400, stale-while-revalidate=604800";
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

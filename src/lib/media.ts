/** Storage paths (posters/…, avatars/…) are served through the app's media route. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `/api/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const ALLOWED_MEDIA_PREFIXES = ["posters/", "avatars/"] as const;

export function isAllowedMediaPath(path: string): boolean {
  if (!path || path.includes("..") || path.includes("\\") || path.startsWith("/")) return false;
  return ALLOWED_MEDIA_PREFIXES.some((p) => path.startsWith(p)) && /^[\w\-./]+$/.test(path);
}

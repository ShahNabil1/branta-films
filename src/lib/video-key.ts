/** Turns a pasted R2 object key or URL into a safe `videos/…/*.mp4` key, or null. */
export function r2VideoKeyFromInput(raw: string, bucket = "branta-films"): string | null {
  let value = raw.trim();
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      let path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
      value = path;
    } catch { return null; }
  }
  value = value.replace(/^\/+/, "");
  if (value.startsWith(`${bucket}/`)) value = value.slice(bucket.length + 1);
  if (!/^videos\/[A-Za-z0-9._\- /]+\.mp4$/i.test(value) || value.includes("..") || value.includes("//")) return null;
  return value;
}

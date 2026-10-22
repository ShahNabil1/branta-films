/**
 * Global "did the user really change anything?" check used by every edit form.
 * Values are compared after normalising, so deleting a word and typing it back,
 * trailing spaces, key order, or editor-only HTML whitespace never count as a change.
 */
export function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    const text = value.replace(/\r\n/g, "\n").trim();
    if (!/[<>]/.test(text)) return text;
    // Rich-text HTML: ignore whitespace between tags and empty paragraphs.
    return text.replace(/>\s+</g, "><").replace(/<p>(<br\s*\/?>)?<\/p>/g, "").trim();
  }
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalizeValue(v)]),
    );
  }
  return value;
}

export function isDirty(draft: unknown, saved: unknown): boolean {
  return JSON.stringify(normalizeValue(draft)) !== JSON.stringify(normalizeValue(saved));
}

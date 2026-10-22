/** Artwork slots: crop shape and the exact size the cropper exports. */
export type ArtworkSlot = "poster" | "backdrop" | "thumbnail" | "ogImage";

export const ARTWORK_SPECS: Record<ArtworkSlot, { label: string; aspect: number; width: number; height: number; ratio: string; hint: string }> = {
  ogImage: { label: "OG image", aspect: 1200 / 630, width: 1200, height: 630, ratio: "1200:630", hint: "Keep titles and faces within the frame." },
  poster: { label: "Poster", aspect: 2 / 3, width: 1000, height: 1500, ratio: "2:3", hint: "Portrait. Keep the title and faces in the middle." },
  backdrop: { label: "Backdrop", aspect: 16 / 9, width: 1920, height: 1080, ratio: "16:9", hint: "Wide banner. Keep key subjects away from the left third, where text sits." },
  thumbnail: { label: "Episode thumbnail", aspect: 16 / 9, width: 1280, height: 720, ratio: "16:9", hint: "Wide still from the episode." },
};

/** Moves one item from `from` to `to`, returning a new array. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

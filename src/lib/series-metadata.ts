export const GENRE_OPTIONS = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "War"] as const;
export const MATURITY_OPTIONS = ["All ages", "7+", "13+", "16+", "18+"] as const;

export function initialReleaseYear(saved: number | null | undefined, isNew: boolean, now = new Date()): string {
  return saved != null ? String(saved) : isNew ? String(now.getUTCFullYear()) : "";
}

export function addGenre(genres: string[], genre: string): string[] {
  const value = genre.trim();
  return value && !genres.some(g => g.toLowerCase() === value.toLowerCase()) ? [...genres, value] : genres;
}
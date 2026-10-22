export function formatTaka(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}

export function formatDuration(seconds: number) {
  const { hours, minutes, seconds: remainder } = durationParts(seconds);
  if (hours > 0) return `${hours} hr${minutes > 0 ? ` ${minutes} min` : ""}`;
  if (minutes > 0) return `${minutes} min`;
  return `${remainder} sec`;
}

export function durationParts(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return { hours: Math.floor(value / 3600), minutes: Math.floor(value / 60) % 60, seconds: value % 60 };
}

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2] as const;
export const QUALITY_HEIGHTS = [360, 480, 720, 1080] as const;
export function seekTarget(time: number, duration: number, delta: number) {
  return Math.max(0, Math.min(Number.isFinite(duration) ? duration : time + Math.max(0, delta), time + delta));
}
export function networkQualityCap(downlink?: number, saveData = false) {
  if (saveData) return 480;
  if (downlink === undefined) return 1080;
  if (downlink < 1.2) return 360;
  if (downlink < 2.5) return 480;
  if (downlink < 5) return 720;
  return 1080;
}
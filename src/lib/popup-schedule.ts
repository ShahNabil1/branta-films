export type PopupArea = "site" | "dashboard" | null;

/** Which popup area a page belongs to; admin and auth pages never show popups. */
export function popupArea(pathname: string): PopupArea {
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth") || pathname.startsWith("/set-password") || pathname.startsWith("/forgot-password") || pathname.startsWith("/checkout") || pathname.startsWith("/watch")) return null;
  return pathname.startsWith("/account") ? "dashboard" : "site";
}

export function popupShowsIn(placement: "site" | "dashboard" | "everywhere", area: PopupArea) {
  return area !== null && (placement === "everywhere" || placement === area);
}

/** Storage key changes when a popup is edited, so an updated popup can show again. */
export const popupSeenKey = (p: { id: string; updated_at: string }) => `branta_popup_${p.id}_${p.updated_at}`;

import { describe, expect, it } from "vitest";
import { popupArea, popupShowsIn } from "@/lib/popup-schedule";

describe("popup placement", () => {
  it("shows site popups on public pages but not the dashboard", () => {
    expect(popupShowsIn("site", popupArea("/browse"))).toBe(true);
    expect(popupShowsIn("site", popupArea("/account"))).toBe(false);
  });
  it("shows dashboard popups only in the viewer dashboard", () => expect(popupShowsIn("dashboard", popupArea("/account/library"))).toBe(true));
  it("never shows popups in admin, checkout or the player", () => {
    for (const path of ["/admin", "/checkout", "/watch/x"]) expect(popupShowsIn("everywhere", popupArea(path))).toBe(false);
  });
});

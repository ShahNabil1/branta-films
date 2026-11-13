import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DevToolsShield } from "@/components/security/DevToolsShield";
import { isAccountShieldPath } from "@/lib/devtools-scope";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Account-only DevTools shield", () => {
  it("includes /account and every nested account route", () => {
    for (const path of ["/account", "/account/", "/account/explore", "/account/watch/episode", "/account/series/slug"]) {
      expect(isAccountShieldPath(path)).toBe(true);
    }
  });

  it("excludes public and admin routes and similarly named paths", () => {
    for (const path of ["/", "/browse", "/auth", "/series/slug", "/watch/episode", "/admin", "/admin/users", "/admin/view-as/user", "/accounting"]) {
      expect(isAccountShieldPath(path)).toBe(false);
    }
  });

  it("runs no detector on public pages and releases timer and shortcuts on exit", () => {
    const interval = vi.spyOn(window, "setInterval");
    const clear = vi.spyOn(window, "clearInterval");
    // Explicitly opt this isolated test into production behaviour on localhost.
    const config = { productionHosts: [window.location.hostname], disableInIframe: false };
    const { rerender } = render(<DevToolsShield enabled={false} config={config}>Page</DevToolsShield>);
    expect(interval).not.toHaveBeenCalled();
    rerender(<DevToolsShield enabled config={config}>Page</DevToolsShield>);
    expect(interval).toHaveBeenCalledTimes(1);
    const timer = interval.mock.results[0]?.value;
    const blockedKey = new KeyboardEvent("keydown", { key: "F12", cancelable: true });
    window.dispatchEvent(blockedKey);
    expect(blockedKey.defaultPrevented).toBe(true);
    rerender(<DevToolsShield enabled={false} config={config}>Page</DevToolsShield>);
    expect(clear).toHaveBeenCalledWith(timer);
    const publicKey = new KeyboardEvent("keydown", { key: "F12", cancelable: true });
    window.dispatchEvent(publicKey);
    expect(publicKey.defaultPrevented).toBe(false);
    const menu = new MouseEvent("contextmenu", { cancelable: true });
    document.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(false);
  });
});

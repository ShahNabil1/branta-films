import { describe, expect, it, vi } from "vitest";
import { requestRecoveryCode } from "@/lib/password-recovery";

describe("Forgot password account checks", () => {
  it("returns not_found and sends no code when the email has no account", async () => {
    const send = vi.fn();
    expect(await requestRecoveryCode("missing@example.com", async () => false, send))
      .toEqual({ status: "not_found" });
    expect(send).not.toHaveBeenCalled();
  });
  it("sends a recovery code only for an existing account, normalizing the email", async () => {
    const lookup = vi.fn(async () => true);
    const send = vi.fn(async () => undefined);
    expect(await requestRecoveryCode(" Member@Example.com ", lookup, send)).toEqual({ status: "sent" });
    expect(lookup).toHaveBeenCalledWith("member@example.com");
    expect(send).toHaveBeenCalledExactlyOnceWith("member@example.com");
  });
  it("does not send a code when the account check fails", async () => {
    const send = vi.fn();
    await expect(requestRecoveryCode("member@example.com", async () => { throw new Error("Unavailable"); }, send))
      .rejects.toThrow("Unavailable");
    expect(send).not.toHaveBeenCalled();
  });
  it("does not report success when delivery fails", async () => {
    await expect(requestRecoveryCode("member@example.com", async () => true, async () => { throw new Error("Send failed"); }))
      .rejects.toThrow("Send failed");
  });
});
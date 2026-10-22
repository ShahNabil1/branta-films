import { describe, expect, it } from "vitest";
import { fileSize, uploadActive, uploadMetrics } from "@/lib/upload-metrics";
describe("Real upload status", () => {
  it("reports actual bytes as percentage, speed and ETA", () => {
    expect(uploadMetrics(50 * 1024 ** 2, 100 * 1024 ** 2, 10)).toEqual({ percent: 50, speed: 5 * 1024 ** 2, remaining: 10 });
  });
  it("never invents an ETA before bytes are transferred", () => {
    expect(uploadMetrics(0, 100, 0)).toEqual({ percent: 0, speed: 0, remaining: null });
  });
  it("shows total video sizes in MB and GB", () => {
    expect(fileSize(5 * 1024 ** 2)).toBe("5.0 MB");
    expect(fileSize(2 * 1024 ** 3)).toBe("2.00 GB");
  });
  it("protects navigation until upload and verification finish", () => {
    expect(uploadActive("preparing")).toBe(true);
    expect(uploadActive("uploading")).toBe(true);
    expect(uploadActive("verifying")).toBe(true);
    expect(uploadActive("failed")).toBe(false);
    expect(uploadActive("complete")).toBe(false);
  });
});
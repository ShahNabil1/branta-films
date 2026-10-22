import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BdPhoneInput } from "@/components/forms/BdPhoneInput";
import { normalizePhoneInput } from "@/lib/phone-input";
import { BD_PHONE_RE } from "@/lib/cart-pricing";

describe("Bangladesh mobile input", () => {
  it("converts every Bangla digit to English", () => {
    expect(normalizePhoneInput("০১২৩৪৫৬৭৮৯")).toBe("0123456789");
  });

  it("converts mixed typed or pasted numbers", () => {
    expect(normalizePhoneInput("০17৯০৭৩68৬৩")).toBe("01790736863");
  });

  it("removes letters and symbols", () => {
    expect(normalizePhoneInput("০১৭-৯০৭ ৩৬৮৬৩abcবাংলা!")).toBe("01790736863");
  });

  it("keeps at most eleven digits", () => {
    expect(normalizePhoneInput("০১৭৯০৭৩৬৮৬৩৯৯")).toBe("01790736863");
  });

  it("accepts only the required local prefixes and eleven digits", () => {
    for (const prefix of ["013", "014", "015", "016", "017", "018", "019"]) {
      expect(BD_PHONE_RE.test(`${prefix}12345678`)).toBe(true);
    }
    for (const number of ["01212345678", "01112345678", "0171234567", "017123456789"]) {
      expect(BD_PHONE_RE.test(number)).toBe(false);
    }
  });

  it("immediately displays English digits in the shared field", () => {
    function PhoneField() {
      const [value, setValue] = useState("");
      return <BdPhoneInput value={value} onChange={setValue} />;
    }
    render(<PhoneField />);
    const input = screen.getByPlaceholderText("01XXXXXXXXX");
    fireEvent.change(input, { target: { value: "০১৭৯০৭৩৬৮৬৩" } });
    expect((input as HTMLInputElement).value).toBe("01790736863");
  });
});
/** Normalise local mobile digits before filtering or enforcing the length limit. */
export function normalizePhoneInput(value: string): string {
  return value
    .replace(/[০-৯]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6))
    .replace(/[^0-9]/g, "")
    .slice(0, 11);
}
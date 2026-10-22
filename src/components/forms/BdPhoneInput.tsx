import { cn } from "@/lib/utils";
import { normalizePhoneInput } from "@/lib/phone-input";

/** Bangladeshi mobile input: real flag + fixed +88, digits only, max 11. */
export function BdPhoneInput({ value, onChange, invalid, id, disabled, className }: { value: string; onChange: (v: string) => void; invalid?: boolean; id?: string; disabled?: boolean; className?: string }) {
  return (
    <div className={cn("flex h-10 items-center overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring", invalid ? "border-destructive" : "border-input", disabled && "opacity-60", className)}>
      <span className="flex h-full items-center gap-2 border-r border-border bg-secondary/60 px-3">
        <svg viewBox="0 0 10 6" className="h-4 w-[26px] rounded-[2px]" role="img" aria-label="Bangladesh flag"><rect width="10" height="6" fill="#006a4e" /><circle cx="4.5" cy="3" r="2" fill="#f42a41" /></svg>
        <span className="font-mono text-sm font-semibold">+88</span>
      </span>
      <input id={id} disabled={disabled} inputMode="numeric" autoComplete="tel-national" placeholder="01XXXXXXXXX" maxLength={11} value={value}
        onChange={(e) => onChange(normalizePhoneInput(e.target.value))} aria-invalid={invalid}
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono tracking-wider outline-none" />
    </div>
  );
}

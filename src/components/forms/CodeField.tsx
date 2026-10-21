import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FieldLabel } from "./SmartField";

/** Six separate code boxes for the emailed 6-digit codes. */
export function CodeField({
  label = "6-digit code",
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <InputOTP
        maxLength={6}
        value={value}
        onChange={(v) => onChange(v.replace(/\D/g, ""))}
        inputMode="numeric"
        autoFocus={autoFocus}
        disabled={disabled}
      >
        <InputOTPGroup className="gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="size-12 rounded-sm border border-input bg-surface font-mono text-lg first:rounded-sm last:rounded-sm sm:size-13"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

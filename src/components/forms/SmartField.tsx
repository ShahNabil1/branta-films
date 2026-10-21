import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Eye, EyeOff, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { detectTypingLanguage } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string | undefined;
  icon?: ReactNode;
  password?: boolean;
  hint?: string;
  /** Shows the orange asterisk (default true) or "(optional)". */
  requiredMark?: boolean;
};

/**
 * Branta Tech form field with live validation, Caps Lock indicator,
 * typing-language indicator (EN / বাংলা) and show/hide password toggle.
 */
export const SmartField = forwardRef<HTMLInputElement, Props>(function SmartField(
  { id, label, value, onValueChange, error, icon, password, hint, requiredMark = true, className, onKeyDown, onKeyUp, onBlur, disabled, ...rest },
  ref,
) {
  const [caps, setCaps] = useState(false);
  const [show, setShow] = useState(false);
  const lang = detectTypingLanguage(value);
  const wrongLang = lang === "bn" && (password || rest.type === "email");
  const syncCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState("CapsLock"));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-small block font-medium text-foreground">
          {label}
          {requiredMark ? (
            <span aria-hidden className="text-primary"> *</span>
          ) : (
            <span className="font-normal text-muted-foreground"> (optional)</span>
          )}
        </label>
        {lang ? (
          <span
            className={cn(
              "text-caption inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
              wrongLang ? "border-warning/60 text-warning" : "border-border text-muted-foreground",
            )}
            aria-live="polite"
            title="Typing language"
          >
            <Languages className="size-3" aria-hidden="true" />
            {lang === "bn" ? "বাংলা" : "EN"}
          </span>
        ) : null}
      </div>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <Input
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          type={password ? (show ? "text" : "password") : rest.type}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            syncCaps(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            syncCaps(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCaps(false);
            onBlur?.(e);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-feedback`}
          className={cn(
            "h-12",
            icon && "pl-10",
            password && "pr-12",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
            className,
          )}
          {...rest}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            disabled={disabled}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            aria-controls={id}
            className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      <div id={`${id}-feedback`} aria-live="polite" className="mt-1 space-y-1">
        {error ? (
          <p className="text-caption flex items-start gap-1.5 text-destructive">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        {caps ? (
          <p className="text-caption flex items-start gap-1.5 text-warning">
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Caps Lock is on.
          </p>
        ) : null}
        {wrongLang ? (
          <p className="text-caption flex items-start gap-1.5 text-warning">
            <Languages className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Your keyboard is typing Bangla. Switch to English.
          </p>
        ) : null}
        {!error && hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
});

/** Label used above non-text controls (code boxes, file pickers) so every label looks the same. */
export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-small mb-1.5 block font-medium text-foreground">
      {children}
      <span aria-hidden className="text-primary"> *</span>
    </label>
  );
}

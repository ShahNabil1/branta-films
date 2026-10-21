import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Eye, EyeOff, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
};

/**
 * Text input with live validation feedback, Caps Lock indicator,
 * typing-language indicator (EN / বাংলা) and show/hide password toggle.
 */
export const SmartField = forwardRef<HTMLInputElement, Props>(function SmartField(
  { id, label, value, onValueChange, error, icon, password, hint, className, onKeyDown, onKeyUp, onBlur, disabled, ...rest },
  ref,
) {
  const [caps, setCaps] = useState(false);
  const [show, setShow] = useState(false);
  const lang = detectTypingLanguage(value);
  const syncCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState("CapsLock"));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {lang ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]",
              lang === "bn" && (password || rest.type === "email") ? "border-warning/50 text-warning" : "border-border text-muted-foreground",
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
            "h-12 rounded-sm bg-surface text-base",
            icon && "pl-10",
            password && "pr-12",
            error && "border-destructive focus-visible:ring-destructive",
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
            className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      <div id={`${id}-feedback`} aria-live="polite" className="space-y-1">
        {error ? (
          <p className="flex items-start gap-1.5 text-xs leading-5 text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        {caps ? (
          <p className="flex items-start gap-1.5 text-xs leading-5 text-warning">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Caps Lock is on.
          </p>
        ) : null}
        {lang === "bn" && (password || rest.type === "email") ? (
          <p className="flex items-start gap-1.5 text-xs leading-5 text-warning">
            <Languages className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Your keyboard is typing Bangla. Switch to English.
          </p>
        ) : null}
        {!error && hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
});

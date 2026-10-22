import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Branded modal. Never closes on outside click or Escape — only via the [X]
 * button or an explicit action. Use instead of native confirm()/alert().
 */
export function BrandedDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  container,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  container?: HTMLElement | null | undefined;
}) {
  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal container={container ?? undefined}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-6 shadow-[var(--shadow-card)] sm:p-7 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          <DialogPrimitive.Title className="text-h4 pr-8 font-semibold">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="text-small mt-2 text-muted-foreground">{description}</DialogPrimitive.Description> : null}
          {children ? <div className="mt-5">{children}</div> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
}) {
  return (
    <BrandedDialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={destructive ? "destructive" : "default"} size="sm" onClick={onConfirm} disabled={busy}>
          {busy ? "Please wait…" : confirmLabel}
        </Button>
      </div>
    </BrandedDialog>
  );
}

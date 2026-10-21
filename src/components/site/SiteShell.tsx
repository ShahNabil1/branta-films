import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children, overlayHeader = false }: { children: ReactNode; overlayHeader?: boolean }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader overlay={overlayHeader} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

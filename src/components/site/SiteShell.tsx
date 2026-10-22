import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { MobileTabBar, SiteHeader } from "./SiteHeader";

export function SiteShell({ children, overlayHeader = false }: { children: ReactNode; overlayHeader?: boolean }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader overlay={overlayHeader} />
      <main className="flex-1">{children}</main>
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0"><SiteFooter /></div>
      <MobileTabBar />
    </div>
  );
}

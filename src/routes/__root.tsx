import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import geistFont from "../assets/fonts/geist-latin-variable.woff2?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { DevToolsShield } from "@/components/security/DevToolsShield";
import { isAccountShieldPath } from "@/lib/devtools-scope";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { CartSheet } from "@/components/commerce/CartSheet";
import { PopupRunner } from "@/components/commerce/PopupRunner";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/layout/primitives";
import { ViewerPresence } from "@/components/security/ViewerPresence";

function NotFoundComponent() {
  return (
    <div className="hero-glow flex min-h-screen items-center px-[var(--gutter)]">
      <div className="mx-auto w-full max-w-[var(--content-max)]">
        <Eyebrow>Error 404</Eyebrow>
        <h1 className="text-display-xl mt-6 max-w-[12ch] text-foreground">
          This page isn't playing<span className="text-primary">.</span>
        </h1>
        <p className="text-body-lg mt-8 max-w-xl text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className={`${buttonVariants({ size: "lg" })} mt-10`}>
          Back to Branta Films <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="hero-glow flex min-h-screen items-center px-[var(--gutter)]">
      <div className="mx-auto w-full max-w-[var(--content-max)]">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="text-display mt-6 max-w-[14ch] text-foreground">This page didn't load.</h1>
        <p className="text-body-lg mt-8 max-w-xl text-muted-foreground">Something went wrong on our end. You can try again or head back home.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={buttonVariants({ size: "lg" })}
          >
            Try again
          </button>
          <a
            href="/"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0B0B" },
      { name: "author", content: "Branta Tech" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preload", href: geistFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewerPresence />
        <CartProvider>
          <DevToolsShield enabled={isAccountShieldPath(pathname)}>
            <Outlet />
          </DevToolsShield>
          <CartSheet />
          <PopupRunner />
        </CartProvider>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

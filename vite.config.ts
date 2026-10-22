// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    optimizeDeps: {
      // Prebundle the editor at startup, not during an admin-page request.
      include: [
        "@tiptap/react",
        "@tiptap/starter-kit",
        "@tiptap/extension-text-style",
        "@tiptap/extension-text-align",
        "@radix-ui/react-switch",
        "@radix-ui/react-tooltip",
        "@dnd-kit/core",
        "@dnd-kit/sortable",
        "@dnd-kit/modifiers",
        "@dnd-kit/utilities",
        "react-easy-crop",
      ],
      // Reject stale optimizer URLs instead of mixing React generations after installs.
      ignoreOutdatedRequests: false,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

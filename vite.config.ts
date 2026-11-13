import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => ({
  plugins: [
    mode === "development" && devtools({
      logging: false,
      eventBusConfig: { enabled: false },
      enhancedLogs: { enabled: false },
      consolePiping: { enabled: false },
      removeDevtoolsOnBuild: false,
      injectSource: { enabled: true },
    }),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    command === "build" && nitro({ defaultPreset: "cloudflare-module" }),
    react(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
  environments: {
    client: {
      ...(command === "build" && mode === "development"
        ? { define: { "process.env.NODE_ENV": JSON.stringify("development") } }
        : {}),
      build: {
        sourcemap: true,
        rolldownOptions: {
          output: { sourcemapExcludeSources: true },
        },
      },
    },
  },
  optimizeDeps: {
    // Prebundle shared React and editor packages before the first admin navigation.
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
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
    ignoreOutdatedRequests: false,
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "node:url";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // client/src/index.css is Tailwind v4 (`@import "tailwindcss"`); without this
    // plugin the CSS transform fails and the dev server serves the HTML fallback.
    tailwindcss(),
    metaImagesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "client", "src"),
      "@shared": path.resolve(rootDir, "shared"),
      "@assets": path.resolve(rootDir, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  base: "/suite/",
  root: path.resolve(rootDir, "client"),
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
  },
});

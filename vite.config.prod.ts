/**
 * Production Vite config — used by Netlify and Vercel builds.
 *
 * Differences from vite.config.ts:
 *  - No Replit-specific plugins (cartographer, devBanner, runtimeErrorOverlay)
 *  - base: "/suite/" preserved (matches wouter Router base="/suite")
 *  - VITE_API_BASE_URL injected so the Orval api-client points to the right host
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { metaImagesPlugin } from './vite-plugin-meta-images';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'client', 'src'),
      '@shared': path.resolve(rootDir, 'shared'),
      '@assets': path.resolve(rootDir, 'attached_assets'),
    },
  },
  base: '/suite/',
  root: path.resolve(rootDir, 'client'),
  build: {
    outDir: path.resolve(rootDir, 'dist/public'),
    emptyOutDir: true,
    // Raise chunk size warning threshold — the design engine is intentionally large
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split vendor chunks for better CDN caching
        manualChunks: {
          'react-vendor':  ['react', 'react-dom'],
          'ui-vendor':     ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'query-vendor':  ['@tanstack/react-query'],
          'chart-vendor':  ['recharts'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
});

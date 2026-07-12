import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Vestara Admin Dashboard',
        short_name: 'Vestara',
        description: 'Enterprise administration platform for the Vestara digital ecosystem',
        theme_color: '#D8A441',
        background_color: '#060B12',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['business', 'finance', 'productivity'],
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache API responses for offline fallback
            urlPattern: /^https?:\/\/.*\/api\/v1\/health$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-health',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 },
            },
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Cache Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Cache MUI icon font (if served from CDN)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/css2\?family=Material/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'material-icons',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@vestara/types': resolve(__dirname, '../../packages/types/src'),
      '@vestara/validation': resolve(__dirname, '../../packages/validation/src'),
      '@vestara/config': resolve(__dirname, '../../packages/config/src'),
      '@vestara/constants': resolve(__dirname, '../../packages/constants/src'),
      '@vestara/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
  server: {
    port: 5173,
    // Allow the dev server to read the repo-root `docs/` folder that the
    // documentation page imports at build time via `?raw` imports.
    fs: {
      allow: [resolve(__dirname, '../../..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

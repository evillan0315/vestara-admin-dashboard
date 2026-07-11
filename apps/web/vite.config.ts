import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

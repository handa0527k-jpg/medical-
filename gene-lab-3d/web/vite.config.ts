import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// BASE_PATH=/gene-lab-3d/ npm run build for a sub-path (e.g. GitHub Pages)
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), film: resolve(__dirname, 'film.html') } },
  },
});

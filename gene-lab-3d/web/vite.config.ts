import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// BASE_PATH=/gene-lab-3d/ npm run build for a sub-path (e.g. GitHub Pages)
// film.html is the film renderer (for YouTube MP4s); the hosted app build leaves it out
const hosted = process.env.VITE_MODELS_JSON === '1';
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { input: hosted ? { main: resolve(__dirname, 'index.html') } : { main: resolve(__dirname, 'index.html'), film: resolve(__dirname, 'film.html') } },
  },
});

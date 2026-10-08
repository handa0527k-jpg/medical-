import { defineConfig } from 'vite';

// BASE_PATH=/gene-lab-3d/ npm run build for a sub-path (e.g. GitHub Pages)
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  build: { chunkSizeWarningLimit: 900 },
});

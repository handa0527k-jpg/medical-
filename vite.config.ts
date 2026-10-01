import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// BASE_PATH lets the same build run at a sub-path (e.g. GitHub Pages: /medical-/)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  // every course's content is bundled eagerly (registry.ts); lectures are split per chapter
  build: { target: 'es2022', chunkSizeWarningLimit: 1100 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});

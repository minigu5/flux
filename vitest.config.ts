import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // origin이 opaque면 jsdom이 localStorage를 비활성화한다. URL을 명시해야 켜진다.
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    setupFiles: ['./test/setup.ts'],
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});

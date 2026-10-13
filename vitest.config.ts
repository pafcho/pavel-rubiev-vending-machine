import { resolve } from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        // The domain layer is plain TypeScript and needs no DOM.
        test: {
          name: 'domain',
          environment: 'node',
          include: ['src/domain/**/*.test.ts', 'src/services/**/*.test.ts'],
        },
      },
      {
        plugins: [angular({ tsconfig: resolve(import.meta.dirname, 'tsconfig.spec.json') })],
        test: {
          name: 'app',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['src/test-setup.ts'],
          include: ['src/app/**/*.test.ts'],
        },
      },
    ],
  },
});

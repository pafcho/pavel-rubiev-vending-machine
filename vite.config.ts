import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The Angular compiler runs inside Vite through Analog's plugin (AOT for
// production builds, JIT-free dev server). Tests use vitest.config.ts instead.
export default defineConfig({
  plugins: [angular({ tsconfig: resolve(import.meta.dirname, 'tsconfig.app.json') }), tailwindcss()],
});

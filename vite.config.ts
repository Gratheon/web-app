/// <reference types="vitest" />
/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";
import svgr from "vite-plugin-svgr";
import preact from "@preact/preset-vite";
import { configDefaults } from 'vitest/config';

// https://vitejs.dev/config/
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    svgr(),
    preact({
      devtoolsInProd: true,
    }),
  ],
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    port: 8080,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421, // HMR port, distinct from dev server port
        }
      : undefined,
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  css: {
    preprocessorOptions: {
      less: {
        math: "always",
        relativeUrls: true,
        javascriptEnabled: true,
      },
    },
  },
  test: {
    globals: true, // Use Vitest global APIs
    environment: 'jsdom', // Use jsdom environment
    setupFiles: './test/setupTests.ts', // Setup file
    coverage: {
      provider: 'v8', // Use v8 for coverage
      reporter: ['json', 'lcov', 'clover', 'text'], // Match Jest reporters
      include: [ // Match Jest collectCoverageFrom
        'src/**/*.{ts,tsx}',
      ],
      exclude: [ // Match Jest coveragePathIgnorePatterns and specific file exclusions
        ...configDefaults.exclude, // Include default exclusions
        // 'src/**/*.test.{ts,tsx}', // Don't exclude tests from coverage analysis source
        'src/vite-env.d.ts',
        'src/main.tsx',
        // 'test/', // Redundant, handled by test.exclude
        'src/types/',
        'test/ui/', // Exclude E2E tests folder from coverage analysis
      ],
      all: true, // Try to report coverage for all included files, even untested ones
    },
    // Exclude Playwright tests explicitly
    exclude: [
      ...configDefaults.exclude, // Keep default exclusions (node_modules, dist, etc.)
      'test/ui/**',
      'tests-examples/**',
      '**/node_modules/**', // Ensure node_modules is excluded robustly
    ],
    // Specify the pattern for unit test files, including both .test and .spec conventions
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Aliases are inherited from Vite's resolve.alias
  },
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});

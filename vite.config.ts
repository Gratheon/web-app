/// <reference types="vitest" />
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import svgr from 'vite-plugin-svgr'
import preact from '@preact/preset-vite'
import { configDefaults } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
const host = process.env.TAURI_DEV_HOST
const pwaDevEnabled = process.env.VITE_PWA_DEV === '1'

export default defineConfig({
	publicDir: 'static',
	plugins: [
		svgr(),
		VitePWA({
			includeAssets: [
				'favicon.ico',
				'apple-touch-icon.png',
				'icon_16x16.png',
				'icon_32x32.png',
				'icon_96x96.png',
				'icon_128x128.png',
				'icon_192x192.png',
				'icon_256x256.png',
				'icon_384x384.png',
				'icon_512x512.png',
			],
			manifest: {
				name: 'Gratheon',
				short_name: 'Gratheon',
				description: 'Beehive management',
				start_url: '.',
				display: 'standalone',
				background_color: '#ffffff',
				orientation: 'portrait',
				icons: [
					{
						src: '/icon_16x16.png',
						sizes: '16x16',
						type: 'image/png',
					},
					{
						src: '/icon_32x32.png',
						sizes: '32x32',
						type: 'image/png',
					},
					{
						src: '/icon_96x96.png',
						sizes: '96x96',
						type: 'image/png',
					},
					{
						src: '/icon_128x128.png',
						sizes: '128x128',
						type: 'image/png',
					},
					{
						src: '/icon_192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/icon_256x256.png',
						sizes: '256x256',
						type: 'image/png',
					},
					{
						src: '/icon_384x384.png',
						sizes: '384x384',
						type: 'image/png',
					},
					{
						src: '/icon_512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
			registerType: 'autoUpdate',
			devOptions: {
				enabled: pwaDevEnabled,
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				// Include emitted build images (including src/assets/*.webp) in precache.
				// This allows placeholders to render offline without requiring a prior runtime fetch.
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}'],
				runtimeCaching: [
					{
						// Cache local bundled images and static icon files.
						urlPattern: ({ request, sameOrigin }) =>
							request.destination === 'image' && sameOrigin,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-local-v1',
							expiration: {
								maxEntries: 300,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						// Cache selected remote images (S3 backgrounds, gravatar, OSM tiles) after first load.
						urlPattern:
							/^https:\/\/(?:gratheon\.s3-accelerate\.amazonaws\.com|www\.gravatar\.com|[a-z]\.tile\.openstreetmap\.org)\/.*\.(?:png|jpg|jpeg|webp|svg)(?:\?.*)?$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-remote-v1',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
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
		host: host || '0.0.0.0',
		allowedHosts: ['jetson-orin'],
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
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
	},
	css: {
		preprocessorOptions: {
			less: {
				math: 'always',
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
			include: [
				// Match Jest collectCoverageFrom
				'src/**/*.{ts,tsx}',
			],
			exclude: [
				// Match Jest coveragePathIgnorePatterns and specific file exclusions
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
			process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
		// don't minify for debug builds
		minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
		// produce sourcemaps for debug builds
		sourcemap: !!process.env.TAURI_ENV_DEBUG,
	},
})

import type { Config } from 'jest';

const config: Config = {
	rootDir: '..', // Adjust root directory to be the project root
	preset: 'ts-jest', // Revert to standard ts-jest preset
	testEnvironment: 'jsdom', // Use jsdom environment for browser-like testing
	resetModules: true,
	resetMocks: true,
	setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'], // Setup file for testing library
	coverageReporters: ['json', 'lcov', 'clover', 'text'], // Added 'text' reporter
	collectCoverage: true, // Enable coverage collection
	collectCoverageFrom: [ // Specify files to include in coverage
		'<rootDir>/src/**/*.{ts,tsx}',
		'!<rootDir>/src/**/*.test.{ts,tsx}',
		'!<rootDir>/src/vite-env.d.ts',
		'!<rootDir>/src/main.tsx', // Often excluded as it's mainly setup
	],
	coveragePathIgnorePatterns: [ // Exclude mocks and types from coverage
		'<rootDir>/node_modules/',
		'<rootDir>/test/',
		'<rootDir>/src/types/',
	],
	// Only match files ending in .test.ts or .test.tsx within the src directory
	testMatch: [
		'<rootDir>/src/**/*.test.{ts,tsx}',
	],
	// Ignore the Playwright test directory explicitly as well
	testPathIgnorePatterns: [
		'<rootDir>/node_modules/',
		'<rootDir>/test/ui/',
	],
	modulePaths: ['<rootDir>'],
	moduleNameMapper: { // Map static assets to mocks
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/test/__mocks__/fileMock.js',
		'\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
		// Alias for absolute imports (adjust if your tsconfig paths differ)
		'^@/(.*)$': '<rootDir>/src/$1',
		// Removed error_reporter mapping - rely on manual mock file
		// Removed preact mappings - let the ESM preset handle it
	},
	transform: {
		// Transform TS/TSX using ts-jest, targeting CommonJS output
		'^.+\\.(ts|tsx)$': ['ts-jest', {
			tsconfig: '<rootDir>/tsconfig.app.json',
			// Override tsconfig module settings for Jest to output CommonJS
			compilerOptions: {
				module: 'CommonJS',
			},
		}],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Define extensions
	transformIgnorePatterns: [
		// Ignore node_modules except for specific ESM packages
        '/node_modules/(?!(preact|@testing-library|urql|wonka|graphql-ws|@urql|dexie|@sentry/react)/)',
    ],
	// Matcher type issues might still exist, address if they reappear
};

export default config;

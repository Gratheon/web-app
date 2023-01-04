export default {
	rootDir: '..',
	preset: 'ts-jest',
	resetModules: true,
	resetMocks: true,
	coverageReporters: ['json', 'lcov', 'clover'],
	collectCoverage: false,
	// collectCoverageFrom: ['<rootDir>/app/**/*.js'],
	testMatch: [
		'<rootDir>/src/**/*.test.ts'
	],
	modulePaths: ['<rootDir>']
};
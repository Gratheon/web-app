module.exports = {
	rootDir: '..',
	resetModules: true,
	resetMocks: true,
	coverageReporters: ['json', 'lcov', 'clover'],
	collectCoverage: false,
	// collectCoverageFrom: ['<rootDir>/app/**/*.js'],
	testMatch: [
		'<rootDir>/app/storage/*.test.js'
	],
	modulePaths: ['<rootDir>']
};

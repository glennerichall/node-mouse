export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/test/e2e/',
    '<rootDir>/test/integration/vm/',
    '<rootDir>/test/integration/vm-x11/',
    '<rootDir>/test/integration/vm-wayland/',
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/index.js',
  ],
  coverageReporters: ['text', 'lcov'],
};

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
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 55,
      functions: 70,
      lines: 70,
    },
  },
  coverageReporters: ['text', 'lcov'],
};

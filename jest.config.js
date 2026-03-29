export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/index.js',
  ],
  coverageReporters: ['text', 'lcov'],
};

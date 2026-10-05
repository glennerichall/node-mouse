export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/integration/vm'],
  testPathIgnorePatterns: ['<rootDir>/test/integration/vm/browser/'],
  testTimeout: 120_000,
  maxWorkers: 1,
};

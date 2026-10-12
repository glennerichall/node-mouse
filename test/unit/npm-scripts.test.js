import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('npm scripts', () => {
  it('keeps a development entry point for running the checked-out application', () => {
    expect(packageJson.scripts.dev).toBe('node scripts/start-dev.mjs');
    expect(packageJson.scripts.predev).toBe('node scripts/build-dev-native.mjs');
  });

  it('keeps the installation test command portable across POSIX and Windows shells', () => {
    expect(packageJson.scripts['test:install']).toBe(
      'node --experimental-vm-modules node_modules/jest/bin/jest.js test/unit/setup-command.test.js test/unit/windows-daemon-service.test.js --runInBand',
    );
    expect(packageJson.scripts['test:install']).not.toMatch(/^NODE_OPTIONS=/);
  });
});

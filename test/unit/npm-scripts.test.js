import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('npm scripts', () => {
  it('keeps a development entry point for running the checked-out application', () => {
    expect(packageJson.scripts.dev).toBe('node index.js');
  });
});

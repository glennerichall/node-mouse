import {readFileSync} from 'node:fs';
import {getInstalledVersion} from '../../server/term/cli/versionCommand.js';

describe('remote-mouse version', () => {
  it('reads the installed package version without contacting the daemon', () => {
    const expectedVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;

    expect(getInstalledVersion()).toBe(expectedVersion);
  });
});

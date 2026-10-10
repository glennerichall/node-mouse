import {readFileSync} from 'node:fs';
import {getInstalledVersion} from '../../server/term/cli/versionCommand.js';
import {parseCliArgs} from '../../server/term/cli/parseCliArgs.js';

describe('remote-mouse version', () => {
  it('reads the installed package version without contacting the daemon', () => {
    const expectedVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;

    expect(getInstalledVersion()).toBe(expectedVersion);
  });

  it('parses the conventional --version and -V flags without contacting the service', () => {
    expect(parseCliArgs(['--version']).command).toEqual({name: 'version', args: {}});
    expect(parseCliArgs(['-V']).command).toEqual({name: 'version', args: {}});
  });
});

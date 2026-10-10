import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

describe('developer-provided VM deployment', () => {
  test('deploys over SSH and does not depend on Vagrant or Packer', async () => {
    const deploy = await readFile('dev/deploy/deploy-linux.sh', 'utf8');
    const provision = await readFile('dev/deploy/provision-linux.sh', 'utf8');
    expect(deploy).toContain('REMOTE_MOUSE_TEST_HOST');
    expect(deploy).toContain('rsync');
    expect(deploy).toContain('ssh');
    expect(deploy).not.toContain('vagrant');
    expect(provision).toContain('remote-mouse setup');
  });

  test('requires an explicit target host', () => {
    const result = spawnSync('bash', ['dev/deploy/deploy-linux.sh', '--help'], {encoding: 'utf8'});
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Usage:');
  });
});

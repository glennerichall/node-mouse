import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {mergeEnvWithExample} from '../../server/utils/env.js';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rm-env-merge-'));
}

describe('mergeEnvWithExample', () => {
  it('adds new vars, keeps changed values, keeps unchanged, removes absent vars', () => {
    const dir = createTempDir();
    const examplePath = path.join(dir, '.env.example');
    const targetPath = path.join(dir, '.env');

    fs.writeFileSync(examplePath, [
      '# comment',
      'A=1',
      'B=2',
      'C=3',
      '',
    ].join('\n'), 'utf8');

    fs.writeFileSync(targetPath, [
      'A=1',
      'B=999',
      'X=to-remove',
      '',
    ].join('\n'), 'utf8');

    const result = mergeEnvWithExample({
      exampleEnvPath: examplePath,
      targetEnvPath: targetPath,
    });

    expect(result.ok).toBe(true);
    expect(result.added).toBe(1); // C
    expect(result.updated).toBe(1); // B from target custom value
    expect(result.unchanged).toBe(1); // A
    expect(result.removed).toBe(1); // X

    const merged = fs.readFileSync(targetPath, 'utf8');
    expect(merged).toContain('# comment');
    expect(merged).toContain('A=1');
    expect(merged).toContain('B=999');
    expect(merged).toContain('C=3');
    expect(merged).not.toContain('X=to-remove');
  });

  it('returns missing_example when .env.example is absent', () => {
    const dir = createTempDir();
    const result = mergeEnvWithExample({
      exampleEnvPath: path.join(dir, '.env.example'),
      targetEnvPath: path.join(dir, '.env'),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('missing_example');
  });
});

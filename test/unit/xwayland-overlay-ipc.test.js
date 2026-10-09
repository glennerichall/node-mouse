import {execFileSync, spawn, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import QRCode from 'qrcode';

const sourcePath = fileURLToPath(new URL('../../native/wayland/remote-mouse-xwayland-overlay.c', import.meta.url));
const hasXvfb = spawnSync('xvfb-run', ['--help'], {stdio: 'ignore'}).status === 0;

describe('XWayland overlay helper IPC', () => {
  it('disables stdio read-ahead when poll() coordinates command reads', () => {
    const source = readFileSync(sourcePath, 'utf8');
    expect(source).toMatch(/setvbuf\(stdin, NULL, _IONBF, 0\)/);
  });

  const integrationTest = hasXvfb ? it : it.skip;

  integrationTest('processes a rapid hide/show pair instead of stranding SHOW in stdio', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'remote-mouse-overlay-ipc-'));
    const helperPath = path.join(tempDir, 'overlay');
    const qrPath = path.join(tempDir, 'qr.png');
    let child;

    try {
      execFileSync('cc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-O2', sourcePath,
        '-lX11', '-lpng', '-o', helperPath]);
      await QRCode.toFile(qrPath, 'https://example.test/');

      child = spawn('xvfb-run', ['-a', helperPath, qrPath, '10', '10', '128', '900', '1'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let output = '';
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { output += chunk; });
      child.stdin.write('HIDE\nSHOW\n');

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Helper states: ${output}`)), 3000);
        const checkOutput = () => {
          const hiddenIndex = output.indexOf('STATE hidden');
          const visibleIndex = output.indexOf('STATE visible', hiddenIndex + 1);
          if (hiddenIndex !== -1 && visibleIndex !== -1) {
            clearTimeout(timeout);
            resolve();
          }
        };
        child.stdout.on('data', checkOutput);
        child.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        child.once('exit', (code) => {
          clearTimeout(timeout);
          reject(new Error(`Overlay helper exited (${code}); states: ${output}`));
        });
        checkOutput();
      });
    } finally {
      if (child && child.exitCode === null) {
        child.stdin.end('CLOSE\n');
        child.kill('SIGTERM');
      }
      await rm(tempDir, {recursive: true, force: true});
    }
  }, 10000);
});

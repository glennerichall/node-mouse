import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export function getXWaylandOverlayHelperPath() {
  return path.join(projectRoot, 'build', 'wayland', 'remote-mouse-xwayland-overlay');
}

export function buildXWaylandOverlayArgs({qrPath, x, y, size, showDelayMs, autoHide}) {
  return [qrPath, String(x), String(y), String(size), String(showDelayMs), autoHide ? '1' : '0'];
}

export function createXWaylandOverlayClient(options, dependencies = {}) {
  const spawnProcess = dependencies.spawnProcess || spawn;
  const helperPath = dependencies.helperPath || getXWaylandOverlayHelperPath();
  const child = spawnProcess(helperPath, buildXWaylandOverlayArgs(options), {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });
  let state = 'starting';
  let closed = false;
  let output = '';

  child.stdout?.setEncoding?.('utf8');
  child.stdout?.on?.('data', (chunk) => {
    output += chunk;
    const lines = output.split(/\r?\n/);
    output = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('STATE ')) state = line.slice(6).trim();
    }
  });
  const markClosed = () => {
    closed = true;
    state = 'closed';
  };
  child.once?.('exit', markClosed);
  child.once?.('error', markClosed);
  child.stdin?.on?.('error', (error) => {
    markClosed();
    if (error.code !== 'EPIPE') child.emit?.('error', error);
    if (!child.killed) child.kill('SIGTERM');
  });

  function send(command) {
    if (closed || !child.stdin?.writable) return false;
    try {
      child.stdin.write(`${command}\n`);
      return true;
    } catch {
      markClosed();
      return false;
    }
  }

  return {
    show: () => send('SHOW'),
    hide: () => send('HIDE'),
    update: ({qrPath, x, y, size, showDelayMs, autoHide}) => send(
      `UPDATE ${qrPath} ${x} ${y} ${size} ${showDelayMs} ${autoHide ? 1 : 0}`,
    ),
    close: () => {
      if (!send('CLOSE') && !child.killed) child.kill('SIGTERM');
      closed = true;
    },
    getState: () => state,
    process: child,
  };
}

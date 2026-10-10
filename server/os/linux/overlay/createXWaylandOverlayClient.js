import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {getLinuxNativeArtifactPath} from '../nativeArtifactPaths.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export function getXWaylandOverlayHelperPath() {
  return getLinuxNativeArtifactPath('xwaylandOverlay', {root: projectRoot});
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
  let closing = false;
  let output = '';
  let nextRequestId = 0;
  const pending = new Map();
  const commandTimeoutMs = dependencies.commandTimeoutMs || 1500;

  child.stdout?.setEncoding?.('utf8');
  child.stdout?.on?.('data', (chunk) => {
    output += chunk;
    const lines = output.split(/\r?\n/);
    output = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('STATE ')) {
        state = line.slice(6).trim();
        continue;
      }
      const acknowledgment = line.match(/^ACK (\d+) (\S+)$/);
      if (!acknowledgment) continue;
      const requestId = Number(acknowledgment[1]);
      const request = pending.get(requestId);
      if (!request) continue;
      pending.delete(requestId);
      clearTimeout(request.timer);
      request.resolve(acknowledgment[2] === request.expectedState);
    }
  });
  const markClosed = () => {
    closed = true;
    state = 'closed';
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.resolve(false);
    }
    pending.clear();
  };
  child.once?.('exit', markClosed);
  child.once?.('error', markClosed);
  child.stdin?.on?.('error', (error) => {
    markClosed();
    if (error.code !== 'EPIPE') child.emit?.('error', error);
    if (!child.killed) child.kill('SIGTERM');
  });

  function send(command, expectedState) {
    if (closed || closing && command !== 'CLOSE') return Promise.resolve(false);
    if (!child.stdin?.writable) {
      markClosed();
      if (!child.killed) child.kill('SIGTERM');
      return Promise.resolve(false);
    }
    const requestId = ++nextRequestId;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const request = pending.get(requestId);
        pending.delete(requestId);
        request?.resolve(false);
        markClosed();
        if (!child.killed) child.kill('SIGTERM');
      }, commandTimeoutMs);
      timer.unref?.();
      pending.set(requestId, {expectedState, resolve, timer});
      try {
        child.stdin.write(`${requestId} ${command}\n`);
      } catch {
        pending.delete(requestId);
        clearTimeout(timer);
        markClosed();
        resolve(false);
      }
    });
  }

  return {
    show: () => send('SHOW', 'visible'),
    hide: () => send('HIDE', 'hidden'),
    update: ({qrPath, x, y, size, showDelayMs, autoHide}) => send(
      `UPDATE ${qrPath} ${x} ${y} ${size} ${showDelayMs} ${autoHide ? 1 : 0}`,
      'updated',
    ),
    close: () => {
      closing = true;
      // Shutdown must never wait behind a helper command/ACK. In particular,
      // SIGINT should reap the native overlay even when X11 is unresponsive.
      markClosed();
      if (!child.killed) child.kill('SIGTERM');
    },
    getState: () => state,
    process: child,
  };
}

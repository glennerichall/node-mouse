import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildQrOverlayPowerShellScript} from '../powershell.js';
import {spawnPowerShellFile} from '../process.js';

export function createWin32QrOverlayAdapter(dependencies = {}) {
  const writeFile = dependencies.writeFile || fs.writeFileSync;
  const spawnScript = dependencies.spawnScript || spawnPowerShellFile;
  const scriptPath = dependencies.scriptPath
    || path.join(os.tmpdir(), `remote-mouse-qr-overlay-${process.pid}.ps1`);

  return {
    managesHover: false,
    isAvailable: async () => true,
    getBounds({screen, size, config}) {
      return {
        x: Math.max(0, screen.width - size - config.margin),
        y: Math.max(0, config.margin),
        width: size,
        height: size,
      };
    },
    refresh(handle, context) {
      if (handle && !handle.killed) handle.kill('SIGTERM');
      writeFile(scriptPath, buildQrOverlayPowerShellScript({
        qrPath: context.qrPath,
        size: context.size,
        posX: context.x,
        posY: context.y,
      }), 'utf8');
      const child = spawnScript(scriptPath);
      child.once?.('error', context.onError);
      return child;
    },
    show() {},
    hide(handle) {
      if (handle && !handle.killed) handle.kill('SIGTERM');
    },
    close(handle) {
      if (handle && !handle.killed) handle.kill('SIGTERM');
    },
    isSuppressed: () => false,
  };
}

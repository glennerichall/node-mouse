import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {
  QR_OVERLAY_ENABLED,
  TOP_BAR_OFFSET_PX,
  QR_OVERLAY_SIZE,
  QR_OVERLAY_MARGIN,
  HAS_GRAPHICAL_DISPLAY,
} from '../init/config.js';
import { commandExists } from '../../utils/server/process.js';

export async function startQrOverlay({ getUrl, robot }) {
  const isSupported = QR_OVERLAY_ENABLED
    && os.platform() === 'linux'
    && HAS_GRAPHICAL_DISPLAY;

  if (!isSupported) {
    return {
      close: () => {},
      refresh: async () => {},
    };
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    console.warn('Overlay QR non lancé: "yad" est introuvable.');
    return {
      close: () => {},
      refresh: async () => {},
    };
  }

  const size = QR_OVERLAY_SIZE;
  const margin = QR_OVERLAY_MARGIN;
  const topBarOffset = TOP_BAR_OFFSET_PX;
  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  let child = null;
  let refreshChain = Promise.resolve();

  const close = () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
    child = null;
  };

  async function spawnOverlay() {
    await QRCode.toFile(qrPath, getUrl(), { width: size, margin: 1 });

    const screen = robot.getScreenSize();
    const posX = Math.max(0, screen.width - size - margin);
    const posY = Math.max(0, margin + topBarOffset);

    const args = [
      '--class=remote-mouse-qr-overlay',
      '--undecorated',
      '--skip-taskbar',
      '--sticky',
      '--on-top',
      '--no-buttons',
      '--fixed',
      `--width=${size}`,
      `--height=${size}`,
      `--posx=${posX}`,
      `--posy=${posY}`,
      `--image=${qrPath}`,
      '--text=',
    ];

    child = spawn('yad', args, { stdio: 'ignore' });
  }

  const refresh = async () => {
    refreshChain = refreshChain
      .then(async () => {
        close();
        await spawnOverlay();
      })
      .catch((_error) => {});

    await refreshChain;
  };

  const handleSigint = () => {
    close();
    process.exit(130);
  };

  const handleSigterm = () => {
    close();
    process.exit(143);
  };

  process.on('exit', close);
  process.once('SIGINT', handleSigint);
  process.once('SIGTERM', handleSigterm);

  await refresh();

  return {
    close,
    refresh,
  };
}

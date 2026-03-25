import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import QRCode from 'qrcode';
import {
  QR_OVERLAY_ENABLED,
  TOP_BAR_OFFSET_PX,
  QR_OVERLAY_SIZE,
  QR_OVERLAY_MARGIN,
  HAS_GRAPHICAL_DISPLAY,
} from '../utils/config.js';
import { commandExists } from '../utils/process.js';

export async function startQrOverlay({ url, robot }) {
  if (!QR_OVERLAY_ENABLED) {
    return null;
  }

  if (os.platform() !== 'linux') {
    return null;
  }

  if (!HAS_GRAPHICAL_DISPLAY) {
    return null;
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    console.warn('Overlay QR non lancé: "yad" est introuvable.');
    return null;
  }

  const size = QR_OVERLAY_SIZE;
  const margin = QR_OVERLAY_MARGIN;
  const topBarOffset = TOP_BAR_OFFSET_PX;
  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  await QRCode.toFile(qrPath, url, { width: size, margin: 1 });

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

  const child = spawn('yad', args, { stdio: 'ignore' });

  const close = () => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
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

  return { close };
}

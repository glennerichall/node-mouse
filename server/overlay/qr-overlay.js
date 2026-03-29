import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {getStartupConfigSnapshot} from '../init/config.js';
import { commandExists } from '../utils/process.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('qr-overlay');
const config = getStartupConfigSnapshot();

export async function startQrOverlay({ getUrl, robot }) {
  const isSupported = config.qrOverlay.enabled
    && os.platform() === 'linux'
    && config.graphicalDisplay;

  if (!isSupported) {
    return {
      close: () => {},
      refresh: async () => {},
    };
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    log.warn('Overlay QR non lancé: "yad" est introuvable.');
    return {
      close: () => {},
      refresh: async () => {},
    };
  }

  const size = config.qrOverlay.size;
  const margin = config.qrOverlay.margin;
  const topBarOffset = config.qrOverlay.topOffsetPx;
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
    log.debug({ url: getUrl() }, 'QR overlay rafraîchi');
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

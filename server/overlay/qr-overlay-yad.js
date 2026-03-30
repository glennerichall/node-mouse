import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {getConfig} from '../init/config/index.js';
import { commandExists } from '../utils/process.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('qr-overlay:yad');

export async function startQrOverlayYad({ getUrl, robot }) {
  const config = getConfig();
  const isSupported = config.qrOverlay.enabled
    && os.platform() === 'linux'
    && config.graphicalDisplay;

  if (!isSupported) {
    return {
      close: () => {},
      refresh: async () => {},
      show: async () => false,
      hide: () => false,
      toggle: async () => false,
      isVisible: () => false,
    };
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    log.warn('Overlay QR non lancé: "yad" est introuvable.');
    return {
      close: () => {},
      refresh: async () => {},
      show: async () => false,
      hide: () => false,
      toggle: async () => false,
      isVisible: () => false,
    };
  }

  const size = config.qrOverlay.size;
  const margin = config.qrOverlay.margin;
  const topBarOffset = config.qrOverlay.topOffsetPx;
  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = true;

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
    if (!visible) {
      return;
    }

    refreshChain = refreshChain
      .then(async () => {
        close();
        await spawnOverlay();
      })
      .catch((_error) => {});

    await refreshChain;
  };

  const hide = () => {
    visible = false;
    close();
    return visible;
  };

  const show = async () => {
    visible = true;
    await refresh();
    return visible;
  };

  const toggle = async () => {
    if (visible) {
      hide();
      return visible;
    }
    await show();
    return visible;
  };

  await refresh();

  return {
    close,
    refresh,
    show,
    hide,
    toggle,
    isVisible: () => visible,
  };
}

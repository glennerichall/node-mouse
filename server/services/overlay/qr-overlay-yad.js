import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import { commandExists } from '../../utils/process.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('qr-overlay:yad');

function getNoopOverlay() {
  return {
    close: () => {},
    refresh: async () => {},
    show: async () => false,
    hide: () => false,
    toggle: async () => false,
    isVisible: () => false,
  };
}

export async function startQrOverlayYad({ getUrl, robot, getConfig, getSystemConfig }) {
  function getOverlayContext() {
    const config = getConfig?.() || {};
    const systemConfig = getSystemConfig?.() || {};
    const qrOverlayConfig = {
      ...DEFAULT_PERSISTED_CONFIG.qrOverlay,
      ...config.qrOverlay,
    };

    return {
      qrOverlayConfig,
      startsVisible: Boolean(qrOverlayConfig.enabled),
      isSupported: os.platform() === 'linux'
        && Boolean(systemConfig.graphicalDisplay),
    };
  }

  if (!getOverlayContext().isSupported) {
    return getNoopOverlay();
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    log.warn('Overlay QR non lancé: "yad" est introuvable.');
    return getNoopOverlay();
  }

  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = getOverlayContext().startsVisible;

  const close = () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
    child = null;
  };

  async function spawnOverlay() {
    const {qrOverlayConfig, isSupported} = getOverlayContext();
    if (!isSupported) {
      return;
    }

    const size = qrOverlayConfig.size;
    const margin = qrOverlayConfig.margin;
    const topBarOffset = qrOverlayConfig.topOffsetPx;
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
    if (!visible || !getOverlayContext().isSupported) {
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
    if (!getOverlayContext().isSupported) {
      visible = false;
      return visible;
    }
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

  return {
    close,
    refresh,
    show,
    hide,
    toggle,
    isVisible: () => visible,
  };
}

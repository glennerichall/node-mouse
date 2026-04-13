import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../../application/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';
import {commandExists} from '../../os/linux/process.js';

let log;
function getModuleLog() {
  log ??= createLogger('qr-overlay:yad');
  return log;
}

export async function createQrOverlayYad(services) {
  const log = getModuleLog();
  const getUrl = () => services.getUrls().entryUrl;
  const getConfig = () => services.getConfig();
  const getSystemConfig = () => services.getSystemConfig();
  const robot = services.getRobot();

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
    return createNoopOverlay();
  }

  const hasYad = await commandExists('yad');
  if (!hasYad) {
    log.warn('Overlay QR non lancé: "yad" est introuvable.');
    return createNoopOverlay();
  }

  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = getOverlayContext().startsVisible;
  let suppressed = false;
  let overlayBounds = null;

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
    overlayBounds = {
      x: posX,
      y: posY,
      width: size,
      height: size,
    };

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

  const update = async () => {
    if (!visible || suppressed || !getOverlayContext().isSupported) {
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
    await update();
    return visible;
  };

  const setSuppressed = (nextSuppressed) => {
    const normalized = Boolean(nextSuppressed);
    if (suppressed === normalized) {
      return suppressed;
    }

    suppressed = normalized;
    if (suppressed) {
      close();
      return suppressed;
    }

    void update();
    return suppressed;
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
    show,
    hide,
    update,
    setSuppressed,
    toggle,
    isVisible: () => visible,
    isSuppressed: () => suppressed,
    getBounds: () => overlayBounds,
  };
}

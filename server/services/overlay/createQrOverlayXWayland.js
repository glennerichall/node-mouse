import os from 'node:os';
import path from 'node:path';
import {access} from 'node:fs/promises';
import QRCode from 'qrcode';
import {DEFAULT_PERSISTED_CONFIG} from '../config/defaultConfig.js';
import {createLogger} from '../../application/logger.js';
import {createNoopOverlay} from './createNoopOverlay.js';
import {
  createXWaylandOverlayClient,
  getXWaylandOverlayHelperPath,
} from '../../os/linux/wayland/createXWaylandOverlayClient.js';

export async function createQrOverlayXWayland(services, dependencies = {}) {
  const log = dependencies.log || createLogger('qr-overlay:xwayland');
  const helperPath = dependencies.helperPath || getXWaylandOverlayHelperPath();
  const createClient = dependencies.createClient || createXWaylandOverlayClient;
  try {
    await (dependencies.access || access)(helperPath);
  } catch {
    log.warn({helperPath}, 'Overlay QR natif indisponible; exécutez npm run build:xwayland-overlay');
    return createNoopOverlay();
  }

  const qrPath = path.join(os.tmpdir(), `remote-mouse-qr-overlay-${process.pid}.png`);
  let client = null;
  let visible = Boolean(services.getConfig()?.qrOverlay?.enabled);
  let bounds = null;
  let operation = Promise.resolve();

  async function prepare() {
    const config = {
      ...DEFAULT_PERSISTED_CONFIG.qrOverlay,
      ...services.getConfig()?.qrOverlay,
    };
    const size = config.size;
    const screen = await services.getSystem().getScreenInfo()
      || {width: size + config.margin, height: size + config.margin};
    bounds = {
      x: Math.max(0, screen.width - size - config.margin),
      y: Math.max(0, config.margin + config.topOffsetPx),
      width: size,
      height: size,
    };
    await QRCode.toFile(qrPath, services.getUrls().entryUrl, {width: size, margin: 1});
    return {config, size};
  }

  async function updateNow() {
    const {config, size} = await prepare();
    if (!visible) return;
    if (!client || client.getState() === 'closed') {
      client = createClient({
        qrPath,
        x: bounds.x,
        y: bounds.y,
        size,
        showDelayMs: config.hoverShowDelayMs,
        autoHide: config.autoHideOnHover,
      });
      client.process?.once?.('error', (error) => {
        log.warn({err: error}, 'Impossible de lancer le helper natif de l’overlay QR');
      });
      return;
    }
    client.update({
      qrPath,
      x: bounds.x,
      y: bounds.y,
      size,
      showDelayMs: config.hoverShowDelayMs,
      autoHide: config.autoHideOnHover,
    });
  }

  function queue(action) {
    operation = operation.then(action, action);
    return operation;
  }

  async function toggle() {
    if (visible) {
      visible = false;
      client?.hide();
      return false;
    }
    visible = true;
    await queue(updateNow);
    client?.show();
    return true;
  }

  return {
    close: () => client?.close(),
    show: async () => {
      visible = true;
      await queue(updateNow);
      client?.show();
      return visible;
    },
    hide: () => {
      visible = false;
      client?.hide();
      return visible;
    },
    update: () => queue(updateNow),
    setSuppressed: () => client?.getState() === 'hover-hidden',
    toggle,
    isVisible: () => visible,
    isSuppressed: () => client?.getState() === 'hover-hidden',
    getBounds: () => bounds,
    managesHover: true,
  };
}

import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import { Server } from 'socket.io';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import {
  PORT,
  SERVER_HOST,
  MOUSE_SPEED,
  SCROLL_SPEED,
  HTTPS_ENABLED,
  SSL_KEY_PATH,
  SSL_CERT_PATH,
  TOP_BAR_OFFSET_PX,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
  PREVIEW_FPS,
  DESKTOP_NOTIFICATIONS_ENABLED,
  CLIENT_NOTIFICATIONS_ENABLED,
  UPDATE_CHECK_ENABLED,
  UPDATE_CHECK_INTERVAL_MIN,
  UPDATE_CHECK_PACKAGE,
  UPDATE_CHECK_CURRENT_VERSION,
  ENTRY_PATH_ENABLED,
  ENTRY_PATH_FIXED,
  ENTRY_PATH_TOKEN_LENGTH,
  ENTRY_PATH_ROTATE_INTERVAL_MIN,
  ENTRY_PATH_GRACE_MIN,
  QR_OVERLAY_SIZE,
  QR_OVERLAY_MARGIN,
  HAS_GRAPHICAL_DISPLAY,
} from '../utils/config.js';
import { publicDir, clientDir } from '../utils/paths.js';
import { getPublicUrl } from '../utils/network.js';
import { loadRobotOrExit } from '../utils/robot.js';
import { createMouseController } from '../mouse/index.js';
import { createKeyboardController } from '../keyboard/index.js';
import { createBrowserController } from './browser.js';
import { createPreviewStreamer } from './preview.js';
import { createNotifier } from './notifier.js';
import { startUpdateChecker } from './update-check.js';
import { startQrOverlay } from './qr-overlay.js';
import { createEntryTokenManager } from './entry-token.js';
import { registerHttpRoutes } from './http.js';
import { registerSocketHandlers } from './socket.js';

export async function startServer() {
  const app = express();
  const server = HTTPS_ENABLED
    ? createHttpsServer(app)
    : http.createServer(app);
  const io = new Server(server);
  const notifier = createNotifier(io);
  const entryTokenManager = createEntryTokenManager({
    enabled: ENTRY_PATH_ENABLED,
    fixedPath: ENTRY_PATH_FIXED,
    tokenLength: ENTRY_PATH_TOKEN_LENGTH,
    rotateIntervalMin: ENTRY_PATH_ROTATE_INTERVAL_MIN,
    graceMin: ENTRY_PATH_GRACE_MIN,
  });

  const robot = loadRobotOrExit();
  const mouse = createMouseController(robot, {
    mouseSpeed: MOUSE_SPEED,
    scrollSpeed: SCROLL_SPEED,
  });
  const keyboard = createKeyboardController(robot);
  const browser = createBrowserController();
  const preview = createPreviewStreamer(robot, {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    fps: PREVIEW_FPS,
  });

  const protocol = HTTPS_ENABLED ? 'https' : 'http';
  const basePublicUrl = getPublicUrl(PORT, protocol);
  let entryUrl = entryTokenManager.getEntryUrl(basePublicUrl);
  let qrDataUrl = await QRCode.toDataURL(entryUrl);
  let overlay = await startQrOverlay({ url: entryUrl, robot });

  const router = registerHttpRoutes({
    publicDir,
    clientDir,
    getPublicUrl: () => entryUrl,
    getQrDataUrl: () => qrDataUrl,
  });
  app.use(entryTokenManager.makeHttpGuardMiddleware(), router);

  registerSocketHandlers(io, {
    mouse,
    keyboard,
    browser,
    preview,
    notifier,
    entryTokenManager,
    getEntryUrl: () => entryUrl,
  });
  startUpdateChecker(notifier);
  entryTokenManager.startAutoRotation(async () => {
    entryUrl = entryTokenManager.getEntryUrl(basePublicUrl);
    qrDataUrl = await QRCode.toDataURL(entryUrl);

    if (overlay && overlay.close) {
      overlay.close();
    }
    overlay = await startQrOverlay({ url: entryUrl, robot });

    io.emit('entry:update', {
      token: entryTokenManager.getCurrentToken(),
      url: entryUrl,
      path: entryTokenManager.getEntryPath(),
    });

    notifier.notify({
      level: 'warning',
      title: 'URL mise a jour',
      message: 'Le point d’entree a ete renouvele.',
      ttlMs: 3500,
    });
  });

  server.listen(PORT, () => {
    logStartupConfig({
      protocol,
      entryTokenManager,
      entryUrl,
    });
    console.log('Remote Mouse server démarré');
    console.log(`URL: ${entryUrl}`);
    console.log(`QR web: ${entryUrl}/qr`);
    console.log('\nScanner ce QR avec le mobile:\n');
    qrcodeTerminal.generate(entryUrl, { small: true });
  });
}

function logStartupConfig({ protocol, entryTokenManager, entryUrl }) {
  console.log('Configuration:');
  console.log(`- protocol: ${protocol}`);
  console.log(`- port: ${PORT}`);
  console.log(`- serverHost: ${SERVER_HOST || '(auto LAN detection)'}`);
  console.log(`- entryPathEnabled: ${entryTokenManager.enabled}`);
  console.log(`- entryPathCurrent: ${entryTokenManager.getEntryPath() || '/'}`);
  console.log(`- entryUrl: ${entryUrl}`);
  console.log(`- entryPathRotateMin: ${ENTRY_PATH_ROTATE_INTERVAL_MIN}`);
  console.log(`- entryPathGraceMin: ${ENTRY_PATH_GRACE_MIN}`);
  console.log(`- mouseSpeed: ${MOUSE_SPEED}`);
  console.log(`- scrollSpeed: ${SCROLL_SPEED}`);
  console.log(`- preview: ${PREVIEW_WIDTH}x${PREVIEW_HEIGHT} @ ${PREVIEW_FPS}fps`);
  console.log(`- desktopNotifications: ${DESKTOP_NOTIFICATIONS_ENABLED}`);
  console.log(`- clientNotifications: ${CLIENT_NOTIFICATIONS_ENABLED}`);
  console.log(`- updateCheck: enabled=${UPDATE_CHECK_ENABLED} every=${UPDATE_CHECK_INTERVAL_MIN}min package=${UPDATE_CHECK_PACKAGE || '(none)'} current=${UPDATE_CHECK_CURRENT_VERSION || '(none)'}`);
  console.log(`- qrOverlay: size=${QR_OVERLAY_SIZE}px margin=${QR_OVERLAY_MARGIN}px topOffset=${TOP_BAR_OFFSET_PX}px`);
  console.log(`- graphicalDisplay: ${HAS_GRAPHICAL_DISPLAY}`);
  console.log(`- httpsEnabled: ${HTTPS_ENABLED}`);
  if (HTTPS_ENABLED) {
    console.log(`- sslKeyPath: ${SSL_KEY_PATH || '(missing)'}`);
    console.log(`- sslCertPath: ${SSL_CERT_PATH || '(missing)'}`);
  }
  console.log('');
}

function createHttpsServer(app) {
  if (!SSL_KEY_PATH || !SSL_CERT_PATH) {
    throw new Error(
      'HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.',
    );
  }

  const key = fs.readFileSync(SSL_KEY_PATH, 'utf8');
  const cert = fs.readFileSync(SSL_CERT_PATH, 'utf8');
  return https.createServer({ key, cert }, app);
}

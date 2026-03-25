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
import { startQrOverlay } from './qr-overlay.js';
import { registerHttpRoutes } from './http.js';
import { registerSocketHandlers } from './socket.js';

export async function startServer() {
  const app = express();
  const server = HTTPS_ENABLED
    ? createHttpsServer(app)
    : http.createServer(app);
  const io = new Server(server);

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
  const publicUrl = getPublicUrl(PORT, protocol);
  const qrDataUrl = await QRCode.toDataURL(publicUrl);
  await startQrOverlay({ url: publicUrl, robot });

  const router = registerHttpRoutes({
    publicDir,
    clientDir,
    getPublicUrl: () => publicUrl,
    getQrDataUrl: () => qrDataUrl,
  });
  app.use(router);

  registerSocketHandlers(io, { mouse, keyboard, browser, preview });

  server.listen(PORT, () => {
    logStartupConfig({ protocol });
    console.log('Remote Mouse server démarré');
    console.log(`URL: ${publicUrl}`);
    console.log(`QR web: ${publicUrl}/qr`);
    console.log('\nScanner ce QR avec le mobile:\n');
    qrcodeTerminal.generate(publicUrl, { small: true });
  });
}

function logStartupConfig({ protocol }) {
  console.log('Configuration:');
  console.log(`- protocol: ${protocol}`);
  console.log(`- port: ${PORT}`);
  console.log(`- serverHost: ${SERVER_HOST || '(auto LAN detection)'}`);
  console.log(`- mouseSpeed: ${MOUSE_SPEED}`);
  console.log(`- scrollSpeed: ${SCROLL_SPEED}`);
  console.log(`- preview: ${PREVIEW_WIDTH}x${PREVIEW_HEIGHT} @ ${PREVIEW_FPS}fps`);
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

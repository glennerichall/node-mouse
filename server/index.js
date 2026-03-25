import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import { PORT, MOUSE_SPEED, SCROLL_SPEED } from '../utils/config.js';
import { publicDir, clientDir } from '../utils/paths.js';
import { getPublicUrl } from '../utils/network.js';
import { loadRobotOrExit } from '../utils/robot.js';
import { createMouseController } from '../mouse/index.js';
import { createKeyboardController } from '../keyboard/index.js';
import { createBrowserController } from './browser.js';
import { startQrOverlay } from './qr-overlay.js';
import { registerHttpRoutes } from './http.js';
import { registerSocketHandlers } from './socket.js';

export async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  const robot = loadRobotOrExit();
  const mouse = createMouseController(robot, {
    mouseSpeed: MOUSE_SPEED,
    scrollSpeed: SCROLL_SPEED,
  });
  const keyboard = createKeyboardController(robot);
  const browser = createBrowserController();

  const publicUrl = getPublicUrl(PORT);
  const qrDataUrl = await QRCode.toDataURL(publicUrl);
  await startQrOverlay({ url: publicUrl, robot });

  const router = registerHttpRoutes({
    publicDir,
    clientDir,
    getPublicUrl: () => publicUrl,
    getQrDataUrl: () => qrDataUrl,
  });
  app.use(router);

  registerSocketHandlers(io, { mouse, keyboard, browser });

  server.listen(PORT, () => {
    console.log('Remote Mouse server démarré');
    console.log(`URL: ${publicUrl}`);
    console.log(`QR web: ${publicUrl}/qr`);
    console.log('\nScanner ce QR avec le mobile:\n');
    qrcodeTerminal.generate(publicUrl, { small: true });
  });
}

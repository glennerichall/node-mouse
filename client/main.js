import { getDom } from './dom.js';
import { createCanvasUI } from './canvas.js';
import { bindTouchpad } from './touchpad.js';
import { bindKeyboardPanel } from './keyboard.js';
import { bindMouseButtons } from './mouse.js';
import { bindActionButtons } from './actions.js';
import { bindConnectionOverlay } from './connection.js';
import { bindPreviewStream } from './preview.js';
import { bindClientNotifications } from './notifications.js';

function getEntryTokenFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] || '';
}

function initClient() {
  let entryToken = getEntryTokenFromLocation();
  const socket = io({
    auth: {
      entryToken,
    },
  });
  const dom = getDom();

  const canvasUI = createCanvasUI(dom.touchpad);
  bindTouchpad(socket, dom.touchpad);
  bindKeyboardPanel(socket, dom);
  bindMouseButtons(socket, dom);
  bindActionButtons(socket, dom);
  bindConnectionOverlay(socket, dom.connectionOverlay);
  bindPreviewStream(socket, dom);
  bindClientNotifications(socket, dom.notificationsRoot);

  socket.on('entry:update', (payload = {}) => {
    const token = String(payload.token || '').trim();
    if (!token) {
      return;
    }

    entryToken = token;
    socket.auth = {
      ...(socket.auth || {}),
      entryToken,
    };

    const nextPath = `/${token}/`;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, '', nextPath);
    }
  });

  window.addEventListener('resize', canvasUI.resize);
  canvasUI.resize();
}

initClient();

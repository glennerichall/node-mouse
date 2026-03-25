import { getDom } from './dom.js';
import { createCanvasUI } from './canvas.js';
import { bindTouchpad } from './touchpad.js';
import { bindKeyboardPanel } from './keyboard.js';
import { bindMouseButtons } from './mouse.js';
import { bindActionButtons } from './actions.js';
import { bindConnectionOverlay } from './connection.js';
import { bindPreviewStream } from './preview.js';

function initClient() {
  const socket = io();
  const dom = getDom();

  const canvasUI = createCanvasUI(dom.touchpad);
  bindTouchpad(socket, dom.touchpad);
  bindKeyboardPanel(socket, dom);
  bindMouseButtons(socket, dom);
  bindActionButtons(socket, dom);
  bindConnectionOverlay(socket, dom.connectionOverlay);
  bindPreviewStream(socket, dom);

  window.addEventListener('resize', canvasUI.resize);
  canvasUI.resize();
}

initClient();

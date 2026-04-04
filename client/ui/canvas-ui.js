import { getScrollZoneLayout } from '../touch/gesture-zone.js';
import {getClientHandedness, onClientHandednessChange} from '../i18n/index.js';

export function createCanvasUI(touchpad) {
  const ctx = touchpad.getContext('2d');

  function drawHint() {
    const width = touchpad.clientWidth;
    const height = touchpad.clientHeight;

    ctx.clearRect(0, 0, width, height);
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = touchpad.getBoundingClientRect();
    touchpad.width = Math.round(rect.width * ratio);
    touchpad.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const layout = getScrollZoneLayout(touchpad.clientWidth, touchpad.clientHeight, getClientHandedness());
    document.documentElement.style.setProperty('--scroll-zone-width', `${layout.width}px`);
    document.documentElement.style.setProperty('--scroll-zone-edge-gap', `${layout.edgeGap}px`);

    drawHint();
  }

  onClientHandednessChange(() => {
    resize();
  });

  return { resize };
}

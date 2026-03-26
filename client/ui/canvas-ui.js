import { getRightScrollZoneLayout } from '../touch/gesture-zone.js';

export function createCanvasUI(touchpad) {
  const ctx = touchpad.getContext('2d');

  function drawHint() {
    const width = touchpad.clientWidth;
    const height = touchpad.clientHeight;
    const layout = getRightScrollZoneLayout(width, height);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(75, 212, 255, 0.16)';
    ctx.fillRect(layout.x, layout.y, layout.width, layout.height);
    ctx.strokeStyle = 'rgba(75, 212, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(layout.x + 0.5, layout.y + 0.5, layout.width - 1, layout.height - 1);

    ctx.save();
    ctx.translate(layout.x + layout.width / 2, layout.y + layout.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(75, 212, 255, 0.85)';
    ctx.font = '700 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SCROLL 1 DOIGT', 0, 0);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '600 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Glisser: souris', width / 2, height / 2 - 10);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 14px system-ui';
    ctx.fillText('Tap: clic gauche | 2 doigts: scroll / tap droit | Bande droite: scroll', width / 2, height / 2 + 18);
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = touchpad.getBoundingClientRect();
    touchpad.width = Math.round(rect.width * ratio);
    touchpad.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const layout = getRightScrollZoneLayout(touchpad.clientWidth, touchpad.clientHeight);
    document.documentElement.style.setProperty('--scroll-zone-width', `${layout.width}px`);
    document.documentElement.style.setProperty('--scroll-zone-edge-gap', `${layout.edgeGap}px`);

    drawHint();
  }

  return { resize };
}

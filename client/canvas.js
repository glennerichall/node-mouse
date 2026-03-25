import { getRightScrollZoneWidth } from './gesture-zone.js';

export function createCanvasUI(touchpad) {
  const ctx = touchpad.getContext('2d');

  function drawHint() {
    const width = touchpad.clientWidth;
    const height = touchpad.clientHeight;
    const scrollZoneWidth = getRightScrollZoneWidth(width);
    const scrollZoneX = width - scrollZoneWidth;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(75, 212, 255, 0.16)';
    ctx.fillRect(scrollZoneX, 0, scrollZoneWidth, height);
    ctx.strokeStyle = 'rgba(75, 212, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(scrollZoneX + 0.5, 0.5, scrollZoneWidth - 1, height - 1);

    ctx.save();
    ctx.translate(scrollZoneX + scrollZoneWidth / 2, height / 2);
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
    drawHint();
  }

  return { resize };
}

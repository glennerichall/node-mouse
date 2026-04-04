import { clamp } from '../../utils/shared/math.js';

export function getScrollZoneWidth(width) {
  return clamp(Math.round(width * 0.11), 36, 64);
}

export function getScrollZoneLayout(width, height, handedness = 'right') {
  const edgeGap = clamp(Math.round(width * 0.012), 10, 14);
  const zoneWidth = getScrollZoneWidth(width);
  const isLeftHanded = String(handedness || '').toLowerCase() === 'left';
  const x = isLeftHanded
    ? edgeGap
    : Math.max(0, width - zoneWidth - edgeGap);
  const y = edgeGap;
  const h = Math.max(24, height - edgeGap * 2);

  return {
    x,
    y,
    width: zoneWidth,
    height: h,
    edgeGap,
  };
}

export function getRightScrollZoneLayout(width, height) {
  return getScrollZoneLayout(width, height, 'right');
}

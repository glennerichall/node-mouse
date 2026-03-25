function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRightScrollZoneWidth(width) {
  return clamp(Math.round(width * 0.11), 36, 64);
}

export function getRightScrollZoneLayout(width, height) {
  const edgeGap = clamp(Math.round(width * 0.012), 10, 14);
  const zoneWidth = getRightScrollZoneWidth(width);
  const x = Math.max(0, width - zoneWidth - edgeGap);
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

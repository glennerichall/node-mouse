function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getRightScrollZoneWidth(width) {
  // return clamp(Math.round(width * 0.18), 52, 120);
  return 36;
}


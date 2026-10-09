export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function scaleSigned(value, gain) {
  return Math.sign(value) * Math.abs(value) * gain;
}

export function applyPointerSpeedCurve(dx, dy, elapsedMs, slowSpeed = 1.3, fastSpeed = 3) {
  const dt = Math.max(elapsedMs, 1);
  const pointerSpeed = Math.hypot(dx, dy) / dt; // px/ms
  const normalized = clamp((pointerSpeed - 0.05) / 0.7, 0, 1);
  const curvePosition = normalized ** 1.65;
  const minimumGain = clamp(Number(slowSpeed) || 1.3, 0.25, 5);
  const maximumGain = clamp(Number(fastSpeed) || 3, minimumGain, 8);
  const gain = minimumGain + (maximumGain - minimumGain) * curvePosition;

  return {
    dx: dx * gain,
    dy: dy * gain,
  };
}

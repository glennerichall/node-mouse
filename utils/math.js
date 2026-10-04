export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function scaleSigned(value, gain) {
  return Math.sign(value) * Math.abs(value) * gain;
}

export function applyNonLinearAcceleration(dx, dy, elapsedMs, strength = 1) {
  const dt = Math.max(elapsedMs, 1);
  const dist = Math.hypot(dx, dy);
  const speed = dist / dt; // px/ms

  // Courbe non lineaire: fine precision a basse vitesse, acceleration plus forte quand ca bouge vite.
  const normalized = clamp(speed / 0.75, 0, 5);
  const acceleratedGain = clamp(0.55 + normalized ** 1.65, 0.55, 5.5);
  const gain = 1 + (acceleratedGain - 1) * clamp(Number(strength) || 1, 0.25, 2);

  return {
    dx: dx * gain,
    dy: dy * gain,
  };
}

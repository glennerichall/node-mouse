export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function scaleSigned(value, gain) {
  return Math.sign(value) * Math.abs(value) * gain;
}

export function applyNonLinearAcceleration(dx, dy, elapsedMs) {
  const dt = Math.max(elapsedMs, 1);
  const dist = Math.hypot(dx, dy);
  const speed = dist / dt; // px/ms

  // Courbe non lineaire: fine precision a basse vitesse, acceleration plus forte quand ca bouge vite.
  const normalized = clamp(speed / 0.9, 0, 4);
  const gain = clamp(0.55 + normalized ** 1.5, 0.55, 4);

  return {
    dx: dx * gain,
    dy: dy * gain,
  };
}

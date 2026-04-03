export function computeTokenTtlMs(graceMin) {
  const value = Number(graceMin);
  if (!Number.isFinite(value)) {
    throw new Error('entryPath.graceMin must be a finite number');
  }

  return Math.max(60_000, value * 60_000);
}

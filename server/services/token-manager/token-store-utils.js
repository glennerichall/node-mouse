export function computeTokenTtlMs(graceMin) {
  return Math.max(60_000, graceMin * 60_000);
}

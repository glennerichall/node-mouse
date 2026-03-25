export function parseSemver(version) {
  const normalized = String(version || '').replace(/^v/i, '').trim();
  const [core] = normalized.split('-');
  const parts = core.split('.');
  if (parts.length < 1 || parts.length > 3) {
    return null;
  }
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
    return null;
  }
  while (nums.length < 3) {
    nums.push(0);
  }
  return nums;
}

export function isVersionGreater(a, b) {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  if (!av || !bv) {
    return false;
  }
  for (let i = 0; i < 3; i += 1) {
    if (av[i] > bv[i]) {
      return true;
    }
    if (av[i] < bv[i]) {
      return false;
    }
  }
  return false;
}

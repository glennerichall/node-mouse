import {execFileAsync} from '../../utils/process.js';

function normalizeScreenSize(screen) {
  const width = Number(screen?.width);
  const height = Number(screen?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function parseXrandrScreenSize(output) {
  const match = String(output || '').match(/\bcurrent\s+(\d+)\s*x\s*(\d+)\b/i);
  if (!match) {
    return null;
  }

  return normalizeScreenSize({
    width: match[1],
    height: match[2],
  });
}

export function parseXdpyinfoScreenSize(output) {
  const match = String(output || '').match(/\bdimensions:\s*(\d+)x(\d+)\s+pixels\b/i);
  if (!match) {
    return null;
  }

  return normalizeScreenSize({
    width: match[1],
    height: match[2],
  });
}

export async function resolveLinuxScreenSize() {
  const xrandr = await execFileAsync('xrandr', ['--current'], {timeout: 1500});
  if (xrandr.ok) {
    const screen = parseXrandrScreenSize(xrandr.stdout);
    if (screen) {
      return screen;
    }
  }

  const xdpyinfo = await execFileAsync('xdpyinfo', [], {timeout: 1500});
  if (xdpyinfo.ok) {
    const screen = parseXdpyinfoScreenSize(xdpyinfo.stdout);
    if (screen) {
      return screen;
    }
  }

  return null;
}

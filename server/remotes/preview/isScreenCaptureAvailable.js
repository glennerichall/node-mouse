export function isScreenCaptureAvailable({platform = process.platform, env = process.env} = {}) {
  if (platform !== 'linux') {
    return true;
  }

  const sessionType = String(env.XDG_SESSION_TYPE || '').trim().toLowerCase();
  if (sessionType === 'wayland') {
    return false;
  }

  if (env.WAYLAND_DISPLAY && sessionType !== 'x11') {
    return false;
  }

  return Boolean(env.DISPLAY);
}

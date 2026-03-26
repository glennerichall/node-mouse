function getEntryTokenFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] || '';
}

export function initSocketIo() {
  let entryToken = getEntryTokenFromLocation();
  const socket = io({
    auth: {
      entryToken,
    },
  });

  socket.on('entry:update', (payload = {}) => {
    const token = String(payload.token || '').trim();
    if (!token) {
      return;
    }

    entryToken = token;
    socket.auth = {
      ...(socket.auth || {}),
      entryToken,
    };

    const nextPath = `/${token}/`;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, '', nextPath);
    }
  });

  return socket;
}

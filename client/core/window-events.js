function onWindowEvent(eventName, listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(eventName, handler);
  return () => {
    window.removeEventListener(eventName, handler);
  };
}

export function emitWindowEvent(eventName, detail) {
  window.dispatchEvent(new CustomEvent(eventName, {detail}));
}

export function createWindowEventListener(eventName) {
  return (listener) => onWindowEvent(eventName, listener);
}


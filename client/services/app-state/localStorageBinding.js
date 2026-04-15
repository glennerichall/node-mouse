function safeReadStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return '';
  }
}

function safeWriteStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    // Best effort.
  }
}

export function createStorageBinding(key) {
  return {
    read() {
      return safeReadStorage(key);
    },
    write(value) {
      safeWriteStorage(key, value);
    },
  };
}

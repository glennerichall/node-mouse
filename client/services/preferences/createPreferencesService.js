import {createStorageBinding} from '../../i18n/storage.js';
import {readStoredLocale} from '../../preferences/locale.js';
import {PREFERENCES_STORAGE_CHANGED_EVENT} from '../../preferences/constants.js';

export function createPreferencesService(services) {
  let storageBound = false;

  function publish(key, value, previousValue) {
    services.getPubSub().publish(PREFERENCES_STORAGE_CHANGED_EVENT, {
      key,
      value,
      previousValue,
    });
  }

  function bindStorageSync() {
    if (storageBound || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event) => {
      if (!event.key) {
        return;
      }

      publish(event.key, event.newValue || '', event.oldValue || '');
    });

    storageBound = true;
  }

  return {
    init() {
      bindStorageSync();
      return this;
    },
    getLocale() {
      return readStoredLocale();
    },
    read(key) {
      return createStorageBinding(key).read();
    },
    write(key, value) {
      const storage = createStorageBinding(key);
      const previousValue = storage.read();
      storage.write(value);
      publish(key, value, previousValue);
      return value;
    },
    subscribe(listener) {
      return services.getPubSub().subscribe(PREFERENCES_STORAGE_CHANGED_EVENT, listener);
    },
  };
}

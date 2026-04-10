import {LOCALE_STORAGE_KEY} from '../i18n/constants.js';
import {createStorageBinding} from '../i18n/storage.js';

const localeStorage = createStorageBinding(LOCALE_STORAGE_KEY);

export function readStoredLocale() {
  return localeStorage.read();
}

export function writeStoredLocale(locale) {
  localeStorage.write(locale);
}

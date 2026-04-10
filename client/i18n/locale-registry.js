export const localeRegistry = {
  fr: {
    label: 'Francais',
    load: async () => {
      const module = await import('./locales/fr.js');
      return module.fr;
    },
  },
  en: {
    label: 'English',
    load: async () => {
      const module = await import('./locales/en.js');
      return module.en;
    },
  },
  es: {
    label: 'Espanol',
    load: async () => {
      const module = await import('./locales/es.js');
      return module.es;
    },
  },
  de: {
    label: 'Deutsch',
    load: async () => {
      const module = await import('./locales/de.js');
      return module.de;
    },
  },
  ru: {
    label: 'Русский',
    load: async () => {
      const module = await import('./locales/ru.js');
      return module.ru;
    },
  },
  it: {
    label: 'Italiano',
    load: async () => {
      const module = await import('./locales/it.js');
      return module.it;
    },
  },
  pt: {
    label: 'Portugues',
    load: async () => {
      const module = await import('./locales/pt.js');
      return module.pt;
    },
  },
  ja: {
    label: '日本語',
    load: async () => {
      const module = await import('./locales/ja.js');
      return module.ja;
    },
  },
  zh: {
    label: '中文',
    load: async () => {
      const module = await import('./locales/zh.js');
      return module.zh;
    },
  },
};

export const localePrefixes = [
  ['fr', 'fr'],
  ['en', 'en'],
  ['es', 'es'],
  ['de', 'de'],
  ['ru', 'ru'],
  ['it', 'it'],
  ['pt', 'pt'],
  ['ja', 'ja'],
  ['zh', 'zh'],
];

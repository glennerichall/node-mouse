export const localeRegistry = {
  fr: {
    label: 'Francais',
    load: async () => {
      const module = await import('./fr.js');
      return module.fr;
    },
  },
  en: {
    label: 'English',
    load: async () => {
      const module = await import('./en.js');
      return module.en;
    },
  },
  es: {
    label: 'Espanol',
    load: async () => {
      const module = await import('./es.js');
      return module.es;
    },
  },
  de: {
    label: 'Deutsch',
    load: async () => {
      const module = await import('./de.js');
      return module.de;
    },
  },
  ru: {
    label: 'Русский',
    load: async () => {
      const module = await import('./ru.js');
      return module.ru;
    },
  },
  it: {
    label: 'Italiano',
    load: async () => {
      const module = await import('./it.js');
      return module.it;
    },
  },
  pt: {
    label: 'Portugues',
    load: async () => {
      const module = await import('./pt.js');
      return module.pt;
    },
  },
  ja: {
    label: '日本語',
    load: async () => {
      const module = await import('./ja.js');
      return module.ja;
    },
  },
  zh: {
    label: '中文',
    load: async () => {
      const module = await import('./zh.js');
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

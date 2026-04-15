export function applyPageTranslations(root, t) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  }
  for (const node of root.querySelectorAll('[data-i18n-title]')) {
    node.setAttribute('title', t(node.dataset.i18nTitle));
  }
  for (const node of root.querySelectorAll('[data-i18n-aria-label]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  }
  const pageTitleKey = root.documentElement?.dataset?.i18nPageTitle || document.documentElement.dataset.i18nPageTitle;
  if (pageTitleKey) {
    document.title = t(pageTitleKey);
  }
}

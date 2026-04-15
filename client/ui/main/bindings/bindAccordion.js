import {APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL} from '../../../services/app-state/createAppStateService.js';

function getVisiblePanels(panels) {
  return panels.filter((panel) => !panel.hidden);
}

function getPanelToggle(panel, toggleSelector) {
  return panel.querySelector(toggleSelector);
}

function setExpanded(panel, expanded, {toggleSelector, contentSelector}) {
  const toggle = getPanelToggle(panel, toggleSelector);
  const content = panel.querySelector(contentSelector);
  if (!toggle || !content) {
    return;
  }
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  content.classList.toggle('is-collapsed', !expanded);
}

export function bindAccordion(panels = [], {
  appState,
  toggleSelector = '.remote-panel-toggle',
  contentSelector = '.remote-panel-content',
} = {}) {
  const accordionPanels = panels.filter(Boolean);

  if (!accordionPanels.length) {
    return {syncVisiblePanels: () => {}};
  }

  const selectors = {
    toggleSelector,
    contentSelector,
  };
  let initialStateSynced = false;

  function getPanelId(panel) {
    return String(panel?.id || '');
  }

  function getExpandedPanelId() {
    return String(appState?.get(APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL) || '');
  }

  function setExpandedPanelId(panelId) {
    appState?.set(APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL, String(panelId || ''));
  }

  function applyExpandedPanelId(panelId) {
    accordionPanels.forEach((panel) => {
      setExpanded(panel, getPanelId(panel) === panelId, selectors);
    });
  }

  function ensureValidExpanded() {
    const visiblePanels = getVisiblePanels(accordionPanels);
    if (!visiblePanels.length) {
      return;
    }

    const expandedPanelId = getExpandedPanelId();
    const expandedVisible = visiblePanels.find((panel) => getPanelId(panel) === expandedPanelId);

    if (!initialStateSynced) {
      initialStateSynced = true;
      if (!expandedPanelId) {
        const initiallyExpanded = visiblePanels.find(
          (panel) => getPanelToggle(panel, toggleSelector)?.getAttribute('aria-expanded') === 'true',
        );
        setExpandedPanelId(getPanelId(initiallyExpanded || visiblePanels[0]));
        return;
      }
    }

    if (expandedVisible || expandedPanelId === '') {
      applyExpandedPanelId(expandedPanelId);
      return;
    }

    setExpandedPanelId(getPanelId(visiblePanels[0]));
  }

  appState?.subscribeProperty(APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL, ({value}) => {
    applyExpandedPanelId(String(value || ''));
  });

  accordionPanels.forEach((panel) => {
    const toggle = getPanelToggle(panel, toggleSelector);
    if (!toggle) {
      return;
    }
    toggle.addEventListener('click', () => {
      const panelId = getPanelId(panel);
      if (getExpandedPanelId() === panelId) {
        setExpandedPanelId('');
        return;
      }
      setExpandedPanelId(panelId);
    });
  });

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      ensureValidExpanded();
    });

    accordionPanels.forEach((panel) => {
      observer.observe(panel, {
        attributes: true,
        attributeFilter: ['hidden'],
      });
    });
  }

  ensureValidExpanded();

  return {
    syncVisiblePanels: ensureValidExpanded,
  };
}

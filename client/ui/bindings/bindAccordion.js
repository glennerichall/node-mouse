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

  function collapseOthers(activePanel) {
    accordionPanels.forEach((panel) => {
      if (panel !== activePanel) {
        setExpanded(panel, false, selectors);
      }
    });
  }

  function ensureValidExpanded() {
    const visiblePanels = getVisiblePanels(accordionPanels);
    if (!visiblePanels.length) {
      return;
    }

    const expandedVisible = visiblePanels.find(
      (panel) => getPanelToggle(panel, toggleSelector)?.getAttribute('aria-expanded') === 'true',
    );

    if (expandedVisible) {
      visiblePanels.forEach((panel) => {
        if (panel !== expandedVisible) {
          setExpanded(panel, false, selectors);
        }
      });
      return;
    }

    setExpanded(visiblePanels[0], true, selectors);
    visiblePanels.slice(1).forEach((panel) => setExpanded(panel, false, selectors));
  }

  accordionPanels.forEach((panel) => {
    const toggle = getPanelToggle(panel, toggleSelector);
    if (!toggle) {
      return;
    }
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        setExpanded(panel, false, selectors);
        return;
      }
      collapseOthers(panel);
      setExpanded(panel, true, selectors);
    });
  });

  ensureValidExpanded();

  return {
    syncVisiblePanels: ensureValidExpanded,
  };
}

function getVisiblePanels(panels) {
  return panels.filter((panel) => !panel.hidden);
}

function setExpanded(panel, expanded) {
  const toggle = panel.querySelector('.remote-panel-toggle');
  const content = panel.querySelector('.remote-panel-content');
  if (!toggle || !content) {
    return;
  }
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  content.classList.toggle('is-collapsed', !expanded);
}

export function bindRemoteAccordion(dom) {
  const panels = [
    dom.browserShortcuts,
    dom.tvControls,
    dom.vlcControls,
    dom.systemControls,
  ].filter(Boolean);

  if (!panels.length) {
    return { syncVisiblePanels: () => {} };
  }

  function collapseOthers(activePanel) {
    panels.forEach((panel) => {
      if (panel !== activePanel) {
        setExpanded(panel, false);
      }
    });
  }

  function ensureValidExpanded() {
    const visiblePanels = getVisiblePanels(panels);
    if (!visiblePanels.length) {
      return;
    }

    const expandedVisible = visiblePanels.find(
      (panel) => panel.querySelector('.remote-panel-toggle')?.getAttribute('aria-expanded') === 'true',
    );

    if (expandedVisible) {
      visiblePanels.forEach((panel) => {
        if (panel !== expandedVisible) {
          setExpanded(panel, false);
        }
      });
      return;
    }

    setExpanded(visiblePanels[0], true);
    visiblePanels.slice(1).forEach((panel) => setExpanded(panel, false));
  }

  panels.forEach((panel) => {
    const toggle = panel.querySelector('.remote-panel-toggle');
    if (!toggle) {
      return;
    }
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        setExpanded(panel, false);
        return;
      }
      collapseOthers(panel);
      setExpanded(panel, true);
    });
  });

  ensureValidExpanded();

  return {
    syncVisiblePanels: ensureValidExpanded,
  };
}

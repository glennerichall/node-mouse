export async function executeWaylandCommand(services, {action = 'status'} = {}) {
  const desktopController = services.getDesktopController();
  const capabilities = desktopController?.getCapabilities?.();

  if (!String(capabilities?.adapter || '').startsWith('wayland')) {
    return {
      ok: false,
      message: 'Le controleur Wayland n est pas actif dans cette session.',
    };
  }

  if (action === 'authorize') {
    await desktopController.authorize();
    return {
      ok: true,
      message: capabilities.adapter === 'wayland-uinput'
        ? 'Controle uinput Wayland demarre; aucun dialogue systeme n est requis.'
        : 'Demande d autorisation Wayland ouverte sur le bureau local.',
    };
  }

  if (action === 'stop') {
    await desktopController.close();
    return {
      ok: true,
      message: 'Session Wayland arretee.',
    };
  }

  if (action === 'status') {
    return {
      ok: true,
      message: JSON.stringify(capabilities),
    };
  }

  return {
    ok: false,
    message: `Action Wayland inconnue: ${action}`,
  };
}

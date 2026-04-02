function buildHelpMessage() {
  return [
    'Commandes disponibles:',
    '  help     Affiche cette aide',
    '  config   Affiche la configuration persistée effective',
    '  open-qr  Ouvre la page du code QR sur le serveur',
    '  qr       Alias de open-qr',
  ].join('\n');
}

function normalizeCommand(input) {
  return String(input || '').trim().toLowerCase();
}

export async function executeCliCommand(services, input) {
  const command = normalizeCommand(input);

  if (!command || command === 'help') {
    return {
      ok: true,
      message: buildHelpMessage(),
    };
  }

  if (command === 'open-qr' || command === 'qr') {
    const result = await services.getRemotes().adminActions.openQrBrowserServer();
    return {
      ok: Boolean(result?.ok),
      message: String(result?.message || 'Commande executee.'),
    };
  }

  if (command === 'config') {
    return {
      ok: true,
      message: 'Configuration persistée effective.',
      data:{
        ...services.getConfig(),
        ...services.getSystemConfig()
      },
    };
  }

  return {
    ok: false,
    message: `Commande inconnue: ${command}`,
  };
}

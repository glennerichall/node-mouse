export async function executeHelpCommand() {
  return {
    ok: true,
    message: [
      'Commandes disponibles:',
      'remote-mouse help',
      'remote-mouse config',
      'remote-mouse config get <path>',
      'remote-mouse config set <path> <value>',
      'remote-mouse sys-config',
      'remote-mouse system-config',
      'remote-mouse info',
      'remote-mouse system-info',
      'remote-mouse service <install|disable|uninstall|restart>',
      'remote-mouse tasks',
      'remote-mouse task-manager',
      'remote-mouse samsung-detect',
      'remote-mouse tokens',
      'remote-mouse open-qr',
      'remote-mouse qr',
    ].join('\n'),
  };
}

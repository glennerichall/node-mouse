export async function executeServiceCommand(services, args = {}) {
  if (args.action === 'install') {
    return services.getApplicationDaemonService().install();
  }

  if (args.action === 'disable') {
    return services.getApplicationDaemonService().disable();
  }

  if (args.action === 'uninstall') {
    return services.getApplicationDaemonService().uninstall();
  }

  if (args.action === 'restart') {
    return services.getApplicationDaemonService().restart({
      cause: 'user',
      source: 'cli',
    });
  }

  return {
    ok: false,
    message: `Action service inconnue: ${String(args.action || '').trim() || '(vide)'}`,
  };
}

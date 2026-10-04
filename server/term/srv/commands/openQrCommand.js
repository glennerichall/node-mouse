export async function executeOpenQrCommand(services) {
  const result = await services.getRemotes().qrActions.openQrBrowserServer();
  return {
    ok: Boolean(result?.ok),
    message: String(result?.message || 'Commande executee.'),
  };
}

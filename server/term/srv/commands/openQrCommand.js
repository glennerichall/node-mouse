export async function executeOpenQrCommand(services) {
  const result = await services.getRemotes().adminActions.openQrBrowserServer();
  return {
    ok: Boolean(result?.ok),
    message: String(result?.message || 'Commande executee.'),
  };
}

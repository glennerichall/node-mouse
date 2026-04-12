export async function executeInfoCommand(services) {
  return {
    ok: true,
    message: 'Capacites du serveur.',
    data: await services.getSystem().getInfo(),
  };
}

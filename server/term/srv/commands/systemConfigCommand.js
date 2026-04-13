export async function executeSystemConfigCommand(services) {
  return {
    ok: true,
    message: 'Configuration système.',
    data: services.getSystemConfig(),
  };
}

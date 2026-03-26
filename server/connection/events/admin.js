export function createAdminEventRegister({ adminActions }) {
  return function registerAdminEvents(socket) {
    socket.on('admin:update-check', async () => {
      console.log(`Client ${socket.id.slice(0, 8)} demande update check.`);
      const result = await adminActions.forceUpdateCheck();
      socket.emit('admin:result', {
        action: 'update-check',
        ok: result.ok,
        message: result.message,
      });
    });

    socket.on('admin:update-install', async () => {
      console.log(`Client ${socket.id.slice(0, 8)} demande update install.`);
      const result = await adminActions.installUpdate();
      socket.emit('admin:result', {
        action: 'update-install',
        ok: result.ok,
        message: result.message,
      });
    });

    socket.on('admin:service-restart', async () => {
      console.log(`Client ${socket.id.slice(0, 8)} demande service restart.`);
      const result = await adminActions.restartService();
      socket.emit('admin:result', {
        action: 'service-restart',
        ok: result.ok,
        message: result.message,
      });
    });
  };
}

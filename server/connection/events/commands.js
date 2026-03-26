export function createCommandEventRegister({ browser }) {
  return function registerCommandEvents(socket) {
    socket.on('browser:brave', async () => {
      console.log(`Client ${socket.id.slice(0, 8)} demande Brave.`);
      await browser.focusOrLaunchBrave();
    });
  };
}

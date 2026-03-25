export function registerSocketHandlers(io, { mouse, keyboard, browser }) {
  io.on('connection', (socket) => {
    console.log(`Client connecté: ${socket.id}`);

    socket.on('mouse:move', (payload = {}) => {
      const dx = Number(payload.dx) || 0;
      const dy = Number(payload.dy) || 0;
      mouse.move(dx, dy);
    });

    socket.on('mouse:click', (payload = {}) => {
      mouse.click(payload.button);
    });

    socket.on('mouse:scroll', (payload = {}) => {
      const dy = Number(payload.dy) || 0;
      mouse.scroll(dy);
    });

    socket.on('keyboard:text', (payload = {}) => {
      keyboard.typeText(payload.text);
    });

    socket.on('keyboard:key', (payload = {}) => {
      keyboard.pressSpecialKey(payload.key, payload.modifiers);
    });

    socket.on('browser:brave', async () => {
      await browser.focusOrLaunchBrave();
    });

    socket.on('disconnect', () => {
      console.log(`Client déconnecté: ${socket.id}`);
    });
  });
}

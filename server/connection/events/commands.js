import {createLogger} from '../../log/logger.js';

const log = createLogger('events:commands');

export function createCommandEventRegistrar({ browser }) {
  return function registerCommandEvents(socket) {
    socket.on('browser:brave', async () => {
      log.info({ client: socket.id.slice(0, 8) }, 'Demande browser:brave');
      await browser.focusOrLaunchBrave();
    });
  };
}

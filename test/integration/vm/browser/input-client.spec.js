import {expect, test} from '@playwright/test';

test('sends mouse and keyboard commands through the shipped Socket.IO client', async ({page}) => {
  await page.goto('/api/sessions/vm-integration-token');
  await expect(page.locator('#connection-overlay')).toBeHidden();

  await page.evaluate(async () => {
    const socket = window.io({transports: ['websocket']});
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    socket.emit('mouse:move', {dx: 14, dy: -9, timestamp: Date.now()});
    socket.emit('mouse:click', {button: 'left', timestamp: Date.now()});
    socket.emit('keyboard:text', {text: 'a', timestamp: Date.now()});
    socket.emit('keyboard:key', {key: 'enter', timestamp: Date.now()});
    await new Promise((resolve) => setTimeout(resolve, 250));
    socket.close();
  });
});

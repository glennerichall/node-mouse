import {expect, test} from '@playwright/test';

test('sends mouse and keyboard commands through the shipped Socket.IO client', async ({page}) => {
  if (process.env.REMOTE_MOUSE_VM_ASSERT_PREVIEW === 'true') {
    await page.addInitScript(() => { globalThis.__REMOTE_MOUSE_ASSERT_PREVIEW__ = true; });
  }
  const token = process.env.REMOTE_MOUSE_VM_TOKEN || 'vm-integration-token';
  await page.goto(`/api/sessions/${token}`);
  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.locator('main')).toBeVisible();

  const result = await page.evaluate(async () => {
    const socket = window.io({transports: ['websocket']});
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    const previewFrame = globalThis.__REMOTE_MOUSE_ASSERT_PREVIEW__
      ? new Promise((resolve) => {
          socket.once('preview:frame', () => resolve(true));
          setTimeout(() => resolve(false), 10_000);
        })
      : Promise.resolve(false);
    if (globalThis.__REMOTE_MOUSE_ASSERT_PREVIEW__) {
      socket.emit('preview:start', {ts: Date.now()});
    }
    socket.emit('mouse:move', {dx: 14, dy: -9, ts: Date.now()});
    socket.emit('keyboard:text', {text: 'a', ts: Date.now()});
    socket.emit('keyboard:key', {key: 'enter', ts: Date.now()});
    socket.emit('mouse:click', {button: 'left', ts: Date.now()});
    const receivedPreview = await previewFrame;
    socket.close();
    return {receivedPreview};
  });

  if (process.env.REMOTE_MOUSE_VM_ASSERT_PREVIEW === 'true') {
    expect(result.receivedPreview).toBe(true);
  }
});

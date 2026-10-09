import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';
import {createQrOverlay} from '../../server/services/overlay/createQrOverlay.js';
import {createLinuxQrOverlayAdapter} from '../../server/os/linux/overlay/createLinuxQrOverlayAdapter.js';
import {createWin32QrOverlayAdapter} from '../../server/os/win32/overlay/createWin32QrOverlayAdapter.js';

function createServices() {
  return {
    getConfig: () => ({qrOverlay: {
      enabled: true,
      size: 175,
      margin: 12,
      topOffsetPx: 8,
      hoverShowDelayMs: 900,
      autoHideOnHover: true,
    }}),
    getSystem: () => ({getScreenInfo: async () => ({width: 1920, height: 1080})}),
    getUrls: () => ({entryUrl: 'http://example.test/session'}),
  };
}

describe('QR overlay OS adapters', () => {
  it('re-shows the QR when toggle is called while hover has temporarily hidden it', async () => {
    let helperState = 'starting';
    const client = {
      show: jest.fn(() => { helperState = 'visible'; }),
      hide: jest.fn(() => { helperState = 'hidden'; }),
      update: jest.fn(),
      close: jest.fn(),
      getState: jest.fn(() => helperState),
      process: {once: jest.fn()},
    };
    const adapter = createLinuxQrOverlayAdapter({
      access: async () => {},
      helperPath: '/app/overlay',
      createClient: () => client,
    });
    const overlay = await createQrOverlay(createServices(), {
      adapter,
      qrPath: '/tmp/qr.png',
      writeQr: jest.fn(async () => {}),
      log: {warn: jest.fn()},
    });

    await overlay.show();
    helperState = 'hover-hidden';

    await expect(overlay.toggle()).resolves.toBe(true);
    expect(client.show).toHaveBeenCalledTimes(2);
    expect(client.hide).not.toHaveBeenCalled();
  });

  it('keeps a hide requested during a QR refresh after that refresh completes', async () => {
    let finishQrWrite;
    let qrWriteStarted;
    let writeCount = 0;
    const started = new Promise((resolve) => { qrWriteStarted = resolve; });
    const operations = [];
    const client = {
      show: jest.fn(() => operations.push('show')),
      hide: jest.fn(() => operations.push('hide')),
      update: jest.fn(() => operations.push('update')),
      close: jest.fn(),
      getState: jest.fn(() => 'visible'),
      process: {once: jest.fn()},
    };
    const overlay = await createQrOverlay(createServices(), {
      adapter: createLinuxQrOverlayAdapter({
        access: async () => {}, helperPath: '/app/overlay', createClient: () => client,
      }),
      qrPath: '/tmp/qr.png',
      writeQr: () => {
        writeCount += 1;
        if (writeCount === 1) return Promise.resolve();
        qrWriteStarted();
        return new Promise((resolve) => { finishQrWrite = resolve; });
      },
      log: {warn: jest.fn()},
    });

    await overlay.show();
    operations.length = 0;
    const showing = overlay.show();
    await started;
    const hiding = overlay.hide();
    finishQrWrite();
    await Promise.all([showing, hiding]);

    expect(operations).toEqual(['update', 'show', 'hide']);
  });

  it('runs the common service contract against the Linux adapter', async () => {
    const client = {
      show: jest.fn(),
      hide: jest.fn(),
      update: jest.fn(),
      close: jest.fn(),
      getState: jest.fn(() => 'visible'),
      process: {once: jest.fn()},
    };
    const createClient = jest.fn(() => client);
    const adapter = createLinuxQrOverlayAdapter({
      access: async () => {},
      helperPath: '/app/overlay',
      createClient,
    });
    const overlay = await createQrOverlay(createServices(), {
      adapter,
      qrPath: '/tmp/qr.png',
      writeQr: jest.fn(async () => {}),
      log: {warn: jest.fn()},
    });

    await overlay.show();
    expect(overlay.managesHover).toBe(true);
    expect(overlay.getBounds()).toEqual({x: 1733, y: 20, width: 175, height: 175});
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
      x: 1733, y: 20, size: 175, showDelayMs: 900, autoHide: true,
    }), {helperPath: '/app/overlay'});

    await overlay.update();
    expect(client.update).toHaveBeenCalledWith(expect.objectContaining({
      x: 1733, y: 20, size: 175, showDelayMs: 900, autoHide: true,
    }));
  });

  it('runs the common service contract against the Windows adapter', async () => {
    const child = new EventEmitter();
    child.killed = false;
    child.kill = jest.fn();
    const writeFile = jest.fn();
    const spawnScript = jest.fn(() => child);
    const adapter = createWin32QrOverlayAdapter({
      writeFile,
      spawnScript,
      scriptPath: 'C:\\Temp\\remote-mouse-overlay.ps1',
    });
    const overlay = await createQrOverlay(createServices(), {
      adapter,
      qrPath: 'C:\\Temp\\qr.png',
      writeQr: jest.fn(async () => {}),
      log: {warn: jest.fn()},
    });

    await overlay.show();
    expect(overlay.managesHover).toBe(false);
    expect(overlay.getBounds()).toEqual({x: 1733, y: 12, width: 175, height: 175});
    expect(writeFile).toHaveBeenCalledWith(
      'C:\\Temp\\remote-mouse-overlay.ps1',
      expect.stringContaining('$form.ClientSize = New-Object System.Drawing.Size(175, 175)'),
      'utf8',
    );
    expect(spawnScript).toHaveBeenCalledWith('C:\\Temp\\remote-mouse-overlay.ps1');

    await overlay.hide();
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('returns a null overlay when the OS has no adapter', async () => {
    const overlay = await createQrOverlay({...createServices(), getOs: () => ({overlay: null})});
    expect(await overlay.show()).toBe(false);
  });
});

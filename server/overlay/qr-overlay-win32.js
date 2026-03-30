import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import {getConfig} from '../init/config/index.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('qr-overlay:win32');

function buildPowerShellScript({ qrPath, size, posX, posY }) {
  const escapedQrPath = String(qrPath).replace(/\\/g, '\\\\');
  return [
    'Add-Type -AssemblyName System.Windows.Forms',
    'Add-Type -AssemblyName System.Drawing',
    '$form = New-Object Windows.Forms.Form',
    "$form.StartPosition = 'Manual'",
    '$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None',
    '$form.TopMost = $true',
    '$form.ShowInTaskbar = $false',
    `$form.Width = ${size}`,
    `$form.Height = ${size}`,
    `$form.Left = ${posX}`,
    `$form.Top = ${posY}`,
    '$picture = New-Object Windows.Forms.PictureBox',
    '$picture.Dock = [System.Windows.Forms.DockStyle]::Fill',
    '$picture.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::StretchImage',
    `$picture.Image = [System.Drawing.Image]::FromFile("${escapedQrPath}")`,
    '$form.Controls.Add($picture)',
    '[System.Windows.Forms.Application]::Run($form)',
  ].join('\n');
}

function spawnPowerShell(scriptPath) {
  return spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    { stdio: 'ignore' },
  );
}

export async function startQrOverlayWin32({ getUrl, robot }) {
  const config = getConfig();
  const isSupported = config.qrOverlay.enabled && os.platform() === 'win32';
  if (!isSupported) {
    return {
      close: () => {},
      refresh: async () => {},
      show: async () => false,
      hide: () => false,
      toggle: async () => false,
      isVisible: () => false,
    };
  }

  const size = config.qrOverlay.size;
  const margin = config.qrOverlay.margin;
  const qrPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.png');
  const scriptPath = path.join(os.tmpdir(), 'remote-mouse-qr-overlay.ps1');
  let child = null;
  let refreshChain = Promise.resolve();
  let visible = true;

  const close = () => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
    child = null;
  };

  async function spawnOverlay() {
    await QRCode.toFile(qrPath, getUrl(), { width: size, margin: 1 });

    const screen = robot.getScreenSize();
    const posX = Math.max(0, screen.width - size - margin);
    const posY = Math.max(0, margin);

    fs.writeFileSync(
      scriptPath,
      buildPowerShellScript({ qrPath, size, posX, posY }),
      'utf8',
    );

    child = spawnPowerShell(scriptPath);
    child.once('error', (error) => {
      log.warn({ err: error }, 'Impossible de lancer PowerShell pour QR overlay');
    });
    log.debug({ url: getUrl() }, 'QR overlay Windows rafraîchi');
  }

  const refresh = async () => {
    if (!visible) {
      return;
    }

    refreshChain = refreshChain
      .then(async () => {
        close();
        await spawnOverlay();
      })
      .catch((_error) => {});

    await refreshChain;
  };

  const hide = () => {
    visible = false;
    close();
    return visible;
  };

  const show = async () => {
    visible = true;
    await refresh();
    return visible;
  };

  const toggle = async () => {
    if (visible) {
      hide();
      return visible;
    }
    await show();
    return visible;
  };

  await refresh();

  return {
    close,
    refresh,
    show,
    hide,
    toggle,
    isVisible: () => visible,
  };
}

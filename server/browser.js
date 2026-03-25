import os from 'os';
import { execFile } from 'child_process';

function execFileAsync(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 3000 }, (error, stdout = '', stderr = '') => {
      resolve({ ok: !error, stdout, stderr });
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function commandExists(command) {
  const result = await execFileAsync('which', [command]);
  return result.ok;
}

async function isBraveRunningLinux() {
  const checks = [
    await execFileAsync('pgrep', ['-x', 'brave-browser']),
    await execFileAsync('pgrep', ['-x', 'brave']),
    await execFileAsync('pgrep', ['-f', 'brave-browser']),
  ];
  return checks.some((result) => result.ok);
}

function parseWmctrlWindowIds(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => /brave/i.test(line))
    .map((line) => line.split(/\s+/)[0])
    .filter((id) => /^0x[0-9a-f]+$/i.test(id));
}

async function focusBraveWithWmctrl() {
  if (!(await commandExists('wmctrl'))) {
    return false;
  }

  const list = await execFileAsync('wmctrl', ['-lx']);
  if (!list.ok) {
    return false;
  }

  const windowIds = parseWmctrlWindowIds(list.stdout);
  if (windowIds.length === 0) {
    return false;
  }

  const target = windowIds[0];
  const activate = await execFileAsync('wmctrl', ['-ia', target]);
  if (!activate.ok) {
    return false;
  }

  await execFileAsync('wmctrl', ['-ir', target, '-b', 'add,maximized_vert,maximized_horz']);
  return true;
}

async function focusBraveWithXdotool() {
  if (!(await commandExists('xdotool'))) {
    return false;
  }

  const searchClassVisible = await execFileAsync('xdotool', ['search', '--onlyvisible', '--class', 'brave']);
  const searchNameVisible = await execFileAsync('xdotool', ['search', '--onlyvisible', '--name', 'Brave']);
  const searchClassAny = await execFileAsync('xdotool', ['search', '--class', 'brave']);
  const searchNameAny = await execFileAsync('xdotool', ['search', '--name', 'Brave']);
  const idsRaw = `${searchClassVisible.stdout}\n${searchNameVisible.stdout}\n${searchClassAny.stdout}\n${searchNameAny.stdout}`;
  const ids = idsRaw
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));

  if (ids.length === 0) {
    return false;
  }

  const target = ids[0];
  const activated = await execFileAsync('xdotool', ['windowactivate', '--sync', target]);
  if (!activated.ok) {
    return false;
  }

  await execFileAsync('xdotool', ['windowraise', target]);

  // Maximize when possible via wmctrl if installed.
  if (await commandExists('wmctrl')) {
    await execFileAsync('wmctrl', ['-ir', target, '-b', 'add,maximized_vert,maximized_horz']);
  }

  return true;
}

async function focusOrMaximizeBraveLinux() {
  if (await focusBraveWithWmctrl()) {
    return true;
  }

  if (await focusBraveWithXdotool()) {
    return true;
  }

  return false;
}

async function ensureFocusedAndMaximizedAfterLaunch() {
  // Au demarrage, la fenetre peut apparaitre apres plusieurs centaines de ms.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const done = await focusOrMaximizeBraveLinux();
    if (done) {
      return true;
    }
    await sleep(350);
  }
  return false;
}

export function createBrowserController() {
  let inFlight = false;

  async function tryLaunchBrave() {
    const launchers = [
      ['brave-browser', []],
      ['brave', []],
      ['flatpak', ['run', 'com.brave.Browser']],
    ];

    for (const [command, args] of launchers) {
      const result = await execFileAsync(command, args);
      if (result.ok) {
        return true;
      }
    }

    return false;
  }

  async function focusOrLaunchBrave() {
    if (inFlight) {
      return;
    }
    inFlight = true;

    try {
      const platform = os.platform();

      if (platform === 'linux') {
        const running = await isBraveRunningLinux();

        if (running) {
          await focusOrMaximizeBraveLinux();
          // Brave deja lance: on ne cree jamais une deuxieme instance ici.
          return;
        }

        const launched = await tryLaunchBrave();
        if (launched) {
          await sleep(400);
          await ensureFocusedAndMaximizedAfterLaunch();
        }
        return;
      }

      if (platform === 'darwin') {
        await execFileAsync('open', ['-a', 'Brave Browser']);
        return;
      }

      if (platform === 'win32') {
        await execFileAsync('powershell', ['-NoProfile', '-Command', 'Start-Process brave']);
      }
    } finally {
      inFlight = false;
    }
  }

  return { focusOrLaunchBrave };
}

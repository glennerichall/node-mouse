import {readFile} from 'node:fs/promises';

describe('Vagrant laboratory', () => {
  test('declares the pinned Linux machine directly in Vagrant', async () => {
    const vagrantfile = await readFile('dev/vagrant/Vagrantfile', 'utf8');

    expect(vagrantfile).toContain('config.vm.define "linux-install"');
    expect(vagrantfile).toContain('guest.vm.box = "cloud-image/ubuntu-24.04"');
    expect(vagrantfile).toMatch(/guest\.vm\.box_version = "\d+\.\d+\.\d+"/);
    expect(vagrantfile).toContain('name: "install-remote-mouse"');
    expect(vagrantfile).not.toContain('config.local.yml');
    expect(vagrantfile).not.toContain('profiles.yml');
  });

  test('declares X11 and opt-in Windows 11 targets', async () => {
    const vagrantfile = await readFile('dev/vagrant/Vagrantfile', 'utf8');

    expect(vagrantfile).toContain('config.vm.define "linux-x11"');
    expect(vagrantfile).toContain('prepare-linux-x11.sh');
    expect(vagrantfile).toContain('config.vm.define "windows-11", autostart: false');
    expect(vagrantfile).toContain('ENV.fetch("REMOTE_MOUSE_WINDOWS_BOX"');
    expect(vagrantfile).toContain('provider.tpm_version = "2.0"');
    expect(vagrantfile).toContain('provider.loader = ENV.fetch("REMOTE_MOUSE_UEFI_LOADER"');
  });

  test('keeps VM assertions in Jest and browser behavior in Playwright', async () => {
    const integration = await readFile('test/integration/vm/linux-install.test.js', 'utf8');
    const browser = await readFile('test/integration/vm/browser/input-client.spec.js', 'utf8');

    expect(integration).toContain("describe('Ubuntu installation guest'");
    expect(integration).toContain('evtest');
    expect(browser).toContain("socket.emit('mouse:move'");
    expect(browser).toContain("socket.emit('keyboard:text'");
  });

  test('aggregates unit, browser and VM integration suites', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    expect(packageJson.scripts['test:all'])
      .toBe('npm test && npm run test:e2e && npm run test:integration');
    expect(packageJson.scripts['test:integration']).toBe('npm run test:vm');
    expect(packageJson.scripts['test:vm']).toContain('vagrant up --no-provision linux-install');
    expect(packageJson.scripts['test:vm']).toContain('jest --config jest.vm.config.js');
  });

  test('keeps local VM state and media out of packages and Git', async () => {
    const gitignore = await readFile('.gitignore', 'utf8');
    const npmignore = await readFile('.npmignore', 'utf8');

    expect(gitignore).toContain('dev/vagrant/.vagrant/');
    expect(gitignore).toContain('dev/vagrant/images/');
    expect(gitignore).toContain('dev/vagrant/iso/');
    expect(gitignore).toContain('dev/vagrant/artifacts/');
    expect(npmignore).toMatch(/^dev\/$/m);
  });
});

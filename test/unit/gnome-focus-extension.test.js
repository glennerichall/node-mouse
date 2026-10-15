import {installGnomeFocusExtension, GNOME_FOCUS_EXTENSION_ID} from '../../server/term/cli/setup/gnomeFocusExtension.js';

describe('GNOME focus extension installation', () => {
  it('packages an extension bundle before installing and enabling it', async () => {
    const calls = [];
    const result = await installGnomeFocusExtension({
      root: '/project',
      env: {HOME: '/home/test'},
      runCommand: async (command, args) => {
        calls.push([command, args]);
        if (args[0] === 'list') return {ok: true, stdout: `${GNOME_FOCUS_EXTENSION_ID}\n`};
        return {ok: true, stdout: ''};
      },
    });

    expect(result).toEqual({ok: true, message: 'GNOME browser window focus extension enabled.'});
    expect(calls).toHaveLength(4);
    expect(calls[0][0]).toBe('gnome-extensions');
    expect(calls[0][1].slice(0, 3)).toEqual(['pack', '--force', '--out-dir']);
    expect(calls[1][1]).toEqual([
      'install', '--force', '--print-uuid', expect.stringMatching(/remote-mouse-focus@velor\.shell-extension\.zip$/),
    ]);
    expect(calls[2][1]).toEqual(['list', '--user']);
    expect(calls[3][1]).toEqual(['enable', GNOME_FOCUS_EXTENSION_ID]);
  });

  it('does not enable an extension GNOME failed to register', async () => {
    const commands = [];
    const result = await installGnomeFocusExtension({
      runCommand: async (command, args) => {
        commands.push([command, args]);
        return args[0] === 'list'
          ? {ok: true, stdout: ''}
          : {ok: true, stdout: ''};
      },
    });

    expect(result).toEqual({ok: false, message: 'GNOME did not register the focus extension after installation.'});
    expect(commands.at(-1)[1]).toEqual(['list', '--user']);
  });
});

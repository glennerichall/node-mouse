import {readFile} from 'node:fs/promises';

describe('uinput native device declaration', () => {
  it('declares distinct pointer and keyboard devices', async () => {
    const source = await readFile('native/uinput/remote-mouse-uinput.c', 'utf8');

    expect(source).toContain('Remote Mouse Virtual Mouse');
    expect(source).toContain('Remote Mouse Virtual Keyboard');
    expect(source).toContain('emit_event(pointer_fd, EV_REL, REL_X');
    expect(source).toContain('emit_input_key(env, info, keyboard_fd)');
    expect(source).not.toContain('Remote Mouse Virtual Input');
  });
});

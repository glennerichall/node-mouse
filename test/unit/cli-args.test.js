import {parseCliArgs} from '../../server/term/cli/parseCliArgs.js';

describe('cli args parser', () => {
  it.each([
    [['info', '--verbosity', '2'], {command: {name: 'info', args: {}}, options: {verbosity: 2}}],
    [['info', '-v'], {command: {name: 'info', args: {}}, options: {verbosity: 1}}],
    [['config'], {command: {name: 'config', args: {action: '', path: '', value: ''}}, options: {verbosity: 0}}],
    [['config', 'get', 'preview.fps'], {command: {name: 'config', args: {action: 'get', path: 'preview.fps', value: ''}}, options: {verbosity: 0}}],
    [['config', 'set', 'preview.fps', '12'], {command: {name: 'config', args: {action: 'set', path: 'preview.fps', value: '12'}}, options: {verbosity: 0}}],
    [['service', 'restart'], {command: {name: 'service', args: {action: 'restart'}}, options: {verbosity: 0}}],
    [['open-qr'], {command: {name: 'open-qr', args: {}}, options: {verbosity: 0}}],
    [['qr'], {command: {name: 'qr', args: {}}, options: {verbosity: 0}}],
  ])('parses %j', (args, expected) => {
    expect(parseCliArgs(args)).toEqual(expected);
  });
});

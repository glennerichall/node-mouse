import {parseCliArgs} from '../../server/cli/parseCliArgs.js';

describe('cli args parser', () => {
  it.each([
    [['info', '--verbosity', '2'], {command: {name: 'info', args: {}}, options: {verbosity: 2}}],
    [['info', '-v'], {command: {name: 'info', args: {}}, options: {verbosity: 1}}],
    [['config'], {command: {name: 'config', args: {action: '', path: '', value: ''}}, options: {verbosity: 0}}],
    [['config', 'get', 'logging.level'], {command: {name: 'config', args: {action: 'get', path: 'logging.level', value: ''}}, options: {verbosity: 0}}],
    [['config', 'set', 'logging.level', 'debug'], {command: {name: 'config', args: {action: 'set', path: 'logging.level', value: 'debug'}}, options: {verbosity: 0}}],
    [['service', 'restart'], {command: {name: 'service', args: {action: 'restart'}}, options: {verbosity: 0}}],
    [['open-qr'], {command: {name: 'open-qr', args: {}}, options: {verbosity: 0}}],
    [['qr'], {command: {name: 'qr', args: {}}, options: {verbosity: 0}}],
  ])('parses %j', (args, expected) => {
    expect(parseCliArgs(args)).toEqual(expected);
  });
});

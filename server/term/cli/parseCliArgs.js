import yargs from 'yargs/yargs.js';

function normalizeVerbosity(value) {
  return Math.max(0, Number.parseInt(value || 0, 10) || 0);
}

function joinParts(parts) {
  return parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

export function parseCliArgs(args) {
  let command = {
    name: '',
    args: {},
  };

  const parsed = yargs(args)
    .scriptName('remote-mouse')
    .help(false)
    .version(false)
    .parserConfiguration({
      'camel-case-expansion': false,
      'strip-aliased': true,
      'strip-dashed': true,
    })
    .option('verbosity', {
      type: 'number',
      default: 0,
      describe: 'Niveau de verbosite des logs pour la commande CLI.',
    })
    .count('v')
    .command('help', false, () => {}, () => {
      command = {name: 'help', args: {}};
    })
    .command('config [action] [path] [value..]', false, (builder) => builder
      .positional('action', {type: 'string'})
      .positional('path', {type: 'string'})
      .positional('value', {array: true}), (argv) => {
      command = {
        name: 'config',
        args: {
          action: String(argv.action || '').trim(),
          path: String(argv.path || '').trim(),
          value: joinParts(argv.value || []),
        },
      };
    })
    .command('sys-config', false, () => {}, () => {
      command = {name: 'sys-config', args: {}};
    })
    .command('info', false, () => {}, () => {
      command = {name: 'info', args: {}};
    })
    .command('system-info', false, () => {}, () => {
      command = {name: 'system-info', args: {}};
    })
    .command('service <action>', false, (builder) => builder
      .positional('action', {type: 'string'}), (argv) => {
      command = {
        name: 'service',
        args: {
          action: String(argv.action || '').trim(),
        },
      };
    })
    .command('tasks', false, () => {}, () => {
      command = {name: 'tasks', args: {}};
    })
    .command('task-manager', false, () => {}, () => {
      command = {name: 'task-manager', args: {}};
    })
    .command('samsung-detect', false, () => {}, () => {
      command = {name: 'samsung-detect', args: {}};
    })
    .command('tokens', false, () => {}, () => {
      command = {name: 'tokens', args: {}};
    })
    .command('open-qr', false, () => {}, () => {
      command = {name: 'open-qr', args: {}};
    })
    .command('qr', false, () => {}, () => {
      command = {name: 'qr', args: {}};
    })
    .parse();

  return {
    command,
    options: {
      verbosity: Math.max(normalizeVerbosity(parsed.verbosity), normalizeVerbosity(parsed.v)),
    },
  };
}

export function formatCliCommand(command) {
  if (!command || typeof command !== 'object') {
    return '';
  }

  if (command.name === 'config') {
    return joinParts(['config', command.args?.action, command.args?.path, command.args?.value]);
  }
  if (command.name === 'service') {
    return joinParts(['service', command.args?.action]);
  }

  return String(command.name || '').trim();
}

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
  if (args.length === 1 && ['--version', '-V'].includes(args[0])) {
    return {
      command: {name: 'version', args: {}},
      options: {verbosity: 0},
    };
  }

  let command = {
    name: '',
    args: {},
  };
  let setupOptions = {};

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
    .command('version', false, () => {}, () => {
      command = {name: 'version', args: {}};
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
    .command('system-config', false, () => {}, () => {
      command = {name: 'system-config', args: {}};
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
    .command('setup', false, (builder) => builder
      .option('yes', {alias: 'y', type: 'boolean', default: false})
      .option('service', {type: 'boolean', default: true})
      .option('configure-uinput', {type: 'boolean', default: false})
      .option('config-dir', {type: 'string'})
      .option('port', {type: 'number'}), (argv) => {
      command = {name: 'setup', args: {}};
      setupOptions = {
        yes: Boolean(argv.yes),
        noService: argv.service === false,
        configureUinput: Boolean(argv['configure-uinput']),
        configDir: String(argv['config-dir'] || '').trim(),
        port: argv.port,
      };
    })
    .command('tasks', false, () => {}, () => {
      command = {name: 'tasks', args: {}};
    })
    .command('task-manager', false, () => {}, () => {
      command = {name: 'task-manager', args: {}};
    })
    .command('update-events', false, () => {}, () => {
      command = {name: 'update-events', args: {}};
    })
    .command('samsung-detect', false, () => {}, () => {
      command = {name: 'samsung-detect', args: {}};
    })
    .command('tokens', false, () => {}, () => {
      command = {name: 'tokens', args: {}};
    })
    .command('wayland [action]', false, (builder) => builder
      .positional('action', {type: 'string', default: 'status'}), (argv) => {
      command = {
        name: 'wayland',
        args: {action: String(argv.action || 'status').trim()},
      };
    })
    .command('open-qr', false, () => {}, () => {
      command = {name: 'open-qr', args: {}};
    })
    .command('qr', false, () => {}, () => {
      command = {name: 'qr', args: {}};
    })
    .parse();

  const options = {
    verbosity: Math.max(normalizeVerbosity(parsed.verbosity), normalizeVerbosity(parsed.v)),
  };
  if (command.name === 'setup') options.setup = setupOptions;

  return {command, options};
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
  if (command.name === 'wayland') {
    return joinParts(['wayland', command.args?.action]);
  }

  return String(command.name || '').trim();
}

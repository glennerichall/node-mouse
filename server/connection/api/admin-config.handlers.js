import {buildConfigEntry} from './configs.js';
import {getManagedConfigContext} from './getManagedConfigContext.js';

function getPath(req) {
  return String(req.params.configId || '').trim();
}

function sendInvalidPath(res) {
  res.status(404).json({
    ok: false,
    message: 'Invalid config path.',
  });
}

export async function listConfigs(req, res) {
  const {services} = req;
  const {managedPaths, schema, defaults, config} = await getManagedConfigContext(services);

  res.json({
    configs: managedPaths.map((pathKey) => buildConfigEntry(pathKey, schema, config, defaults)),
    defaults,
    schema,
    managedPaths,
    systemConfig: {
      adminActionsEnabled: Boolean(services.getSystemConfig().adminActionsEnabled),
    },
  });
}

export async function getConfig(req, res) {
  const {services} = req;
  const pathKey = getPath(req);
  const {managedPaths, schema, defaults, config} = await getManagedConfigContext(services);

  if (!managedPaths.includes(pathKey)) {
    sendInvalidPath(res);
    return;
  }

  res.json({
    config: buildConfigEntry(pathKey, schema, config, defaults),
  });
}

export async function patchConfig(req, res) {
  const {services} = req;
  const {pathKey, value} = req.configPatch;

  try {
    if (value === null) {
      services.getConfigService().resetConfig(pathKey);
    } else {
      services.getConfigService().setConfig(pathKey, value);
    }

    const nextContext = await getManagedConfigContext(services);
    res.json({
      ok: true,
      message: 'Configuration updated.',
      config: buildConfigEntry(pathKey, nextContext.schema, nextContext.config, nextContext.defaults),
    });
  } catch (_error) {
    res.status(400).json({
      ok: false,
      message: 'Configuration invalide.',
    });
  }
}

export async function resetConfig(req, res) {
  const {services} = req;
  const pathKey = getPath(req);
  const {managedPaths, schema, defaults} = await getManagedConfigContext(services);

  if (!managedPaths.includes(pathKey)) {
    sendInvalidPath(res);
    return;
  }

  services.getConfigService().resetConfig(pathKey);
  const nextContext = await getManagedConfigContext(services);
  res.json({
    ok: true,
    message: `${pathKey} reset to default.`,
    config: buildConfigEntry(pathKey, schema, nextContext.config, defaults),
  });
}

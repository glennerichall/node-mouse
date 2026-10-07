import {jest} from '@jest/globals';
import {
  getConfig,
  listConfigs,
  patchConfig,
  resetConfig,
} from '../../server/connection/api/handlers/admin-config.handlers.js';

function response() {
  return {status: jest.fn().mockReturnThis(), json: jest.fn()};
}

function services() {
  return {
    getRemotes: () => ({vlc: {isAvailable: jest.fn().mockResolvedValue(true)}}),
    getConfig: jest.fn(() => ({preview: {fps: 6}, vlc: {enabled: true}})),
    getSystemConfig: () => ({adminActionsEnabled: true}),
    getConfigService: () => ({
      setConfig: jest.fn(),
      resetConfig: jest.fn(),
    }),
  };
}

describe('admin configuration handlers', () => {
  it('lists the managed configuration', async () => {
    const res = response();
    await listConfigs({services: services()}, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      managedPaths: expect.arrayContaining(['preview.fps']),
      systemConfig: {adminActionsEnabled: true},
    }));
  });

  it('returns 404 for an unknown configuration path', async () => {
    const res = response();
    await getConfig({params: {configId: 'unknown.path'}, services: services()}, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('persists a validated patch and returns the updated entry', async () => {
    const configServices = services();
    const setConfig = jest.fn();
    configServices.getConfigService = () => ({setConfig, resetConfig: jest.fn()});
    const res = response();

    await patchConfig({services: configServices, configPatch: {pathKey: 'preview.fps', value: 12}}, res);

    expect(setConfig).toHaveBeenCalledWith('preview.fps', 12);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ok: true}));
  });

  it('resets a managed configuration value', async () => {
    const configServices = services();
    const reset = jest.fn();
    configServices.getConfigService = () => ({setConfig: jest.fn(), resetConfig: reset});
    const res = response();

    await resetConfig({params: {configId: 'preview.fps'}, services: configServices}, res);

    expect(reset).toHaveBeenCalledWith('preview.fps');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ok: true}));
  });
});

import express from 'express';
import {jest} from '@jest/globals';
import {createPublicRouter} from '../../server/init/routers/public.router.js';
import {createProtectedRouter} from '../../server/init/routers/protected.router.js';

function markerRouter(path, value) {
  const router = express.Router();
  router.get(path, (_req, res) => res.json({value}));
  return router;
}

describe('API boundary routers', () => {
  it('keeps public mounts grouped under their original prefixes', () => {
    const staticShareRouter = markerRouter('/assets', 'static');
    const sessionRouter = markerRouter('/create', 'session');
    const qrPageHandler = jest.fn();
    const healthHandler = jest.fn();
    const router = createPublicRouter({staticShareRouter, sessionRouter, qrPageHandler, healthHandler});

    expect(router.stack[0].regexp.source.replaceAll('\\/', '/')).toContain('/api/sessions');
    expect(router.stack[0].handle).toBe(sessionRouter);
    expect(router.stack[1].handle).toBe(staticShareRouter);
    expect(router.stack[2].route.path).toBe('/qr');
    expect(router.stack[2].route.stack[0].handle).toBe(qrPageHandler);
    expect(router.stack[3].route.path).toBe('/health');
    expect(router.stack[3].route.stack[0].handle).toBe(healthHandler);
  });

  it('keeps protected mounts grouped and does not alter their prefixes', () => {
    const dependencies = {
      sessionManagementRouter: markerRouter('/current', 'session-management'),
      clientApiRouter: markerRouter('/config', 'client'),
      remotesRouter: markerRouter('/samsung/status', 'remote'),
      adminAuthRouter: markerRouter('/elevation', 'admin-auth'),
      adminApiRouter: markerRouter('/server-info', 'admin'),
      adminUiRouter: markerRouter('/config', 'admin-ui'),
    };
    const router = createProtectedRouter(dependencies);
    const prefixes = router.stack.slice(0, 6).map((layer) => layer.regexp.source.replaceAll('\\/', '/'));

    expect(prefixes).toEqual(expect.arrayContaining([
      expect.stringContaining('/api/sessions'),
      expect.stringContaining('/api/client'),
      expect.stringContaining('/api/remotes'),
      expect.stringContaining('/api/admin-auth'),
      expect.stringContaining('/api/admin'),
      expect.stringContaining('/ui/admin'),
    ]));
    expect(router.stack.map((layer) => layer.handle)).toEqual(expect.arrayContaining(Object.values(dependencies)));
  });
});

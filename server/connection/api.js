import express from 'express';
import { renderQrPage } from '../../utils/qr.js';

export function createApiRouter({ publicDir, clientDir, utilsDir, getPublicUrl, getQrDataUrl }) {
  const router = express.Router();

  router.use(express.static(publicDir));
  router.use('/client', express.static(clientDir));
  router.use('/utils', express.static(utilsDir));

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.get('/state', (_req, res) => {
    res.json({
      ok: true,
      publicUrl: getPublicUrl(),
      ts: Date.now(),
    });
  });

  router.get('/qr', (_req, res) => {
    res.type('html').send(
      renderQrPage({
        qrDataUrl: getQrDataUrl(),
        publicUrl: getPublicUrl(),
      }),
    );
  });

  return router;
}

import express from 'express';

export const remotesRouter = express.Router();

remotesRouter.get('/:remoteId/status', async (req, res) => {
    const {services} = req;
    const remoteId = String(req.params.remoteId || '').trim();

    if (remoteId === 'samsung') {
      const enabled = Boolean(services.getConfig()?.samsungTv?.enabled);
      const power = enabled
        ? await services.getRemotes().samsung.getPowerState({ maxAgeMs: 2500 })
        : 'disabled';

      res.json({
        remoteId,
        enabled,
        power,
      });
      return;
    }

    res.status(404).json({
      ok: false,
      message: 'Unknown remote.',
    });
});

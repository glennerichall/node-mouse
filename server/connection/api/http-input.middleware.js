import express from 'express';

export const HTTP_JSON_BODY_LIMIT_BYTES = 32 * 1024;
export const httpJsonBodyParser = express.json({limit: HTTP_JSON_BODY_LIMIT_BYTES});

export function createHttpErrorMiddleware({log}) {
  return function httpErrorMiddleware(error, req, res, _next) {
    const status = error?.type === 'entity.too.large'
      ? 413
      : error?.type === 'entity.parse.failed'
        ? 400
        : 500;
    log.warn({requestId: req.requestId, status}, 'Requête HTTP rejetée');
    res.status(status).json({
      ok: false,
      message: status === 413
        ? 'Corps de requête trop volumineux.'
        : status === 400
          ? 'Corps de requête invalide.'
          : 'Erreur interne.',
    });
  };
}

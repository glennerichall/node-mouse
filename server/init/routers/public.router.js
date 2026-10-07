import express from 'express';

export function createPublicRouter({staticShareRouter, sessionRouter, qrPageHandler, healthHandler}) {
  return express.Router()
    .use('/api/sessions', sessionRouter)
    .use(staticShareRouter)
    .get('/qr', qrPageHandler)
    .get('/health', healthHandler);
}

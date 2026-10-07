import express from 'express';

export function createProtectedRouter({
  sessionManagementRouter,
  clientApiRouter,
  remotesRouter,
  adminAuthRouter,
  adminApiRouter,
  adminUiRouter,
}) {
  return express.Router()
    .use('/api/sessions', sessionManagementRouter)
    .use('/api/client', clientApiRouter)
    .use('/api/remotes', remotesRouter)
    .use('/api/admin-auth', adminAuthRouter)
    .use('/api/admin', adminApiRouter)
    .use('/ui/admin', adminUiRouter);
}

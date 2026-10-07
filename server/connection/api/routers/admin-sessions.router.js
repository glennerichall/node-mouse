import express from 'express';
import {
  listDeviceSessions,
  revokeAllDeviceSessions,
  revokeDeviceSession,
} from '../handlers/admin-sessions.handlers.js';

export const adminSessionsRouter = express.Router()
  .get('/', listDeviceSessions)
  .delete('/', revokeAllDeviceSessions)
  .delete('/:sessionId', revokeDeviceSession);

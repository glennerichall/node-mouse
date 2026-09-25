import {PERMISSION_ADMIN_MANAGE} from '../../services/security/createAuthorizationService.js';

export function guardAdmin(req, res, next) {
  const decision = req.services.getAuthorization().authorize(req.securityContext, PERMISSION_ADMIN_MANAGE);
  if (!decision.allowed) {
    res.status(403).json({ok: false, message: 'Permission administrateur requise.'});
    return;
  }
  next();
}

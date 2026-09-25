import {createAuthorizationService, PERMISSION_ADMIN_MANAGE} from '../../server/services/security/createAuthorizationService.js';

describe('authorization service', () => {
  const authorization = createAuthorizationService();

  it('allows administrative permissions only to admins', () => {
    expect(authorization.authorize({role: 'admin'}, PERMISSION_ADMIN_MANAGE).allowed).toBe(true);
    expect(authorization.authorize({role: 'controller'}, PERMISSION_ADMIN_MANAGE).allowed).toBe(false);
    expect(authorization.authorize({}, PERMISSION_ADMIN_MANAGE).allowed).toBe(false);
  });
});

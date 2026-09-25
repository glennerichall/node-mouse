export const ACCESS_ROLE_CONTROLLER = 'controller';
export const ACCESS_ROLE_ADMIN = 'admin';

const ADMIN_PERMISSION = 'admin:manage';

export function createAuthorizationService() {
  function getRole(context) {
    return context?.role === ACCESS_ROLE_ADMIN ? ACCESS_ROLE_ADMIN : ACCESS_ROLE_CONTROLLER;
  }

  function can(context, permission) {
    if (permission === ADMIN_PERMISSION) {
      return getRole(context) === ACCESS_ROLE_ADMIN;
    }
    return false;
  }

  function authorize(context, permission) {
    return {allowed: can(context, permission), role: getRole(context), permission};
  }

  return {can, authorize, getRole};
}

export const PERMISSION_ADMIN_MANAGE = ADMIN_PERMISSION;

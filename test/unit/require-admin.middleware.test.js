import {jest} from '@jest/globals';
import {guardAdmin} from '../../server/connection/api/guard.admin.js';

describe('guardAdmin', () => {
  it('rejects a controller with HTTP 403', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const next = jest.fn();
    const req = {
      securityContext: {role: 'controller'},
      services: {getAuthorization: () => ({authorize: () => ({allowed: false})})},
    };

    guardAdmin(req, {status, json}, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ok: false, message: 'Permission administrateur requise.'});
    expect(next).not.toHaveBeenCalled();
  });

  it('continues for an admin', () => {
    const next = jest.fn();
    const req = {
      securityContext: {role: 'admin'},
      services: {getAuthorization: () => ({authorize: () => ({allowed: true})})},
    };

    guardAdmin(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

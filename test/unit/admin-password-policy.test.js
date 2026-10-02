import {
  getAdminPasswordMinLength,
  isAdminPasswordConfigured,
} from '../../server/services/security/adminPasswordPolicy.js';

describe('admin password policy', () => {
  it('defaults to 8 and bounds configured values', () => {
    expect(getAdminPasswordMinLength()).toBe(8);
    expect(getAdminPasswordMinLength(2)).toBe(4);
    expect(getAdminPasswordMinLength(500)).toBe(128);
  });

  it('uses the configured threshold to determine availability', () => {
    expect(isAdminPasswordConfigured({password: '123456', passwordMinLength: 6})).toBe(true);
    expect(isAdminPasswordConfigured({password: '12345', passwordMinLength: 6})).toBe(false);
  });
});

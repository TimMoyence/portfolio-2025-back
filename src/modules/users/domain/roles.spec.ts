import { VALID_ROLES, DEFAULT_SELF_REGISTRATION_ROLES } from './roles';

describe('roles', () => {
  it('ne declare que les roles encore servis par l API', () => {
    expect([...VALID_ROLES]).toEqual(['admin', 'teacher']);
  });

  it('n attribue aucun role a l inscription libre', () => {
    expect(DEFAULT_SELF_REGISTRATION_ROLES).toEqual([]);
  });
});

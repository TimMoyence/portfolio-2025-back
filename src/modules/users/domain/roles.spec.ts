import { VALID_ROLES, DEFAULT_SELF_REGISTRATION_ROLES } from './roles';

describe('roles', () => {
  it('devrait contenir tous les roles attendus', () => {
    expect(VALID_ROLES).toContain('budget');
    expect(VALID_ROLES).toContain('weather');
    expect(VALID_ROLES).toContain('sebastian');
    expect(VALID_ROLES).toContain('admin');
  });

  it('les roles par defaut doivent etre un sous-ensemble des roles valides', () => {
    for (const role of DEFAULT_SELF_REGISTRATION_ROLES) {
      expect(VALID_ROLES).toContain(role);
    }
  });

  it('les roles par defaut ne doivent pas inclure admin', () => {
    expect(DEFAULT_SELF_REGISTRATION_ROLES).not.toContain('admin');
  });
});

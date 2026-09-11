import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SessionCode } from './SessionCode';

describe('SessionCode', () => {
  it('genere un code de quatre chiffres', () => {
    const code = SessionCode.generate(() => 0.5);
    expect(code).toMatch(/^\d{4}$/);
  });

  it('genere un code deterministe pour une source aleatoire donnee', () => {
    expect(SessionCode.generate(() => 0)).toBe('1000');
    expect(SessionCode.generate(() => 0.9999999)).toBe('9999');
  });

  it('accepte un code valide', () => {
    expect(SessionCode.parse('4271')).toBe('4271');
  });

  it('refuse un code trop court', () => {
    expect(() => SessionCode.parse('427')).toThrow(DomainValidationError);
  });

  it('refuse un code non numerique', () => {
    expect(() => SessionCode.parse('42a1')).toThrow(DomainValidationError);
  });

  it('refuse un code commencant par zero', () => {
    expect(() => SessionCode.parse('0421')).toThrow(DomainValidationError);
  });
});

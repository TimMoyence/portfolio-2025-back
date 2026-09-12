import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { SessionCode } from './SessionCode';

const CODE_ATTENDU = /^[1-9]\d{3}$/;

describe('SessionCode', () => {
  it('genere un code de quatre chiffres', () => {
    const code = SessionCode.generate(() => 4500);
    expect(code).toMatch(CODE_ATTENDU);
  });

  it('couvre les deux bornes du tirage', () => {
    expect(SessionCode.generate(() => 0)).toBe('1000');
    expect(SessionCode.generate(() => 8999)).toBe('9999');
  });

  it('demande son tirage sur toute l etendue des codes', () => {
    const tirage = jest.fn().mockReturnValue(0);

    SessionCode.generate(tirage);

    expect(tirage).toHaveBeenCalledWith(9000);
  });

  it('ne tire pas le code sur une suite predictible', () => {
    const mathRandom = jest.spyOn(Math, 'random');

    const codes = Array.from({ length: 50 }, () => SessionCode.generate());

    expect(mathRandom).not.toHaveBeenCalled();
    codes.forEach((code) => expect(code).toMatch(CODE_ATTENDU));
    expect(new Set(codes).size).toBeGreaterThan(1);
    mathRandom.mockRestore();
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

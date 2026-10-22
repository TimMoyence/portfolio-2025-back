import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';
import { TelephoneOptionnel } from './telephone.decorator';

class SaisieTemoin {
  @TelephoneOptionnel('+33612345678', 30)
  phone?: string | null;
}

const accepteALaSaisie = (phone: unknown): boolean =>
  champsRefuses(SaisieTemoin, { phone }).length === 0;

describe('TelephoneOptionnel', () => {
  it.each(['+33 6 12 34 56 78', '00 33 (0)1 23 45 67 89', '01.23.45.67.89'])(
    'accepte %p a la saisie comme dans le domaine',
    (phone) => {
      expect([
        accepteALaSaisie(phone),
        PhoneNumber.parse(phone) !== null,
      ]).toEqual([true, true]);
    },
  );

  it.each(['abc', '12', '0012345', '00+33612345678', `+${'1'.repeat(16)}`])(
    'refuse %p a la saisie comme dans le domaine',
    (phone) => {
      expect([
        accepteALaSaisie(phone),
        PhoneNumber.parse(phone) !== null,
      ]).toEqual([false, false]);
    },
  );

  it.each([undefined, null, '', '   '])(
    'tient %p pour un téléphone absent',
    (phone) => {
      expect(accepteALaSaisie(phone)).toBe(true);
    },
  );

  it('borne la saisie quand une longueur est donnée', () => {
    const valideMaisLong = `+33${' .6'.repeat(10)}`;

    expect(PhoneNumber.parse(valideMaisLong)).not.toBeNull();
    expect(accepteALaSaisie(valideMaisLong)).toBe(false);
  });
});

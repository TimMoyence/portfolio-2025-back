import { FORMULAIRES_PUBLICS } from '../../../../test/helpers/formulaires-publics';
import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { ChampsAntiRobotDto } from './champs-anti-robot.dto';

const proprietesEnErreur = (corps: Record<string, unknown>): string[] =>
  champsRefuses(ChampsAntiRobotDto, corps);

describe('ChampsAntiRobotDto', () => {
  it('accepte un formulaire sans champ anti-robot', () => {
    expect(proprietesEnErreur({})).toEqual([]);
  });

  it('refuse un piege de plus de 200 caracteres', () => {
    expect(proprietesEnErreur({ website: 'x'.repeat(201) })).toEqual([
      'website',
    ]);
  });

  it('accepte une duree de saisie entiere et positive', () => {
    expect(proprietesEnErreur({ formFillDurationMs: 20_000 })).toEqual([]);
  });

  it('refuse une duree de saisie negative ou non entiere', () => {
    expect(proprietesEnErreur({ formFillDurationMs: -1 })).toEqual([
      'formFillDurationMs',
    ]);
    expect(proprietesEnErreur({ formFillDurationMs: 1.5 })).toEqual([
      'formFillDurationMs',
    ]);
  });

  it('refuse un horodatage negatif, non entier ou qui n est pas un nombre', () => {
    expect(proprietesEnErreur({ formStartedAt: -1 })).toEqual([
      'formStartedAt',
    ]);
    expect(proprietesEnErreur({ formStartedAt: 1.5 })).toEqual([
      'formStartedAt',
    ]);
    expect(proprietesEnErreur({ formStartedAt: 'hier' })).toEqual([
      'formStartedAt',
    ]);
  });

  it.each(FORMULAIRES_PUBLICS)(
    'le formulaire de %s herite des champs anti-robot',
    (_saisie, Formulaire) => {
      expect(Formulaire.prototype).toBeInstanceOf(ChampsAntiRobotDto);
    },
  );
});

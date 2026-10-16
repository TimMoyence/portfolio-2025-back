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

  it('refuse un horodatage negatif ou non entier', () => {
    expect(proprietesEnErreur({ formStartedAt: -1 })).toEqual([
      'formStartedAt',
    ]);
    expect(proprietesEnErreur({ formStartedAt: 1.5 })).toEqual([
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

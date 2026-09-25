import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  AcceptationDesConditions,
  VersionDesConditions,
} from './conditions-acceptees.decorator';

class ConsentementTemoin {
  @VersionDesConditions()
  termsVersion: string;

  @AcceptationDesConditions()
  termsAcceptedAt: Date;
}

const valider = (corps: Record<string, unknown>) => {
  const instance = plainToInstance(ConsentementTemoin, corps);
  return {
    instance,
    erreurs: validateSync(instance).map((erreur) => erreur.property),
  };
};

describe('conditions acceptees', () => {
  it('accepte une version et une date d acceptation valides', () => {
    const { instance, erreurs } = valider({
      termsVersion: '2026-04-10',
      termsAcceptedAt: '2026-04-10T10:00:00.000Z',
    });

    expect(erreurs).toEqual([]);
    expect(instance.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it('refuse une version de plus de 50 caracteres', () => {
    const { erreurs } = valider({
      termsVersion: 'v'.repeat(51),
      termsAcceptedAt: '2026-04-10T10:00:00.000Z',
    });

    expect(erreurs).toEqual(['termsVersion']);
  });

  it('refuse une date d acceptation illisible', () => {
    const { erreurs } = valider({
      termsVersion: '2026-04-10',
      termsAcceptedAt: 'pas une date',
    });

    expect(erreurs).toEqual(['termsAcceptedAt']);
  });
});

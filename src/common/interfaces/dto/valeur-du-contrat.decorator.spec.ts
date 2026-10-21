import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { ValeurDuContrat } from './valeur-du-contrat.decorator';

const COULEURS = ['rouge', 'vert'] as const;

class SaisieTemoin {
  @ValeurDuContrat(COULEURS, 'Couleur')
  couleur: string;

  @ValeurDuContrat(COULEURS, 'Couleur', { facultative: true })
  couleurFacultative?: string;

  @ValeurDuContrat(COULEURS, 'Couleur', { facultative: true, chaque: true })
  couleurs?: string[];
}

const documentationDe = (champ: string): Record<string, unknown> =>
  Reflect.getMetadata(
    DECORATORS.API_MODEL_PROPERTIES,
    SaisieTemoin.prototype,
    champ,
  ) as Record<string, unknown>;

describe('ValeurDuContrat', () => {
  it('accepte une valeur de la liste et l absence d une valeur facultative', () => {
    expect(
      champsRefuses(SaisieTemoin, { couleur: 'rouge', couleurs: ['vert'] }),
    ).toEqual([]);
  });

  it.each([['bleu'], [''], ['ROUGE'], [1]])('refuse %p', (valeur) => {
    expect(
      champsRefuses(SaisieTemoin, {
        couleur: valeur,
        couleurFacultative: valeur,
        couleurs: [valeur],
      }),
    ).toEqual(['couleur', 'couleurFacultative', 'couleurs']);
  });

  it('nomme la liste dans le contrat publie', () => {
    expect(documentationDe('couleur')).toMatchObject({
      enum: ['rouge', 'vert'],
      enumName: 'Couleur',
    });
    expect(documentationDe('couleurs')).toMatchObject({
      enumName: 'Couleur',
      isArray: true,
      required: false,
    });
  });
});

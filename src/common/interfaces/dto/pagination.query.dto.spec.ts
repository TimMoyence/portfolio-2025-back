import { champsRefuses } from '../../../../test/helpers/validation-pipe';
import { ChoixOptionnel } from './pagination.query.dto';

const COULEURS = ['rouge', 'vert'] as const;

class ChoixTemoin {
  @ChoixOptionnel(COULEURS, { exemple: 'vert', parDefaut: 'rouge' })
  couleur: (typeof COULEURS)[number] = 'rouge';
}

const erreursPour = (corps: Record<string, unknown>): string[] =>
  champsRefuses(ChoixTemoin, corps);

describe('ChoixOptionnel', () => {
  it('accepte une valeur de la liste', () => {
    expect(erreursPour({ couleur: 'vert' })).toEqual([]);
  });

  it('accepte l absence de valeur', () => {
    expect(erreursPour({})).toEqual([]);
  });

  it('refuse une valeur hors liste', () => {
    expect(erreursPour({ couleur: 'bleu' })).toEqual(['couleur']);
  });
});

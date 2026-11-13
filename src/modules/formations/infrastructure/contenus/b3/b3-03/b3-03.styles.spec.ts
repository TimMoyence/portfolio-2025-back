import { proprietesV2 } from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { COURS_B3_03 } from './b3-03.cours';

const stylesDeLaPage = (screenId: string): readonly string[] => {
  const { page } = proprietesV2(COURS_B3_03, screenId) as {
    page: { blocks: readonly { style: string }[] };
  };
  return page.blocks.map(({ style }) => style);
};

describe('B3-03 — la page des styles', () => {
  it('B303-05 dessine dans l’ordre les cinq styles que sa syntaxe nomme : Titre, Sous-titre, Titre 1, Titre 2, Normal', () => {
    expect(stylesDeLaPage('B3-03-A1-09-PAGE-STYLES')).toEqual([
      'title',
      'subtitle',
      'heading1',
      'heading2',
      'normal',
    ]);
  });
});

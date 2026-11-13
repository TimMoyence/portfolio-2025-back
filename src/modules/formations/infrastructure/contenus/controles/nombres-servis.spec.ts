import { nombresServisEgauxAuCentieme } from '../../../../../../test/helpers/formations/cours/recit-en-images';

const ecran = (reading: string) => [{ id: 'B2-09-A3-07-ARBRE', reading }];

describe('CONF-01 · nombres écrits dans le texte d’un écran servi', () => {
  it.each([
    ['environ 49 %', 0.49],
    ['la pente vaut −0,135 en 2', -0.14],
    ['la pente détachée vaut − 0,135 en 2', -0.14],
    ['la pente détachée vaut - 0,135 en 2', -0.14],
    ['la soustraction détachée P(R̄) = 1 − 0,083', 0.08],
    ['la soustraction détachée (1 − 0,2) − 0,135', 0.14],
    ['la soustraction détachée x² − 0,135', 0.14],
    ['la soustraction détachée 24 % − 18,5 %', 0.19],
    ['la soustraction détachée a − 0,135', 0.14],
    ['la soustraction détachée x̄ − 0,135', 0.14],
    ['la soustraction détachée CA − 0,135', 0.14],
    ['N(10) ≈ 2 509,62', 2509.62],
    ['une recette de 8 277 €', 8277],
    ['la pente vaut 0,135 sans son signe', -0.14],
  ])('voit « %s » égal au centième à %p', (texte, notee) => {
    expect(nombresServisEgauxAuCentieme(ecran(texte), [notee])).not.toEqual([]);
  });

  it.each([
    ['B2-09-A3-07, puis 2 509', 2.51],
    ['49 sans pourcentage', 0.49],
  ])('ne confond pas « %s » avec %p', (texte, notee) => {
    expect(nombresServisEgauxAuCentieme(ecran(texte), [notee])).toEqual([]);
  });
});

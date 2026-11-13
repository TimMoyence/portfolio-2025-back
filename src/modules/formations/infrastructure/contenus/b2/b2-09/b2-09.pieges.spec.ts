import { arrondi } from '../../../../../../common/domain/nombres/arrondi';
import { cueillirDansArbre } from '../../../../domain/cours/confidentialite/ArbreDeValeurs';
import { COURS_B2_09 } from './b2-09.cours';

interface Numerique {
  readonly type: 'numeric';
  readonly id: string;
  readonly pieges: readonly { valeur: number; confusion: string }[];
}

const estNumerique = (noeud: unknown): noeud is Numerique =>
  typeof noeud === 'object' &&
  noeud !== null &&
  'type' in noeud &&
  noeud.type === 'numeric';

const piegesDesNumeriques = () =>
  Object.fromEntries(
    cueillirDansArbre(COURS_B2_09.ecrans, (_, noeud) =>
      estNumerique(noeud) ? [noeud] : null,
    ).map(({ id, pieges }) => [
      id,
      pieges.map(({ valeur, confusion }) => [arrondi(valeur, 3), confusion]),
    ]),
  );

describe('B2-09 — chaque piège porte la confusion qui produit sa valeur', () => {
  it('B209-06 · rattache chaque piège des neuf questions numériques à l’erreur qui le calcule', () => {
    expect(piegesDesNumeriques()).toEqual({
      'b2-09-a2-intersection': [
        [0.95, 'branches-additionnees'],
        [0.55, 'intersection-pour-conditionnelle'],
      ],
      'b2-09-a2-chemin': [
        [0.12, 'complementaire-oublie'],
        [1.4, 'branches-additionnees'],
      ],
      'b2-09-a3-defaut': [
        [0.13, 'totales-sans-ponderation'],
        [0.028, 'totales-incompletes'],
      ],
      'b2-09-a3-sans-defaut': [[0.87, 'totales-sans-ponderation']],
      'b2-09-a3-rochefort': [
        [0.09, 'conditionnelle-inversee'],
        [0.027, 'intersection-pour-conditionnelle'],
        [0.3, 'condition-ignoree'],
      ],
      'b2-09-a3-la-rochelle': [
        [0.04, 'conditionnelle-inversee'],
        [0.7, 'condition-ignoree'],
      ],
      'b2-09-a4-mobile': [
        [0.12, 'intersection-pour-conditionnelle'],
        [0.6, 'conditionnelle-inversee'],
      ],
      'b2-09-a4-retard': [
        [0.21, 'totales-sans-ponderation'],
        [0.048, 'totales-incompletes'],
      ],
      'b2-09-a4-trois-fois': [
        [0.16, 'conditionnelle-inversee'],
        [0.3, 'condition-ignoree'],
      ],
    });
  });
});

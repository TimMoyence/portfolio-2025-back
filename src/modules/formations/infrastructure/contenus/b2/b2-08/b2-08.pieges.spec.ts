import { cueillirDansArbre } from '../../../../domain/cours/confidentialite/ArbreDeValeurs';
import { COURS_B2_08 } from './b2-08.cours';

interface OptionDeVote {
  readonly libelle: string;
  readonly confusion: string | null;
}

const estUneOption = (noeud: unknown): noeud is OptionDeVote =>
  typeof noeud === 'object' &&
  noeud !== null &&
  'libelle' in noeud &&
  'confusion' in noeud;

const options = (noeud: unknown): OptionDeVote[] =>
  cueillirDansArbre(noeud, (_, element) =>
    estUneOption(element) ? [element] : null,
  );

describe('B2-08 — l’exponentielle recopiée sans dériver', () => {
  it('B208-06 · nomme le k oublié pour e^(kx), et u′ oublié pour toute autre e^u recopiée', () => {
    expect(
      options(COURS_B2_08.ecrans)
        .filter(({ libelle }) => libelle.includes('l’exponentielle reste'))
        .map(({ libelle, confusion }) => [libelle, confusion]),
    ).toEqual([
      [
        '300e^(−0,5x), l’exponentielle reste la même',
        'derivee-de-l-exponentielle-sans-k',
      ],
      ['e^(x²), l’exponentielle reste la même', 'u-prime-oublie'],
      ['e^(3x²) : l’exponentielle reste la même', 'u-prime-oublie'],
    ]);
  });
});

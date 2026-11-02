import { recopier } from '../../../../../test/helpers/feuille-de-cours';
import {
  clicsDeRecopie,
  colonneRecopiee,
  gesteDeRecopie,
  gesteDeRecopieVersLaDroite,
  ligneRecopiee,
} from './feuilles';

describe('B-21 · une colonne recopiée vers le bas comme le tableur', () => {
  const RECOPIES: readonly [string, readonly string[]][] = [
    ['=B2*$C$1', ['=B3*$C$1', '=B4*$C$1']],
    ['=SOMME(B$2:B2)', ['=SOMME(B$2:B3)', '=SOMME(B$2:B4)']],
    ['=$B2*C$1', ['=$B3*C$1', '=$B4*C$1']],
    ['=I2+Z9', ['=I3+Z10', '=I4+Z11']],
    ['=AB2*2', ['=AB3*2', '=AB4*2']],
    ['=SI(A2="lot B2";1;0)', ['=SI(A3="lot B2";1;0)', '=SI(A4="lot B2";1;0)']],
  ];

  it.each(RECOPIES)(
    'recopie %s de deux lignes vers le bas',
    (formule, recopies) => {
      expect(
        colonneRecopiee(
          { colonne: 'C', premiereLigne: 2, formule },
          [1, 2, 3],
        ).map((attendu) => attendu.formuleReference),
      ).toEqual([formule, ...recopies]);
    },
  );

  it.each(RECOPIES)(
    'la feuille de test recopie %s comme le cours',
    (formule, recopies) => {
      expect(recopier(formule, 'C', 2, 4)).toEqual({
        C2: formule,
        C3: recopies[0],
        C4: recopies[1],
      });
    },
  );
});

describe('QA-11 · geste de recopie d’un atelier tableur, un clic par ligne', () => {
  it.each([
    [1, 'cliquez une fois sur « Recopier vers le bas »'],
    [4, 'cliquez quatre fois sur « Recopier vers le bas »'],
    [15, 'cliquez quinze fois sur « Recopier vers le bas »'],
    [17, 'cliquez dix-sept fois sur « Recopier vers le bas »'],
  ])('écrit %i clic(s) en lettres', (clics, attendu) => {
    expect(clicsDeRecopie(clics)).toBe(attendu);
  });

  it.each([0, -1, 2.5, 21, Number.NaN])(
    'refuse une recopie de %p clic(s)',
    (clics) => {
      expect(() => clicsDeRecopie(clics)).toThrow(RangeError);
    },
  );

  it('compte les clics de la cellule source à la dernière ligne recopiée', () => {
    expect(gesteDeRecopie(['D2'], 5)).toBe(
      'sélectionnez D2 et cliquez trois fois sur « Recopier vers le bas », une ligne par clic',
    );
  });

  it('nomme chaque colonne recopiée jusqu’à la même ligne', () => {
    expect(gesteDeRecopie(['D2', 'E2'], 6)).toBe(
      'sélectionnez D2 et cliquez quatre fois sur « Recopier vers le bas », une ligne par clic, puis de même depuis E2',
    );
  });
});

describe('B102-M8 · une ligne recopiée vers la droite comme le tableur', () => {
  it('décale les colonnes de la formule, la base figée ne bouge pas', () => {
    const attendus = ligneRecopiee(
      {
        colonne: 'C',
        premiereLigne: 3,
        formule: '=ARRONDI(C2/$B$2*100;1)',
        confusionSiErreur: 'reference-non-figee-en-ligne',
      },
      [116.7, 233.3, 483.3],
    );

    expect(
      attendus.map(({ reference, formuleReference, valeur, forme }) => ({
        reference,
        formuleReference,
        valeur,
        forme,
      })),
    ).toEqual([
      {
        reference: 'C3',
        formuleReference: '=ARRONDI(C2/$B$2*100;1)',
        valeur: 116.7,
        forme: 'references',
      },
      {
        reference: 'D3',
        formuleReference: '=ARRONDI(D2/$B$2*100;1)',
        valeur: 233.3,
        forme: { memeQue: 'C3' },
      },
      {
        reference: 'E3',
        formuleReference: '=ARRONDI(E2/$B$2*100;1)',
        valeur: 483.3,
        forme: { memeQue: 'C3' },
      },
    ]);
  });

  it('écrit le geste vers la droite, un clic par cellule', () => {
    expect(clicsDeRecopie(2, 'droite')).toBe(
      'cliquez deux fois sur « Recopier vers la droite »',
    );
    expect(gesteDeRecopieVersLaDroite('C3', 'E')).toBe(
      'sélectionnez C3 et cliquez deux fois sur « Recopier vers la droite », une cellule par clic',
    );
  });
});
